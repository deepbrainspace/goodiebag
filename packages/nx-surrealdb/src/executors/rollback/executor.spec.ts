import { ExecutorContext, logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import executor from './executor';
import { RollbackExecutorSchema } from './executor';
import { MigrationService } from '../../lib/domain/migration-service';

jest.mock('../../lib/domain/migration-service');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const MockMigrationService = MigrationService as jest.MockedClass<typeof MigrationService>;

describe('Rollback Executor', () => {
  let mockEngine: jest.Mocked<MigrationService>;
  let context: ExecutorContext;

  const defaultOptions: RollbackExecutorSchema = {
    url: 'ws://localhost:8000',
    user: 'root',
    pass: 'root',
    namespace: 'test',
    database: 'test',
    initPath: 'database',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const tree = createTreeWithEmptyWorkspace();
    context = {
      root: tree.root,
      cwd: process.cwd(),
      isVerbose: false,
      projectName: 'test-project',
      projectsConfigurations: {
        version: 2,
        projects: {},
      },
      nxJsonConfiguration: {},
      projectGraph: {
        nodes: {},
        dependencies: {},
      },
    };

    // Setup mock engine
    mockEngine = {
      initialize: jest.fn().mockResolvedValue(undefined),
      findPendingMigrations: jest.fn().mockResolvedValue([]),
      executeMigrations: jest.fn().mockResolvedValue({
        success: true,
        filesProcessed: 0,
        filesSkipped: 0,
        executionTimeMs: 100,
        results: [],
      }),
      validateRollback: jest.fn().mockResolvedValue({
        canRollback: true,
        blockedBy: [],
        warnings: [],
        migrationChecks: [],
      }),
      getMigrationStatus: jest.fn().mockResolvedValue({
        modules: [],
        totalApplied: 0,
        totalPending: 0,
      }),
      resolveTargetModules: jest
        .fn()
        .mockImplementation((modules: string[]) => modules.map(m => `010_${m}`)),
      resolveRollbackFilenames: jest.fn().mockResolvedValue({
        resolved: [],
        warnings: [],
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };

    MockMigrationService.mockImplementation(() => mockEngine);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('basic execution', () => {
    it('should execute rollback successfully', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      mockEngine.executeMigrations.mockResolvedValue({
        success: true,
        filesProcessed: 1,
        filesSkipped: 0,
        executionTimeMs: 150,
        results: [
          {
            file: {
              number: '0002',
              name: 'roles',
              direction: 'down' as const,
              filename: '0002_roles_down.surql',
              filePath: '/path/to/010_auth/0002_roles_down.surql',
              moduleId: '010_auth',
              content: '-- rollback roles',
              checksum: 'def456',
            },
            success: true,
            executionTimeMs: 150,
          },
        ],
      });

      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockEngine.initialize).toHaveBeenCalledWith({
        url: 'ws://localhost:8000',
        user: 'root',
        pass: 'root',
        namespace: 'test',
        database: 'test',
        envFile: undefined,
        useTransactions: undefined,
        initPath: 'database',
        schemaPath: undefined,
        force: false,
        configPath: undefined,
        debug: undefined,
        dryRun: false,
      });
      expect(mockEngine.validateRollback).toHaveBeenCalledWith(['auth']);
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(
        ['010_auth'],
        'rollback',
        undefined
      );
      expect(mockEngine.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('✅ Rollback completed successfully!');
    });

    it('should handle rollback failures', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      mockEngine.executeMigrations.mockResolvedValue({
        success: false,
        filesProcessed: 0,
        filesSkipped: 0,
        executionTimeMs: 100,
        results: [
          {
            file: {
              number: '0002',
              name: 'roles',
              direction: 'down' as const,
              filename: '0002_roles_down.surql',
              filePath: '/path/to/010_auth/0002_roles_down.surql',
              moduleId: '010_auth',
              content: '-- rollback roles',
              checksum: 'def456',
            },
            success: false,
            executionTimeMs: 50,
            error: 'SQL constraint violation',
          },
        ],
      });

      const result = await executor(options, context);

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('❌ Rollback failed!');
      expect(logger.error).toHaveBeenCalledWith(
        '   ❌ 010_auth/0002_roles_down.surql: SQL constraint violation'
      );
    });

    it('should handle engine initialization errors', async () => {
      mockEngine.initialize.mockRejectedValue(new Error('Connection failed'));

      const result = await executor(defaultOptions, context);

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('💥 Rollback execution failed:');
      expect(logger.error).toHaveBeenCalledWith('Connection failed');
      expect(mockEngine.close).toHaveBeenCalled();
    });
  });

  describe('safety validation', () => {
    it('should validate rollback safety for targeted modules', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      await executor(options, context);

      expect(mockEngine.validateRollback).toHaveBeenCalledWith(['auth']);
      expect(logger.info).toHaveBeenCalledWith('🔍 Validating rollback safety...');
      expect(logger.info).toHaveBeenCalledWith('✅ Rollback safety validation passed');
    });

    it('should block unsafe rollbacks', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      mockEngine.validateRollback.mockResolvedValue({
        canRollback: false,
        blockedBy: ['020_schema', '030_communications'],
        warnings: ['Module auth has active dependents'],
        migrationChecks: [],
      });

      const result = await executor(options, context);

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('❌ Rollback validation failed!');
      expect(logger.error).toHaveBeenCalledWith('   • 020_schema');
      expect(logger.error).toHaveBeenCalledWith('   • 030_communications');
      expect(logger.error).toHaveBeenCalledWith('   • Module auth has active dependents');
      expect(logger.info).toHaveBeenCalledWith(
        '   Option 2: Use --force to bypass safety checks (not recommended)'
      );
      expect(mockEngine.executeMigrations).not.toHaveBeenCalled();
    });

    it('should show warnings but continue with safe rollbacks', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      mockEngine.validateRollback.mockResolvedValue({
        canRollback: true,
        blockedBy: [],
        warnings: ['Some data may be lost during rollback'],
        migrationChecks: [],
      });

      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith('⚠️  Rollback warnings:');
      expect(logger.warn).toHaveBeenCalledWith('   • Some data may be lost during rollback');
      expect(mockEngine.executeMigrations).toHaveBeenCalled();
    });

    it('should bypass safety checks when force is enabled', async () => {
      const options = { ...defaultOptions, module: 'auth', force: true };

      await executor(options, context);

      expect(mockEngine.validateRollback).not.toHaveBeenCalled();
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(
        ['010_auth'],
        'rollback',
        undefined
      );
    });

    it('should skip validation for global rollbacks', async () => {
      const options = { ...defaultOptions }; // No module specified

      await executor(options, context);

      expect(mockEngine.validateRollback).toHaveBeenCalledWith(undefined);
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'rollback', undefined);
    });
  });

  describe('module targeting', () => {
    it('should target specific module by name', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      await executor(options, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(
        ['010_auth'],
        'rollback',
        undefined
      );
    });

    it('should target specific module by number', async () => {
      const options = { ...defaultOptions, module: 10 };

      await executor(options, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(['010_10'], 'rollback', undefined);
    });

    it('should rollback all modules when no module specified', async () => {
      await executor(defaultOptions, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'rollback', undefined);
    });
  });

  describe('dry run mode', () => {
    it('should show pending rollbacks without executing them', async () => {
      mockEngine.findPendingMigrations.mockResolvedValue([
        {
          number: '0002',
          name: 'roles',
          direction: 'down',
          filename: '0002_roles_down.surql',
          filePath: '/path/to/010_auth/0002_roles_down.surql',
          moduleId: '010_auth',
          content: '-- rollback roles',
          checksum: 'def456',
        },
        {
          number: '0001',
          name: 'users',
          direction: 'down',
          filename: '0001_users_down.surql',
          filePath: '/path/to/010_auth/0001_users_down.surql',
          moduleId: '010_auth',
          content: '-- rollback users',
          checksum: 'abc123',
        },
      ]);

      const options = { ...defaultOptions, dryRun: true };
      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'rollback', undefined);
      expect(logger.info).toHaveBeenCalledWith(
        '🔍 Dry run mode - showing rollback migrations without executing them'
      );
    });

    it('should handle dry run with no pending rollbacks', async () => {
      mockEngine.findPendingMigrations.mockResolvedValue([]);

      const options = { ...defaultOptions, dryRun: true };
      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'rollback', undefined);
    });

    it('should respect module targeting in dry run', async () => {
      const options = { ...defaultOptions, dryRun: true, module: 'auth' };

      await executor(options, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(
        ['010_auth'],
        'rollback',
        undefined
      );
    });

    it('should apply steps limit in dry run', async () => {
      mockEngine.findPendingMigrations.mockResolvedValue([
        {
          number: '0003',
          name: 'permissions',
          direction: 'down',
          filename: '0003_permissions_down.surql',
          filePath: '/path/to/010_auth/0003_permissions_down.surql',
          moduleId: '010_auth',
          content: '-- rollback permissions',
          checksum: 'ghi789',
        },
        {
          number: '0002',
          name: 'roles',
          direction: 'down',
          filename: '0002_roles_down.surql',
          filePath: '/path/to/010_auth/0002_roles_down.surql',
          moduleId: '010_auth',
          content: '-- rollback roles',
          checksum: 'def456',
        },
        {
          number: '0001',
          name: 'users',
          direction: 'down',
          filename: '0001_users_down.surql',
          filePath: '/path/to/010_auth/0001_users_down.surql',
          moduleId: '010_auth',
          content: '-- rollback users',
          checksum: 'abc123',
        },
      ]);

      const options = { ...defaultOptions, dryRun: true, steps: 2 };
      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'rollback', undefined);
      expect(logger.info).toHaveBeenCalledWith(
        '🔍 Dry run mode - showing rollback migrations without executing them'
      );
    });
  });

  describe('configuration options', () => {
    it('should pass all configuration options to engine', async () => {
      const options: RollbackExecutorSchema = {
        url: 'ws://custom:8000',
        user: 'custom_user',
        pass: 'custom_pass',
        namespace: 'custom_ns',
        database: 'custom_db',
        envFile: '.env.custom',
        useTransactions: false,
        initPath: 'custom/migrations',
        schemaPath: 'custom/schema.sql',
        force: true,
        configPath: 'custom/config.json',
      };

      await executor(options, context);

      expect(mockEngine.initialize).toHaveBeenCalledWith({
        url: 'ws://custom:8000',
        user: 'custom_user',
        pass: 'custom_pass',
        namespace: 'custom_ns',
        database: 'custom_db',
        envFile: '.env.custom',
        useTransactions: false,
        initPath: 'custom/migrations',
        schemaPath: 'custom/schema.sql',
        force: true,
        configPath: 'custom/config.json',
        debug: undefined,
        dryRun: false,
      });
    });

    it('should use default values for missing options', async () => {
      const options: RollbackExecutorSchema = {};

      await executor(options, context);

      expect(mockEngine.initialize).toHaveBeenCalledWith({
        url: '',
        user: '',
        pass: '',
        namespace: undefined,
        database: undefined,
        envFile: undefined,
        useTransactions: undefined,
        initPath: 'database',
        schemaPath: undefined,
        force: false,
        configPath: undefined,
        debug: undefined,
        dryRun: false,
      });
    });
  });

  describe('logging and output', () => {
    it('should log skipped rollbacks', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      mockEngine.executeMigrations.mockResolvedValue({
        success: true,
        filesProcessed: 0,
        filesSkipped: 1,
        executionTimeMs: 100,
        results: [
          {
            file: {
              number: '0002',
              name: 'roles',
              direction: 'down' as const,
              filename: '0002_roles_down.surql',
              filePath: '/path/to/010_auth/0002_roles_down.surql',
              moduleId: '010_auth',
              content: '-- rollback roles',
              checksum: 'def456',
            },
            success: false,
            executionTimeMs: 50,
            skipped: true,
            skipReason: 'No matching up migration found',
          },
        ],
      });

      await executor(options, context);

      expect(logger.info).toHaveBeenCalledWith('   Files skipped: 1');
      expect(logger.info).toHaveBeenCalledWith(
        '   ⏭️ 010_auth/0002_roles_down.surql (No matching up migration found)'
      );
    });

    it('should log detailed execution statistics', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      mockEngine.executeMigrations.mockResolvedValue({
        success: true,
        filesProcessed: 2,
        filesSkipped: 1,
        executionTimeMs: 350,
        results: [],
      });

      await executor(options, context);

      expect(logger.info).toHaveBeenCalledWith('   Files processed: 2');
      expect(logger.info).toHaveBeenCalledWith('   Files skipped: 1');
      expect(logger.info).toHaveBeenCalledWith('   Execution time: 350ms');
    });
  });
});

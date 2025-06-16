import { ExecutorContext, logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import executor from './executor';
import { MigrateExecutorSchema } from './executor';
import { MigrationService } from '../../lib/domain/migration-service';

jest.mock('../../lib/domain/migration-service');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

const MockMigrationService = MigrationService as jest.MockedClass<typeof MigrationService>;

describe('Migrate Executor', () => {
  let mockEngine: jest.Mocked<MigrationService>;
  let context: ExecutorContext;
  
  const defaultOptions: MigrateExecutorSchema = {
    url: 'ws://localhost:8000',
    user: 'root',
    pass: 'root',
    namespace: 'test',
    database: 'test',
    initPath: 'database'
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
        projects: {}
      },
      nxJsonConfiguration: {},
      projectGraph: {
        nodes: {},
        dependencies: {}
      }
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
        results: []
      }),
      validateRollback: jest.fn().mockResolvedValue({
        canRollback: true,
        blockedBy: [],
        warnings: [],
        migrationChecks: []
      }),
      getMigrationStatus: jest.fn().mockResolvedValue({
        modules: [],
        totalApplied: 0,
        totalPending: 0
      }),
      resolveTargetModules: jest.fn().mockImplementation((modules: string[]) => modules.map(m => `010_${m}`)),
      resolveRollbackFilenames: jest.fn().mockResolvedValue({
        resolved: [],
        warnings: []
      }),
      getConfig: jest.fn().mockReturnValue({
        databases: {},
        lockManager: { type: 'file', lockDir: '.locks' }
      }),
      resolveTargetFilenames: jest.fn().mockResolvedValue([]),
      getFileStatus: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined)
    };

    MockMigrationService.mockImplementation(() => mockEngine);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('basic execution', () => {
    it('should execute migrations successfully', async () => {
      mockEngine.executeMigrations.mockResolvedValue({
        success: true,
        filesProcessed: 2,
        filesSkipped: 0,
        executionTimeMs: 150,
        results: [
          {
            file: {
              number: '0001',
              name: 'setup',
              direction: 'up' as const,
              filename: '0001_setup_up.surql',
              filePath: '/path/to/000_admin/0001_setup_up.surql',
              moduleId: '000_admin',
              content: '-- setup content',
              checksum: 'abc123'
            },
            success: true,
            executionTimeMs: 75
          },
          {
            file: {
              number: '0001',
              name: 'users',
              direction: 'up' as const,
              filename: '0001_users_up.surql',
              filePath: '/path/to/010_auth/0001_users_up.surql',
              moduleId: '010_auth',
              content: '-- users content',
              checksum: 'def456'
            },
            success: true,
            executionTimeMs: 75
          }
        ]
      });

      const result = await executor(defaultOptions, context);

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
        dryRun: false
      });
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'migrate', undefined);
      expect(mockEngine.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('✅ Migration completed successfully!');
    });

    it('should handle migration failures', async () => {
      mockEngine.executeMigrations.mockResolvedValue({
        success: false,
        filesProcessed: 1,
        filesSkipped: 0,
        executionTimeMs: 100,
        results: [
          {
            file: {
              number: '0001',
              name: 'setup',
              direction: 'up' as const,
              filename: '0001_setup_up.surql',
              filePath: '/path/to/000_admin/0001_setup_up.surql',
              moduleId: '000_admin',
              content: '-- setup content',
              checksum: 'abc123'
            },
            success: false,
            executionTimeMs: 50,
            error: 'SQL syntax error'
          }
        ]
      });

      const result = await executor(defaultOptions, context);

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('❌ Migration failed!');
      expect(logger.error).toHaveBeenCalledWith('   ❌ 000_admin/0001_setup_up.surql: SQL syntax error');
    });

    it('should handle engine initialization errors', async () => {
      mockEngine.initialize.mockRejectedValue(new Error('Connection failed'));

      const result = await executor(defaultOptions, context);

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('💥 Migration execution failed:');
      expect(logger.error).toHaveBeenCalledWith('Connection failed');
      expect(mockEngine.close).toHaveBeenCalled();
    });
  });

  describe('module targeting', () => {
    it('should target specific module by name', async () => {
      const options = { ...defaultOptions, module: 'auth' };
      
      await executor(options, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(['auth'], 'migrate', undefined);
    });

    it('should target specific module by number', async () => {
      const options = { ...defaultOptions, module: 10 };
      
      await executor(options, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(['10'], 'migrate', undefined);
    });

    it('should run all modules when no module specified', async () => {
      await executor(defaultOptions, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'migrate', undefined);
    });
  });

  describe('dry run mode', () => {
    it('should show pending migrations without executing them', async () => {
      mockEngine.findPendingMigrations.mockResolvedValue([
        {
          number: '0001',
          name: 'setup',
          direction: 'up',
          filename: '0001_setup_up.surql',
          filePath: '/path/to/000_admin/0001_setup_up.surql',
          moduleId: '000_admin',
          content: '-- setup content',
          checksum: 'abc123'
        },
        {
          number: '0001',
          name: 'users',
          direction: 'up',
          filename: '0001_users_up.surql',
          filePath: '/path/to/010_auth/0001_users_up.surql',
          moduleId: '010_auth',
          content: '-- users content',
          checksum: 'def456'
        }
      ]);

      const options = { ...defaultOptions, dryRun: true };
      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'migrate', undefined);
      expect(logger.info).toHaveBeenCalledWith('Dry run mode - showing pending migrations without applying them');
    });

    it('should handle dry run with no pending migrations', async () => {
      mockEngine.findPendingMigrations.mockResolvedValue([]);

      const options = { ...defaultOptions, dryRun: true };
      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(undefined, 'migrate', undefined);
    });

    it('should respect module targeting in dry run', async () => {
      const options = { ...defaultOptions, dryRun: true, module: 'auth' };
      
      await executor(options, context);

      expect(mockEngine.executeMigrations).toHaveBeenCalledWith(['auth'], 'migrate', undefined);
    });
  });

  describe('configuration options', () => {
    it('should pass all configuration options to engine', async () => {
      const options: MigrateExecutorSchema = {
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
        configPath: 'custom/config.json'
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
        dryRun: false
      });
    });

    it('should use default values for missing options', async () => {
      const options: MigrateExecutorSchema = {};

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
        dryRun: false
      });
    });
  });

  describe('logging and output', () => {
    it('should log skipped migrations', async () => {
      mockEngine.executeMigrations.mockResolvedValue({
        success: true,
        filesProcessed: 1,
        filesSkipped: 1,
        executionTimeMs: 100,
        results: [
          {
            file: {
              number: '0001',
              name: 'setup',
              direction: 'up' as const,
              filename: '0001_setup_up.surql',
              filePath: '/path/to/000_admin/0001_setup_up.surql',
              moduleId: '000_admin',
              content: '-- setup content',
              checksum: 'abc123'
            },
            success: false,
            executionTimeMs: 50,
            skipped: true,
            skipReason: 'Already applied'
          }
        ]
      });

      await executor(defaultOptions, context);

      expect(logger.info).toHaveBeenCalledWith('   Files skipped: 1');
      expect(logger.info).toHaveBeenCalledWith('   ⏭️ 000_admin/0001_setup_up.surql (Already applied)');
    });

    it('should log detailed execution statistics', async () => {
      mockEngine.executeMigrations.mockResolvedValue({
        success: true,
        filesProcessed: 3,
        filesSkipped: 1,
        executionTimeMs: 250,
        results: []
      });

      await executor(defaultOptions, context);

      expect(logger.info).toHaveBeenCalledWith('   Files processed: 3');
      expect(logger.info).toHaveBeenCalledWith('   Files skipped: 1');
      expect(logger.info).toHaveBeenCalledWith('   Execution time: 250ms');
    });
  });
});
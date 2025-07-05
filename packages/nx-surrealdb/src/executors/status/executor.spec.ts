import { ExecutorContext, logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import executor from './executor';
import { StatusExecutorSchema } from './executor';
import { MigrationService } from '../../lib/domain/migration-service';
import { ModuleLockManager } from '../../lib/domain/module-lock-manager';

jest.mock('../../lib/domain/migration-service');
jest.mock('../../lib/domain/module-lock-manager');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const MockMigrationService = MigrationService as jest.MockedClass<typeof MigrationService>;
const MockModuleLockManager = ModuleLockManager as jest.MockedClass<typeof ModuleLockManager>;

describe('Status Executor', () => {
  let mockEngine: jest.Mocked<MigrationService>;
  let mockLockManager: jest.Mocked<ModuleLockManager>;
  let context: ExecutorContext;
  let consoleLogSpy: jest.SpyInstance;

  const defaultOptions: StatusExecutorSchema = {
    url: 'ws://localhost:8000',
    user: 'root',
    pass: 'root',
    namespace: 'test',
    database: 'test',
    initPath: 'database',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Set test environment to skip dependency checks
    process.env.NODE_ENV = 'test';

    // Mock environment variables to prevent env var warnings
    process.env.SURREALDB_URL = 'ws://localhost:8000';
    process.env.SURREALDB_ROOT_USER = 'root';
    process.env.SURREALDB_ROOT_PASS = 'root';

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
      getConfig: jest.fn().mockReturnValue({
        databases: {},
        lockManager: { type: 'file', lockDir: '.locks' },
      }),
      resolveTargetFilenames: jest.fn().mockResolvedValue([]),
      getFileStatus: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined),
    };

    MockMigrationService.mockImplementation(() => mockEngine);

    // Setup mock lock manager
    mockLockManager = {
      validateModuleLock: jest.fn().mockReturnValue({
        isLocked: false,
        reason: undefined,
        lockIcon: '',
      }),
      isModuleLocked: jest.fn().mockReturnValue(false),
      getModuleLockReason: jest.fn().mockReturnValue(undefined),
      validateRollbackLock: jest.fn().mockReturnValue({
        blockedModules: [],
        lockReasons: {},
      }),
      getLockedModules: jest.fn().mockReturnValue([]),
      validateMigrationLock: jest.fn().mockReturnValue({
        canMigrate: true,
        blockedModules: [],
        lockReasons: {},
      }),
    };

    MockModuleLockManager.createLockManager = jest.fn().mockReturnValue(mockLockManager);
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleLogSpy.mockRestore();

    // Clean up environment variables
    delete process.env.NODE_ENV;
    delete process.env.SURREALDB_URL;
    delete process.env.SURREALDB_ROOT_USER;
    delete process.env.SURREALDB_ROOT_PASS;
  });

  describe('basic functionality', () => {
    it('should show status successfully', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue({
        modules: [
          {
            moduleId: '000_admin',
            appliedMigrations: 2,
            pendingMigrations: 0,
            lastApplied: new Date('2024-01-01T10:00:00Z'),
            dependencies: [],
            dependents: ['010_auth'],
          },
          {
            moduleId: '010_auth',
            appliedMigrations: 1,
            pendingMigrations: 1,
            lastApplied: new Date('2024-01-01T11:00:00Z'),
            dependencies: ['000_admin'],
            dependents: [],
          },
        ],
        totalApplied: 3,
        totalPending: 1,
      });

      // Mock findPendingMigrations for the enhanced non-detailed output
      mockEngine.findPendingMigrations.mockResolvedValue([
        {
          number: '0002',
          name: 'roles',
          direction: 'up',
          filename: '0002_roles_up.surql',
          filePath: '/path/to/010_auth/0002_roles_up.surql',
          moduleId: '010_auth',
          content: '-- create roles',
          checksum: 'def456',
        },
      ]);

      const result = await executor(defaultOptions, context);

      expect(result.success).toBe(true);
      expect(mockEngine.initialize).toHaveBeenCalledWith({
        url: 'ws://localhost:8000',
        user: 'root',
        pass: 'root',
        namespace: 'test',
        database: 'test',
        envFile: undefined,
        useTransactions: true,
        initPath: 'database',
        schemaPath: undefined,
        force: false,
        configPath: undefined,
      });
      expect(mockEngine.getMigrationStatus).toHaveBeenCalledWith(undefined);
      expect(mockEngine.close).toHaveBeenCalled();

      // Test the enhanced non-detailed output format
      expect(logger.info).toHaveBeenCalledWith('1 migration(s) pending, 3 applied\n');
      expect(logger.info).toHaveBeenCalledWith('📦 010_auth: 1 pending');
      expect(logger.info).toHaveBeenCalledWith('   🔄 0002_roles_up.surql');
    });

    it('should handle empty migration modules', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue({
        modules: [],
        totalApplied: 0,
        totalPending: 0,
      });

      const result = await executor(defaultOptions, context);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('No migration modules found');
    });

    it('should handle engine initialization errors', async () => {
      mockEngine.initialize.mockRejectedValue(new Error('Connection failed'));

      const result = await executor(defaultOptions, context);

      expect(result.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('💥 Status check failed:');
      expect(logger.error).toHaveBeenCalledWith('Connection failed');
      expect(mockEngine.close).toHaveBeenCalled();
    });
  });

  describe('module targeting', () => {
    it('should target specific module by name', async () => {
      const options = { ...defaultOptions, module: 'auth' };

      await executor(options, context);

      expect(mockEngine.getMigrationStatus).toHaveBeenCalledWith(['auth']);
    });

    it('should target specific module by number', async () => {
      const options = { ...defaultOptions, module: 10 };

      await executor(options, context);

      expect(mockEngine.getMigrationStatus).toHaveBeenCalledWith(['10']);
    });

    it('should show all modules when no module specified', async () => {
      await executor(defaultOptions, context);

      expect(mockEngine.getMigrationStatus).toHaveBeenCalledWith(undefined);
    });
  });

  describe('output formats', () => {
    const mockStatusData = {
      modules: [
        {
          moduleId: '000_admin',
          appliedMigrations: 2,
          pendingMigrations: 0,
          lastApplied: new Date('2024-01-01T10:00:00Z'),
          dependencies: [],
          dependents: ['010_auth'],
        },
        {
          moduleId: '010_auth',
          appliedMigrations: 1,
          pendingMigrations: 1,
          lastApplied: new Date('2024-01-01T11:00:00Z'),
          dependencies: ['000_admin'],
          dependents: [],
        },
      ],
      totalApplied: 3,
      totalPending: 1,
    };

    it('should output JSON format when requested', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue(mockStatusData);

      const options = { ...defaultOptions, json: true };
      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"totalApplied": 3'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"totalPending": 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"moduleId": "000_admin"')
      );
    });

    it('should show human-readable format by default', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue(mockStatusData);

      const result = await executor({ ...defaultOptions, detailed: true }, context);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('\n📈 Migration Status Summary');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('000_admin'));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('010_auth'));
      expect(logger.info).toHaveBeenCalledWith('\n🌐 Dependency Graph:');
    });
  });

  describe('detailed information', () => {
    const mockStatusData = {
      modules: [
        {
          moduleId: '010_auth',
          appliedMigrations: 1,
          pendingMigrations: 2,
          lastApplied: new Date('2024-01-01T11:00:00Z'),
          dependencies: ['000_admin'],
          dependents: [],
        },
      ],
      totalApplied: 1,
      totalPending: 2,
    };

    it('should show detailed migration information when requested', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue(mockStatusData);
      mockEngine.findPendingMigrations.mockResolvedValue([
        {
          number: '0002',
          name: 'roles',
          direction: 'up',
          filename: '0002_roles_up.surql',
          filePath: '/path/to/010_auth/0002_roles_up.surql',
          moduleId: '010_auth',
          content: '-- create roles',
          checksum: 'def456',
        },
        {
          number: '0003',
          name: 'permissions',
          direction: 'up',
          filename: '0003_permissions_up.surql',
          filePath: '/path/to/010_auth/0003_permissions_up.surql',
          moduleId: '010_auth',
          content: '-- create permissions',
          checksum: 'ghi789',
        },
      ]);

      const options = { ...defaultOptions, detailed: true };
      const result = await executor(options, context);

      expect(result.success).toBe(true);
      expect(mockEngine.findPendingMigrations).toHaveBeenCalledWith(['010_auth']);
      expect(logger.info).toHaveBeenCalledWith('      Pending Files:');
      expect(logger.info).toHaveBeenCalledWith('        • 0002_roles_up.surql');
      expect(logger.info).toHaveBeenCalledWith('        • 0003_permissions_up.surql');
    });

    it('should call findPendingMigrations for enhanced non-detailed output when there are pending migrations', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue(mockStatusData);
      mockEngine.findPendingMigrations.mockResolvedValue([
        {
          number: '0002',
          name: 'roles',
          direction: 'up',
          filename: '0002_roles_up.surql',
          filePath: '/path/to/010_auth/0002_roles_up.surql',
          moduleId: '010_auth',
          content: '-- create roles',
          checksum: 'def456',
        },
      ]);

      const options = { ...defaultOptions, detailed: false };
      await executor(options, context);

      // Enhanced non-detailed output now calls findPendingMigrations to show specific pending files
      expect(mockEngine.findPendingMigrations).toHaveBeenCalledWith(['010_auth']);
    });
  });

  describe('dependency visualization', () => {
    it('should show dependency graph with proper tree structure', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue({
        modules: [
          {
            moduleId: '000_admin',
            appliedMigrations: 1,
            pendingMigrations: 0,
            dependencies: [],
            dependents: ['010_auth', '020_schema'],
          },
          {
            moduleId: '010_auth',
            appliedMigrations: 1,
            pendingMigrations: 0,
            dependencies: ['000_admin'],
            dependents: ['030_communications'],
          },
          {
            moduleId: '020_schema',
            appliedMigrations: 1,
            pendingMigrations: 0,
            dependencies: ['000_admin'],
            dependents: [],
          },
          {
            moduleId: '030_communications',
            appliedMigrations: 1,
            pendingMigrations: 0,
            dependencies: ['010_auth'],
            dependents: [],
          },
        ],
        totalApplied: 4,
        totalPending: 0,
      });

      const result = await executor({ ...defaultOptions, detailed: true }, context);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('\n🌐 Dependency Graph:');

      // Check that all modules appear in some form in the dependency graph
      const allCalls = (logger.info as jest.Mock).mock.calls.map(call => call[0]);
      expect(allCalls.some(call => call.includes('000_admin'))).toBe(true);
      expect(allCalls.some(call => call.includes('010_auth'))).toBe(true);
      expect(allCalls.some(call => call.includes('020_schema'))).toBe(true);
      expect(allCalls.some(call => call.includes('030_communications'))).toBe(true);
    });

    it('should show isolated modules', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue({
        modules: [
          {
            moduleId: '000_admin',
            appliedMigrations: 1,
            pendingMigrations: 0,
            dependencies: [],
            dependents: [],
          },
          {
            moduleId: '010_auth',
            appliedMigrations: 1,
            pendingMigrations: 0,
            dependencies: ['999_missing'],
            dependents: [],
          },
        ],
        totalApplied: 2,
        totalPending: 0,
      });

      const result = await executor({ ...defaultOptions, detailed: true }, context);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('\n🌐 Dependency Graph:');

      // Check that modules appear in dependency graph
      const allCalls = (logger.info as jest.Mock).mock.calls.map(call => call[0]);
      expect(allCalls.some(call => call.includes('000_admin'))).toBe(true);
      expect(allCalls.some(call => call.includes('010_auth'))).toBe(true);
    });
  });

  describe('status indicators', () => {
    it('should show correct status for up-to-date modules', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue({
        modules: [
          {
            moduleId: '000_admin',
            appliedMigrations: 2,
            pendingMigrations: 0,
            lastApplied: new Date('2024-01-01T10:00:00Z'),
            dependencies: [],
            dependents: [],
          },
        ],
        totalApplied: 2,
        totalPending: 0,
      });

      const result = await executor({ ...defaultOptions, detailed: true }, context);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('   ✅ All migrations up to date');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('000_admin'));
      expect(logger.info).toHaveBeenCalledWith('      Applied: 2 migration(s)');
      expect(logger.info).toHaveBeenCalledWith('      Last Applied: 2024-01-01T10:00:00.000Z');
    });

    it('should show correct status for modules with pending migrations', async () => {
      mockEngine.getMigrationStatus.mockResolvedValue({
        modules: [
          {
            moduleId: '010_auth',
            appliedMigrations: 1,
            pendingMigrations: 2,
            lastApplied: new Date('2024-01-01T11:00:00Z'),
            dependencies: ['000_admin'],
            dependents: [],
          },
        ],
        totalApplied: 1,
        totalPending: 2,
      });

      const result = await executor({ ...defaultOptions, detailed: true }, context);

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('   🔄 2 migration(s) pending');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('010_auth'));
      expect(logger.info).toHaveBeenCalledWith('      Applied: 1 migration(s)');
      expect(logger.info).toHaveBeenCalledWith('      Pending: 2 migration(s)');
      expect(logger.info).toHaveBeenCalledWith('      Dependencies: 000_admin');
    });
  });

  describe('configuration options', () => {
    it('should pass all configuration options to engine', async () => {
      const options: StatusExecutorSchema = {
        url: 'ws://custom:8000',
        user: 'custom_user',
        pass: 'custom_pass',
        namespace: 'custom_ns',
        database: 'custom_db',
        envFile: '.env.custom',
        initPath: 'custom/migrations',
        schemaPath: 'custom/schema.sql',
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
        useTransactions: true,
        initPath: 'custom/migrations',
        schemaPath: 'custom/schema.sql',
        force: false,
        configPath: 'custom/config.json',
      });
    });

    it('should use default values for missing options', async () => {
      const options: StatusExecutorSchema = {};

      await executor(options, context);

      expect(mockEngine.initialize).toHaveBeenCalledWith({
        url: '',
        user: '',
        pass: '',
        namespace: undefined,
        database: undefined,
        envFile: undefined,
        useTransactions: true,
        initPath: 'database',
        schemaPath: undefined,
        force: false,
        configPath: undefined,
      });
    });
  });
});

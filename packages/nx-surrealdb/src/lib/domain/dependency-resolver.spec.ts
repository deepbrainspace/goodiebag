import * as fs from 'fs/promises';
import { DependencyResolver } from './dependency-resolver';
import { ConfigLoader } from '../configuration/config-loader';

jest.mock('fs/promises');
jest.mock('../configuration/config-loader');

const mockFs = fs as jest.Mocked<typeof fs>;
const MockConfigLoader = ConfigLoader as jest.Mocked<typeof ConfigLoader>;

describe('DependencyResolver', () => {
  const testBasePath = '/test/migrations';
  let resolver: DependencyResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new DependencyResolver(testBasePath);
  });

  describe('initialization', () => {
    const testConfig = {
      modules: {
        '000_admin': {
          name: 'Admin',
          depends: []
        },
        '010_auth': {
          name: 'Auth',
          depends: ['000_admin']
        },
        '020_schema': {
          name: 'Schema',
          depends: ['010_auth']
        }
      }
    };

    it('should initialize with existing config', async () => {
      MockConfigLoader.loadConfig.mockResolvedValue(testConfig);

      await resolver.initialize('config.json');

      expect(MockConfigLoader.loadConfig).toHaveBeenCalledWith(testBasePath, 'config.json');
      expect(resolver.hasConfig()).toBe(true);
      expect(resolver.getAllModules()).toEqual(['000_admin', '010_auth', '020_schema']);
    });

    it('should auto-discover modules when no config exists', async () => {
      MockConfigLoader.loadConfig.mockResolvedValue(null);
      MockConfigLoader.createDefaultConfig.mockReturnValue(testConfig);
      
      mockFs.readdir.mockResolvedValue([
        { name: '000_admin', isDirectory: () => true },
        { name: '010_auth', isDirectory: () => true },
        { name: '020_schema', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false }
      ] as { name: string; isDirectory(): boolean }[]);

      await resolver.initialize();

      expect(MockConfigLoader.createDefaultConfig).toHaveBeenCalledWith(['000_admin', '010_auth', '020_schema']);
      expect(resolver.hasConfig()).toBe(true);
    });

    it('should handle empty directory gracefully', async () => {
      MockConfigLoader.loadConfig.mockResolvedValue(null);
      mockFs.readdir.mockResolvedValue([]);

      await resolver.initialize();

      expect(resolver.hasConfig()).toBe(false);
      expect(resolver.getAllModules()).toEqual([]);
    });

    it('should handle readdir errors gracefully', async () => {
      MockConfigLoader.loadConfig.mockResolvedValue(null);
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      // Should not throw
      await resolver.initialize();

      expect(resolver.hasConfig()).toBe(false);
    });
  });

  describe('execution order', () => {
    beforeEach(async () => {
      MockConfigLoader.loadConfig.mockResolvedValue({
        modules: {
          '000_admin': { name: 'Admin', depends: [] },
          '010_auth': { name: 'Auth', depends: ['000_admin'] },
          '020_schema': { name: 'Schema', depends: ['010_auth'] },
          '030_messaging': { name: 'Messaging', depends: ['010_auth'] }
        }
      });

      await resolver.initialize();
    });

    it('should return correct execution order for all modules', () => {
      const order = resolver.getExecutionOrder();
      
      expect(order).toEqual(['000_admin', '010_auth', '020_schema', '030_messaging']);
    });

    it('should return correct execution order for specific modules', () => {
      const order = resolver.getExecutionOrder(['020_schema']);
      
      // 020_schema depends on 010_auth, which depends on 000_admin
      expect(order).toEqual(['000_admin', '010_auth', '020_schema']);
    });

    it('should handle single module', () => {
      const order = resolver.getExecutionOrder(['000_admin']);
      
      expect(order).toEqual(['000_admin']);
    });

    it('should return empty array when no modules specified', () => {
      const order = resolver.getExecutionOrder([]);
      
      expect(order).toEqual([]);
    });
  });

  describe('rollback order', () => {
    beforeEach(async () => {
      MockConfigLoader.loadConfig.mockResolvedValue({
        modules: {
          '000_admin': { name: 'Admin', depends: [] },
          '010_auth': { name: 'Auth', depends: ['000_admin'] },
          '020_schema': { name: 'Schema', depends: ['010_auth'] }
        }
      });

      await resolver.initialize();
    });

    it('should return reverse execution order', () => {
      const rollbackOrder = resolver.getRollbackOrder();
      const executionOrder = resolver.getExecutionOrder();
      
      expect(rollbackOrder).toEqual(executionOrder.reverse());
    });

    it('should handle specific modules in rollback order', () => {
      const order = resolver.getRollbackOrder(['020_schema']);
      
      // Should be reverse of execution order including dependencies
      expect(order).toEqual(['020_schema', '010_auth', '000_admin']);
    });
  });

  describe('rollback validation', () => {
    beforeEach(async () => {
      MockConfigLoader.loadConfig.mockResolvedValue({
        modules: {
          '000_admin': { name: 'Admin', depends: [] },
          '010_auth': { name: 'Auth', depends: ['000_admin'] },
          '020_schema': { name: 'Schema', depends: ['010_auth'] }
        }
      });

      await resolver.initialize();
    });

    it('should allow rollback of module with no dependents', () => {
      const validation = resolver.validateRollback('020_schema');
      
      expect(validation.canRollback).toBe(true);
      expect(validation.blockedBy).toEqual([]);
    });

    it('should block rollback of module with dependents', () => {
      const validation = resolver.validateRollback('000_admin');
      
      expect(validation.canRollback).toBe(false);
      expect(validation.blockedBy).toContain('010_auth');
      expect(validation.reason).toContain('active dependents');
    });

    it('should allow rollback when dependents are in target list', () => {
      const validation = resolver.validateRollback('000_admin', ['000_admin', '010_auth', '020_schema']);
      
      expect(validation.canRollback).toBe(true); // Allowed because all dependents are also being rolled back
    });

    it('should handle non-existent module', () => {
      const validation = resolver.validateRollback('999_nonexistent');
      
      expect(validation.canRollback).toBe(false);
      expect(validation.reason).toContain('not found');
    });
  });

  describe('dependency queries', () => {
    beforeEach(async () => {
      MockConfigLoader.loadConfig.mockResolvedValue({
        modules: {
          '000_admin': { name: 'Admin', depends: [] },
          '010_auth': { name: 'Auth', depends: ['000_admin'] },
          '020_schema': { name: 'Schema', depends: ['010_auth'] }
        }
      });

      await resolver.initialize();
    });

    it('should return module dependencies', () => {
      const deps = resolver.getModuleDependencies('020_schema');
      
      expect(deps).toEqual(['010_auth']);
    });

    it('should return module dependents', () => {
      const dependents = resolver.getModuleDependents('000_admin');
      
      expect(dependents).toEqual(['010_auth']);
    });

    it('should validate module existence', () => {
      expect(resolver.validateModuleExists('010_auth')).toBe(true);
      expect(resolver.validateModuleExists('999_fake')).toBe(false);
    });

    it('should return resolution result', () => {
      const result = resolver.getResolutionResult(['010_auth']);
      
      expect(result.executionOrder).toEqual(['000_admin', '010_auth']);
      expect(result.dependencyGraph.size).toBe(3);
      expect(result.dependencyGraph.get('010_auth')?.dependencies).toEqual(['000_admin']);
    });
  });

  describe('circular dependency detection', () => {
    it('should detect circular dependencies', async () => {
      MockConfigLoader.loadConfig.mockResolvedValue({
        modules: {
          '010_auth': { name: 'Auth', depends: ['020_schema'] },
          '020_schema': { name: 'Schema', depends: ['010_auth'] }
        }
      });

      await resolver.initialize();

      expect(() => resolver.getExecutionOrder()).toThrow('Circular dependency detected');
    });
  });

  describe('static factory method', () => {
    it('should create and initialize resolver', async () => {
      MockConfigLoader.loadConfig.mockResolvedValue({
        modules: {
          '000_admin': { name: 'Admin', depends: [] }
        }
      });

      const resolver = await DependencyResolver.createResolver(testBasePath, 'config.json');

      expect(resolver.hasConfig()).toBe(true);
      expect(MockConfigLoader.loadConfig).toHaveBeenCalledWith(testBasePath, 'config.json');
    });
  });
});
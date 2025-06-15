import { PatternResolver } from './pattern-resolver';
import { DependencyResolver } from '../domain/dependency-resolver';
import { MigrationFileProcessor } from './migration-file-processor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs/promises and path modules
jest.mock('fs/promises');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

// Mock DependencyResolver
jest.mock('../domain/dependency-resolver');

// Mock MigrationFileProcessor
jest.mock('./migration-file-processor');
const MockMigrationFileProcessor = MigrationFileProcessor as jest.MockedClass<typeof MigrationFileProcessor>;

const mockDependencyResolver = {
  getAllModules: jest.fn(),
  validateRollback: jest.fn()
} as any;

describe('PatternResolver', () => {
  let resolver: PatternResolver;
  const basePath = '/test/database';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup path.join mock
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    
    // Setup MigrationFileProcessor mocks
    MockMigrationFileProcessor.parseMigrationFile = jest.fn().mockImplementation((filename: string) => {
      const match = filename.match(/^(\d{4})_(.+?)_(up|down)\.surql$/);
      if (!match) return null;
      const [, number, name, direction] = match;
      return {
        number,
        name,
        direction: direction as 'up' | 'down',
        filename,
        filePath: filename,
        moduleId: '',
        content: '',
        checksum: ''
      };
    });
    
    MockMigrationFileProcessor.filterMigrationFiles = jest.fn().mockImplementation((files: string[], _pattern?: string, direction: 'up' | 'down' = 'up') => {
      return files.filter(f => f.endsWith(`_${direction}.surql`));
    });
    
    resolver = new PatternResolver(mockDependencyResolver, basePath);
  });

  describe('resolveModules', () => {
    beforeEach(() => {
      mockDependencyResolver.getAllModules.mockReturnValue([
        '000_initial',
        '010_auth',
        '020_users',
        '030_products'
      ]);
    });

    it('should resolve numeric patterns to module IDs', () => {
      const result = resolver.resolveModules(['10', '20']);
      
      expect(result.resolved).toHaveLength(2);
      expect(result.resolved[0].moduleId).toBe('010_auth');
      expect(result.resolved[1].moduleId).toBe('020_users');
      expect(result.notFound).toHaveLength(0);
    });

    it('should resolve name patterns to module IDs', () => {
      const result = resolver.resolveModules(['auth', 'users']);
      
      expect(result.resolved).toHaveLength(2);
      expect(result.resolved[0].moduleId).toBe('010_auth');
      expect(result.resolved[1].moduleId).toBe('020_users');
      expect(result.notFound).toHaveLength(0);
    });

    it('should resolve full module ID patterns', () => {
      const result = resolver.resolveModules(['010_auth', '020_users']);
      
      expect(result.resolved).toHaveLength(2);
      expect(result.resolved[0].moduleId).toBe('010_auth');
      expect(result.resolved[1].moduleId).toBe('020_users');
      expect(result.notFound).toHaveLength(0);
    });

    it('should handle mixed pattern types', () => {
      const result = resolver.resolveModules(['10', 'users', '000_initial']);
      
      expect(result.resolved).toHaveLength(3);
      expect(result.resolved[0].moduleId).toBe('010_auth');
      expect(result.resolved[1].moduleId).toBe('020_users');
      expect(result.resolved[2].moduleId).toBe('000_initial');
      expect(result.notFound).toHaveLength(0);
    });

    it('should return notFound for invalid patterns', () => {
      const result = resolver.resolveModules(['999', 'nonexistent']);
      
      expect(result.resolved).toHaveLength(0);
      expect(result.notFound).toHaveLength(2);
      expect(result.notFound).toContain('999');
      expect(result.notFound).toContain('nonexistent');
    });
  });

  describe('resolveFilenames', () => {
    beforeEach(() => {
      mockDependencyResolver.getAllModules.mockReturnValue(['010_auth']);
      
      // Mock file system calls
      mockFs.readdir.mockImplementation((dirPath: any) => {
        if (dirPath.includes('010_auth')) {
          return Promise.resolve([
            '0001_create_users_table_up.surql',
            '0001_create_users_table_down.surql',
            '0002_add_authentication_up.surql',
            '0002_add_authentication_down.surql'
          ] as any);
        }
        return Promise.resolve([] as any);
      });
    });

    it('should resolve numeric filename patterns', async () => {
      const result = await resolver.resolveFilenames(['1', '2'], ['010_auth'], 'up');
      
      expect(result.resolved).toHaveLength(2);
      expect(result.resolved[0].filename).toBe('0001_create_users_table_up.surql');
      expect(result.resolved[1].filename).toBe('0002_add_authentication_up.surql');
      expect(result.notFound).toHaveLength(0);
    });

    it('should resolve name patterns to filenames', async () => {
      const result = await resolver.resolveFilenames(['users', 'authentication'], ['010_auth'], 'up');
      
      expect(result.resolved).toHaveLength(2);
      expect(result.resolved[0].filename).toBe('0001_create_users_table_up.surql');
      expect(result.resolved[1].filename).toBe('0002_add_authentication_up.surql');
      expect(result.notFound).toHaveLength(0);
    });

    it('should resolve full filename patterns', async () => {
      const result = await resolver.resolveFilenames(['0001_create_users_table_up.surql'], ['010_auth'], 'up');
      
      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].filename).toBe('0001_create_users_table_up.surql');
      expect(result.notFound).toHaveLength(0);
    });

    it('should filter by direction', async () => {
      const result = await resolver.resolveFilenames(['1'], ['010_auth'], 'down');
      
      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].filename).toBe('0001_create_users_table_down.surql');
      expect(result.resolved[0].direction).toBe('down');
    });

    it('should return notFound for invalid filename patterns', async () => {
      const result = await resolver.resolveFilenames(['999', 'nonexistent'], ['010_auth'], 'up');
      
      expect(result.resolved).toHaveLength(0);
      expect(result.notFound).toHaveLength(2);
      expect(result.notFound).toContain('999');
      expect(result.notFound).toContain('nonexistent');
    });
  });

  describe('resolveRollbackFilenames', () => {
    beforeEach(() => {
      mockDependencyResolver.getAllModules.mockReturnValue(['010_auth']);
      mockDependencyResolver.validateRollback.mockReturnValue({
        canRollback: true,
        blockedBy: [],
        reason: null
      });
      
      mockFs.readdir.mockImplementation((dirPath: any) => {
        if (dirPath.includes('010_auth')) {
          return Promise.resolve([
            '0001_create_users_table_down.surql',
            '0002_add_authentication_down.surql'
          ] as any);
        }
        return Promise.resolve([] as any);
      });
    });

    it('should resolve rollback filenames with dependency validation', async () => {
      const result = await resolver.resolveRollbackFilenames(['1'], ['010_auth']);
      
      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].filename).toBe('0001_create_users_table_down.surql');
      expect(result.resolved[0].direction).toBe('down');
      expect(result.dependencyWarnings).toHaveLength(0);
    });

    it('should return dependency warnings when rollback conflicts exist', async () => {
      mockDependencyResolver.validateRollback.mockReturnValue({
        canRollback: false,
        blockedBy: ['020_users'],
        reason: 'Dependency conflict'
      });

      const result = await resolver.resolveRollbackFilenames(['1'], ['010_auth']);
      
      expect(result.resolved).toHaveLength(1);
      expect(result.dependencyWarnings).toHaveLength(1);
      expect(result.dependencyWarnings[0]).toContain('dependency conflicts');
      expect(result.dependencyWarnings[0]).toContain('020_users');
    });
  });
});
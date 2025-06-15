import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import * as fs from 'fs';
import * as path from 'path';

import generator from './generator';
import { ImportModuleGeneratorSchema } from './generator';

// Mock filesystem operations (only for external package handling)
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('import-module generator', () => {
  let tree: Tree;
  const options: ImportModuleGeneratorSchema = { 
    module: '010_auth',
    packagePath: '/tmp/auth-package',
    initPath: 'database'
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    
    // Set up workspace files in Tree (instead of mocking)
    tree.write('database/config.json', JSON.stringify({
      modules: {
        '000_admin': {
          name: 'Admin',
          depends: []
        }
      }
    }));
    
    // Mock external package filesystem operations only
    mockFs.existsSync.mockImplementation((filePath: string) => {
      // Only mock the external package path
      if (filePath.includes('/tmp/auth-package')) return true;
      if (filePath.includes('/tmp/auth-package/package.json')) return true;
      if (filePath.includes('/tmp/auth-package/module.config.json')) return true;
      if (filePath.includes('/tmp/auth-package/migrations')) return true;
      return false;
    });
    
    mockFs.statSync.mockImplementation((filePath: string) => ({
      isDirectory: () => filePath.includes('/tmp/auth-package') && !filePath.includes('.'),
      isFile: () => filePath.includes('.'),
    } as any));
    
    mockFs.readdirSync.mockImplementation((dirPath: string) => {
      if (dirPath.includes('/tmp/auth-package/migrations')) {
        return ['0001_authentication_up.surql', '0001_authentication_down.surql'] as any;
      }
      return [] as any;
    });
    
    mockFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('/tmp/auth-package/package.json')) {
        return JSON.stringify({
          name: '@migrations/010_auth',
          version: '1.0.0',
          description: 'Authentication module',
          metadata: {
            moduleName: '010_auth',
            originalName: 'Authentication',
            exportedAt: '2024-01-01T00:00:00.000Z',
            exportedBy: '@idance/nx-surrealdb-migrations',
          }
        });
      }
      if (filePath.includes('/tmp/auth-package/module.config.json')) {
        return JSON.stringify({
          '010_auth': {
            name: 'Authentication',
            description: 'User authentication system',
            depends: ['000_admin']
          }
        });
      }
      if (filePath.includes('/tmp/auth-package/migrations/') && filePath.includes('.surql')) {
        return 'DEFINE TABLE users;';
      }
      return '';
    });
    
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.rmSync.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should import module from directory package', async () => {
    await generator(tree, options);
    
    // Check that migration files were imported
    const migrationPath = 'database/010_auth/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();
    
    const content = tree.read(migrationPath, 'utf-8');
    expect(content).toBe('DEFINE TABLE users;');
  });

  it('should merge module configuration', async () => {
    // The config is already set up in beforeEach
    await generator(tree, { ...options, mergeConfig: true });
    
    const configPath = 'database/config.json';
    expect(tree.exists(configPath)).toBeTruthy();
    
    const config = JSON.parse(tree.read(configPath, 'utf-8'));
    expect(config.modules['010_auth']).toBeDefined();
    expect(config.modules['010_auth'].name).toBe('Authentication');
    expect(config.modules['010_auth'].depends).toEqual(['000_admin']);
  });

  it('should create new configuration if none exists', async () => {
    // Remove the existing config to test creation
    tree.delete('database/config.json');
    
    await generator(tree, { ...options, mergeConfig: true });
    
    const configPath = 'database/config.json';
    expect(tree.exists(configPath)).toBeTruthy();
    
    const config = JSON.parse(tree.read(configPath, 'utf-8'));
    expect(config.modules['010_auth']).toBeDefined();
    expect(config.settings).toBeDefined();
  });

  it('should handle target module renaming', async () => {
    const renameOptions = { ...options, targetModule: '030_authentication' };
    await generator(tree, renameOptions);
    
    const migrationPath = 'database/030_authentication/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();
  });

  it('should handle target number renaming', async () => {
    const numberOptions = { ...options, targetNumber: 40 };
    await generator(tree, numberOptions);
    
    const migrationPath = 'database/040_auth/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();
  });

  it('should validate dependencies', async () => {
    // Update Tree to have missing dependency
    tree.write('database/config.json', JSON.stringify({
      modules: {
        // Missing 000_admin dependency
      }
    }));

    await expect(generator(tree, options)).rejects.toThrow(
      'Missing dependencies: 000_admin'
    );
  });

  it('should skip dependency validation when requested', async () => {
    // Update Tree to have empty config (missing dependencies)
    tree.write('database/config.json', JSON.stringify({ modules: {} }));

    const skipOptions = { ...options, skipDependencyCheck: true };
    await generator(tree, skipOptions);
    
    const migrationPath = 'database/010_auth/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();
  });

  it('should throw error if module already exists without overwrite', async () => {
    // Create existing module in Tree
    tree.write('database/010_auth/existing-file.surql', 'existing content');

    await expect(generator(tree, options)).rejects.toThrow(
      "Target module '010_auth' already exists"
    );
  });

  it('should overwrite existing module when requested', async () => {
    // Create existing module in Tree
    tree.write('database/010_auth/existing-file.surql', 'existing content');

    const overwriteOptions = { ...options, overwrite: true };
    await generator(tree, overwriteOptions);
    
    const migrationPath = 'database/010_auth/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();
  });

  it('should throw error for missing package', async () => {
    mockFs.existsSync.mockImplementation(() => false);

    await expect(generator(tree, options)).rejects.toThrow(
      'Package not found'
    );
  });

  it('should validate package structure', async () => {
    // Mock missing migrations directory
    mockFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('migrations')) return false;
      return filePath.includes('/tmp/auth-package') || 
             filePath.includes('package.json');
    });

    await expect(generator(tree, options)).rejects.toThrow(
      'Package is missing required file/directory: migrations'
    );
  });

  it('should handle module without dependencies', async () => {
    // Override mock for the external package's module.config.json to have no dependencies
    mockFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('/tmp/auth-package/module.config.json')) {
        return JSON.stringify({
          '010_auth': {
            name: 'Authentication',
            description: 'User authentication system',
            depends: [] // No dependencies
          }
        });
      }
      if (filePath.includes('/tmp/auth-package/package.json')) {
        return JSON.stringify({
          name: '@migrations/010_auth',
          version: '1.0.0',
          description: 'Authentication module',
          metadata: {
            moduleName: '010_auth',
            originalName: 'Authentication',
            exportedAt: '2024-01-01T00:00:00.000Z',
            exportedBy: '@idance/nx-surrealdb-migrations',
          }
        });
      }
      if (filePath.includes('/tmp/auth-package/migrations/') && filePath.includes('.surql')) {
        return 'DEFINE TABLE users;';
      }
      return '';
    });

    await generator(tree, options);
    
    const migrationPath = 'database/010_auth/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();
  });
});
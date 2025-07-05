import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import * as fs from 'fs';
import { execSync } from 'child_process';

import generator from './generator';
import { ImportModuleGeneratorSchema } from './generator';

// Mock filesystem operations (only for external package handling)
jest.mock('fs');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('import-module generator', () => {
  let tree: Tree;
  const options: ImportModuleGeneratorSchema = {
    module: '010_auth',
    packagePath: '/tmp/auth-package.tar.gz',
    initPath: 'database',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Mock tar archive file
    mockFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('/tmp/auth-package.tar.gz')) return true;
      if (filePath.includes('.tmp/module-import/')) return true;
      return false;
    });

    mockFs.statSync.mockImplementation(
      (filePath: string) =>
        ({
          isDirectory: () => !filePath.includes('.tar.gz') && !filePath.includes('.surql'),
          isFile: () => filePath.includes('.tar.gz') || filePath.includes('.surql'),
        } as fs.Stats)
    );

    // Mock tar extraction
    mockExecSync.mockImplementation((command: string) => {
      if (command.includes('tar -xzf')) {
        // Simulate tar extraction creating directory with .surql files
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    // Mock extracted directory contents
    mockFs.readdirSync.mockImplementation((dirPath: string) => {
      if (dirPath.includes('.tmp/module-import/')) {
        if (dirPath.endsWith('/extracted')) {
          return ['010_auth'] as string[];
        }
        return ['0001_authentication_up.surql', '0001_authentication_down.surql'] as string[];
      }
      return [] as string[];
    });

    mockFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('.surql')) {
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

  it('should import module from tar archive', async () => {
    await generator(tree, options);

    // Check that tar extraction was called
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('tar -xzf "/tmp/auth-package.tar.gz"'),
      { stdio: 'inherit' }
    );

    // Check that migration files were imported directly
    const migrationPath = 'database/010_auth/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();

    const content = tree.read(migrationPath, 'utf-8');
    expect(content).toBe('DEFINE TABLE users;');
  });

  it('should import from directory package', async () => {
    const dirOptions = { ...options, packagePath: '/tmp/auth-package' };

    // Mock directory instead of tar file
    mockFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('/tmp/auth-package')) return true;
      return false;
    });

    mockFs.statSync.mockImplementation(
      (filePath: string) =>
        ({
          isDirectory: () => filePath === '/tmp/auth-package',
          isFile: () => filePath.includes('.surql'),
        } as fs.Stats)
    );

    // Mock directory contents for direct directory import
    mockFs.readdirSync.mockImplementation((dirPath: string) => {
      if (dirPath === '/tmp/auth-package') {
        return ['0001_authentication_up.surql', '0001_authentication_down.surql'] as string[];
      }
      return [] as string[];
    });

    await generator(tree, dirOptions);

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

    await expect(generator(tree, options)).rejects.toThrow('Package not found');
  });

  it('should handle unsupported package format', async () => {
    const badOptions = { ...options, packagePath: '/tmp/auth-package.zip' };

    mockFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('/tmp/auth-package.zip')) return true;
      return false;
    });

    mockFs.statSync.mockImplementation(
      (filePath: string) =>
        ({
          isDirectory: () => false,
          isFile: () => filePath.includes('.zip'),
        } as fs.Stats)
    );

    await expect(generator(tree, badOptions)).rejects.toThrow(
      'Unsupported package format: /tmp/auth-package.zip'
    );
  });
});

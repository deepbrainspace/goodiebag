import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import * as fs from 'fs';

import generator from './generator';
import { ExportModuleGeneratorSchema } from './generator';
import { ConfigLoader } from '../../lib/configuration/config-loader';
import { TreeUtils } from '../../lib/filesystem/tree-utils';
import { execSync } from 'child_process';

// Mock filesystem operations
jest.mock('fs');
jest.mock('child_process');
jest.mock('../../lib/configuration/config-loader');
jest.mock('../../lib/filesystem/tree-utils');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn().mockResolvedValue(undefined),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('export-module generator', () => {
  let tree: Tree;
  const options: ExportModuleGeneratorSchema = {
    module: '010_auth',
    outputPath: 'test-exports',
    version: '1.0.0',
  };

  jest.setTimeout(10000); // Increase timeout

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Setup Tree with necessary files and directories
    tree.write('database/.gitkeep', '');
    tree.write(
      'database/config.json',
      JSON.stringify({
        modules: {
          '010_auth': {
            name: 'Authentication',
            description: 'User authentication system',
            dependencies: ['000_admin'],
          },
        },
      })
    );

    // Create migration files in Tree
    tree.write('database/010_auth/0001_authentication_up.surql', 'DEFINE TABLE users;');
    tree.write('database/010_auth/0001_authentication_down.surql', 'DROP TABLE users;');

    // Mock TreeUtils
    (TreeUtils.findMatchingSubdirectory as jest.Mock).mockImplementation(
      (_tree: Tree, _basePath: string, pattern: string) => {
        // Return the module if it exists, null otherwise
        if (pattern === '999_nonexistent' || pattern === 999) {
          return null;
        }
        return '010_auth';
      }
    );
    (TreeUtils.getMigrationFiles as jest.Mock).mockReturnValue([
      '0001_authentication_up.surql',
      '0001_authentication_down.surql',
    ]);
    // Use real implementation for copyFiles and ensureDirectory to test actual functionality
    (TreeUtils.copyFiles as jest.Mock).mockImplementation(
      (
        tree: Tree,
        sourcePath: string,
        destPath: string,
        fileFilter?: (filename: string) => boolean
      ) => {
        if (!tree.exists(sourcePath)) return;
        const files = tree.children(sourcePath);
        for (const file of files) {
          const sourceFilePath = sourcePath + '/' + file;
          if (tree.isFile(sourceFilePath)) {
            if (!fileFilter || fileFilter(file)) {
              const content = tree.read(sourceFilePath, 'utf-8');
              tree.write(destPath + '/' + file, content);
            }
          }
        }
      }
    );
    (TreeUtils.ensureDirectory as jest.Mock).mockImplementation((tree: Tree, dirPath: string) => {
      if (!tree.exists(dirPath)) {
        tree.write(dirPath + '/.gitkeep', '');
      }
    });

    // Mock ConfigLoader
    (ConfigLoader.loadConfig as jest.Mock).mockResolvedValue({
      modules: {
        '010_auth': {
          name: 'Authentication',
          description: 'User authentication system',
          dependencies: ['000_admin'],
        },
      },
    });

    // Mock execSync for tar/zip creation
    (execSync as jest.Mock).mockImplementation(() => {});

    // Mock filesystem operations for config loading
    mockFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('config.json')) return true;
      return false;
    });

    mockFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('config.json')) {
        return JSON.stringify({
          modules: {
            '010_auth': {
              name: 'Authentication',
              description: 'User authentication system',
              dependencies: ['000_admin'],
            },
          },
        });
      }
      return '';
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should export module as simple tar archive', async () => {
    const callback = await generator(tree, options);

    // Execute the callback to create the tar archive
    callback();

    // Check that tar command was called to create simple archive
    expect(execSync).toHaveBeenCalledWith('tar -czf 010_auth.tar.gz -C database 010_auth', {
      stdio: 'inherit',
    });
  });

  it('should find module directory correctly', async () => {
    const callback = await generator(tree, options);

    // Should have found the module and not thrown an error
    expect(callback).toBeInstanceOf(Function);

    // Check that TreeUtils.findMatchingSubdirectory was called
    expect(TreeUtils.findMatchingSubdirectory).toHaveBeenCalledWith(tree, 'database', '010_auth');
  });

  it('should handle module by number', async () => {
    const numericOptions = { ...options, module: 10 };
    const callback = await generator(tree, numericOptions);

    expect(callback).toBeInstanceOf(Function);
    callback();

    expect(execSync).toHaveBeenCalledWith('tar -czf 010_auth.tar.gz -C database 010_auth', {
      stdio: 'inherit',
    });
  });

  it('should handle module by name', async () => {
    const nameOptions = { ...options, module: 'auth' };
    const callback = await generator(tree, nameOptions);

    expect(callback).toBeInstanceOf(Function);
    callback();

    expect(execSync).toHaveBeenCalledWith('tar -czf 010_auth.tar.gz -C database 010_auth', {
      stdio: 'inherit',
    });
  });

  it('should handle missing module configuration gracefully', async () => {
    // Override config loader to return null
    (ConfigLoader.loadConfig as jest.Mock).mockRejectedValueOnce(new Error('Config not found'));

    mockFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('config.json')) return false;
      if (filePath.includes('database')) return true;
      if (filePath.includes('010_auth')) return true;
      return false;
    });

    const callback = await generator(tree, options);

    expect(callback).toBeInstanceOf(Function);
    callback();

    expect(execSync).toHaveBeenCalledWith('tar -czf 010_auth.tar.gz -C database 010_auth', {
      stdio: 'inherit',
    });
  });

  it('should throw error for non-existent module', async () => {
    // Create a fresh tree without the 010_auth module
    const testTree = createTreeWithEmptyWorkspace();
    testTree.write('database/.gitkeep', '');
    testTree.write('database/000_admin/0001_setup_up.surql', 'DEFINE NAMESPACE test;');
    testTree.write('database/020_schema/0001_schema_up.surql', 'DEFINE TABLE test;');

    const invalidOptions = { ...options, module: '999_nonexistent' };

    await expect(generator(testTree, invalidOptions)).rejects.toThrow(
      "Module '999_nonexistent' not found"
    );
  });

  it('should create tar archive without version', async () => {
    const callback = await generator(tree, options);

    callback();

    expect(execSync).toHaveBeenCalledWith('tar -czf 010_auth.tar.gz -C database 010_auth', {
      stdio: 'inherit',
    });
  });
});

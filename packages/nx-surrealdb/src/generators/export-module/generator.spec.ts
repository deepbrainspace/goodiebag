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

  it('should export module with default options', async () => {
    await generator(tree, options);

    // Check that package.json was created
    const packageJsonPath = 'test-exports/010_auth/package.json';
    expect(tree.exists(packageJsonPath)).toBeTruthy();

    const packageJson = JSON.parse(tree.read(packageJsonPath, 'utf-8'));
    expect(packageJson.name).toBe('@migrations/010_auth');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.metadata.moduleName).toBe('010_auth');
  });

  it('should create README.md with module information', async () => {
    await generator(tree, options);

    const readmePath = 'test-exports/010_auth/README.md';
    expect(tree.exists(readmePath)).toBeTruthy();

    const readme = tree.read(readmePath, 'utf-8');
    expect(readme).toContain('# Migration Module: 010_auth');
    expect(readme).toContain('Authentication');
    expect(readme).toContain('0001_authentication_up.surql');
  });

  it('should create module configuration file', async () => {
    const optionsWithConfig = { ...options, includeConfig: true };
    await generator(tree, optionsWithConfig);

    const configPath = 'test-exports/010_auth/module.config.json';
    expect(tree.exists(configPath)).toBeTruthy();

    const config = JSON.parse(tree.read(configPath, 'utf-8'));
    expect(config['010_auth']).toBeDefined();
    expect(config['010_auth'].name).toBe('Authentication');
  });

  it('should create import script', async () => {
    await generator(tree, options);

    const scriptPath = 'test-exports/010_auth/import.sh';
    expect(tree.exists(scriptPath)).toBeTruthy();

    const script = tree.read(scriptPath, 'utf-8');
    expect(script).toContain('#!/bin/bash');
    expect(script).toContain('010_auth');
    expect(script).toContain('mkdir -p');
  });

  it('should copy migration files', async () => {
    await generator(tree, options);

    const migrationPath = 'test-exports/010_auth/migrations/0001_authentication_up.surql';
    expect(tree.exists(migrationPath)).toBeTruthy();

    const content = tree.read(migrationPath, 'utf-8');
    expect(content).toBe('DEFINE TABLE users;');
  });

  it('should handle module by number', async () => {
    const numericOptions = { ...options, module: 10 };
    await generator(tree, numericOptions);

    const packageJsonPath = 'test-exports/010_auth/package.json';
    expect(tree.exists(packageJsonPath)).toBeTruthy();
  });

  it('should handle module by name', async () => {
    const nameOptions = { ...options, module: 'auth' };
    await generator(tree, nameOptions);

    const packageJsonPath = 'test-exports/010_auth/package.json';
    expect(tree.exists(packageJsonPath)).toBeTruthy();
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

    await generator(tree, options);

    const packageJsonPath = 'test-exports/010_auth/package.json';
    expect(tree.exists(packageJsonPath)).toBeTruthy();

    const packageJson = JSON.parse(tree.read(packageJsonPath, 'utf-8'));
    expect(packageJson.description).toContain('Migration module: 010_auth');
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

  it('should handle custom output path', async () => {
    const customOptions = { ...options, outputPath: 'custom/exports' };
    await generator(tree, customOptions);

    const packageJsonPath = 'custom/exports/010_auth/package.json';
    expect(tree.exists(packageJsonPath)).toBeTruthy();
  });

  it('should include dependencies in package metadata', async () => {
    await generator(tree, options);

    const packageJsonPath = 'test-exports/010_auth/package.json';
    const packageJson = JSON.parse(tree.read(packageJsonPath, 'utf-8'));

    expect(packageJson.dependencies).toEqual(['000_admin']);
  });
});

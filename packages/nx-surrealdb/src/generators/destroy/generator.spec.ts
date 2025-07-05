import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, addProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { DestroyGeneratorSchema } from './schema';

describe('destroy generator', () => {
  let tree: Tree;
  const options: DestroyGeneratorSchema = {
    projectName: 'test-db',
    force: true, // Always force in tests
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Set up a mock database project
    addProjectConfiguration(tree, 'test-db', {
      root: 'apps/test-db',
      projectType: 'application',
      sourceRoot: 'apps/test-db/src',
      targets: {
        migrate: {
          executor: '@deepbrainspace/nx-surrealdb:migrate',
        },
        status: {
          executor: '@deepbrainspace/nx-surrealdb:status',
        },
      },
    });

    // Create some project files
    tree.write('apps/test-db/project.json', JSON.stringify({
      name: 'test-db',
      root: 'apps/test-db',
      targets: {}
    }));
    tree.write('apps/test-db/config.json', JSON.stringify({
      modules: {
        '000_admin': { name: 'Admin' }
      }
    }));
    tree.write('apps/test-db/000_admin/0001_setup_up.surql', 'DEFINE NAMESPACE test;');
    tree.write('apps/test-db/010_auth/0001_users_up.surql', 'DEFINE TABLE users;');
  });

  it('should destroy project successfully', async () => {
    const callback = await generator(tree, options);
    
    // Execute the callback
    callback();

    // Verify project configuration is removed
    expect(tree.exists('apps/test-db')).toBeFalsy();
    
    // Verify project files are deleted
    expect(tree.exists('apps/test-db/project.json')).toBeFalsy();
    expect(tree.exists('apps/test-db/config.json')).toBeFalsy();
    expect(tree.exists('apps/test-db/000_admin/0001_setup_up.surql')).toBeFalsy();
    expect(tree.exists('apps/test-db/010_auth/0001_users_up.surql')).toBeFalsy();
  });

  it('should throw error for non-existent project', async () => {
    const invalidOptions = { ...options, projectName: 'non-existent' };

    await expect(generator(tree, invalidOptions)).rejects.toThrow(
      "Project 'non-existent' not found in workspace"
    );
  });

  it('should require confirmation when force is false and not confirmed', async () => {
    const confirmOptions = { ...options, force: false, confirmed: false };

    await expect(generator(tree, confirmOptions)).rejects.toThrow(
      'Destruction cancelled. Use --force flag to proceed with deletion.'
    );
  });

  it('should proceed when confirmed via prompt', async () => {
    const confirmOptions = { ...options, force: false, confirmed: true };
    
    const callback = await generator(tree, confirmOptions);
    callback();

    // Verify project is destroyed
    expect(tree.exists('apps/test-db')).toBeFalsy();
  });

  it('should clean up surrealdb dependencies from package.json', async () => {
    // Add package.json with surrealdb dependency
    tree.write('package.json', JSON.stringify({
      name: 'test-workspace',
      dependencies: {
        'surrealdb': '^1.0.0',
        'other-dep': '^2.0.0'
      },
      devDependencies: {
        'surrealdb': '^1.0.0'
      }
    }, null, 2));

    const callback = await generator(tree, options);
    callback();

    // Verify surrealdb dependencies are removed
    const packageJson = JSON.parse(tree.read('package.json', 'utf-8'));
    expect(packageJson.dependencies['surrealdb']).toBeUndefined();
    expect(packageJson.devDependencies['surrealdb']).toBeUndefined();
    expect(packageJson.dependencies['other-dep']).toBe('^2.0.0'); // Other deps preserved
  });

  it('should handle missing package.json gracefully', async () => {
    // Remove package.json
    tree.delete('package.json');

    const callback = await generator(tree, options);
    
    // Should not throw error
    expect(() => callback()).not.toThrow();
  });

  it('should normalize options correctly', async () => {
    const minimalOptions = { projectName: 'test-db' };
    
    // Should throw with minimal options (force and confirmed default to false)
    await expect(generator(tree, minimalOptions)).rejects.toThrow(
      'Destruction cancelled. Use --force flag to proceed with deletion.'
    );
  });

  it('should handle project with nested directories', async () => {
    // Add project with deeper nesting
    addProjectConfiguration(tree, 'nested-db', {
      root: 'apps/databases/nested-db',
      projectType: 'application',
    });

    tree.write('apps/databases/nested-db/deep/nested/file.txt', 'content');
    tree.write('apps/databases/nested-db/project.json', '{}');

    const nestedOptions = { ...options, projectName: 'nested-db' };
    const callback = await generator(tree, nestedOptions);
    callback();

    // Verify entire nested structure is removed
    expect(tree.exists('apps/databases/nested-db')).toBeFalsy();
    expect(tree.exists('apps/databases/nested-db/deep/nested/file.txt')).toBeFalsy();
  });
});
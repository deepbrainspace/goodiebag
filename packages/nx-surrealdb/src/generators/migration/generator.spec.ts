import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { migrationGenerator } from './generator';

// Simple test for modular migration generator
describe('migration generator - modular', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate migration files in new module', async () => {
    tree.write(
      'database/project.json',
      JSON.stringify({
        name: 'database',
        root: 'database',
      })
    );

    await migrationGenerator(tree, {
      name: 'create-user-table',
      project: 'database',
    });

    // Should create 000_admin module with migration files
    expect(tree.exists('database/migrations/000_admin')).toBe(true);

    const moduleFiles = tree.children('database/migrations/000_admin');
    const migrationFiles = moduleFiles.filter(f => f.endsWith('.surql'));

    expect(migrationFiles.length).toBe(2);
    expect(migrationFiles.some(f => f.includes('create_user_table') && f.includes('up'))).toBe(
      true
    );
    expect(migrationFiles.some(f => f.includes('create_user_table') && f.includes('down'))).toBe(
      true
    );

    // Check file naming follows XXXX_name_direction.surql pattern
    expect(migrationFiles.some(f => f.match(/^0001_create_user_table_up\.surql$/))).toBe(true);
    expect(migrationFiles.some(f => f.match(/^0001_create_user_table_down\.surql$/))).toBe(true);
  });

  it('should generate migration in existing module', async () => {
    tree.write(
      'database/project.json',
      JSON.stringify({
        name: 'database',
        root: 'database',
      })
    );

    // Create existing module with existing migration
    tree.write(
      'database/migrations/010_auth/0001_authentication_up.surql',
      '-- existing migration'
    );
    tree.write(
      'database/migrations/010_auth/0001_authentication_down.surql',
      '-- existing migration'
    );

    await migrationGenerator(tree, {
      name: 'add-user-roles',
      project: 'database',
      module: '010_auth',
    });

    const moduleFiles = tree.children('database/migrations/010_auth');
    const migrationFiles = moduleFiles.filter(f => f.endsWith('.surql'));

    expect(migrationFiles.length).toBe(4); // 2 existing + 2 new
    expect(migrationFiles.some(f => f.includes('0002_add_user_roles_up'))).toBe(true);
    expect(migrationFiles.some(f => f.includes('0002_add_user_roles_down'))).toBe(true);
  });

  it('should create new module when specified', async () => {
    tree.write(
      'database/project.json',
      JSON.stringify({
        name: 'database',
        root: 'database',
      })
    );

    // Create existing module to test numbering
    tree.write('database/migrations/010_auth/.gitkeep', '');

    await migrationGenerator(tree, {
      name: 'create-schema',
      project: 'database',
      module: 'schema',
      createModule: true,
    });

    // Should create 020_schema module (next available gapped number)
    expect(tree.exists('database/migrations/020_schema')).toBe(true);

    const moduleFiles = tree.children('database/migrations/020_schema');
    const migrationFiles = moduleFiles.filter(f => f.endsWith('.surql'));

    expect(migrationFiles.length).toBe(2);
    expect(migrationFiles.some(f => f.includes('0001_create_schema_up'))).toBe(true);
  });

  it('should throw error without name', async () => {
    await expect(
      migrationGenerator(tree, {
        name: '',
        project: 'database',
      })
    ).rejects.toThrow('The "name" property is required');
  });

  it('should throw error for non-existent module without createModule', async () => {
    tree.write(
      'database/project.json',
      JSON.stringify({
        name: 'database',
        root: 'database',
      })
    );

    await expect(
      migrationGenerator(tree, {
        name: 'test-migration',
        project: 'database',
        module: 'nonexistent',
      })
    ).rejects.toThrow("Module 'nonexistent' not found");
  });
});

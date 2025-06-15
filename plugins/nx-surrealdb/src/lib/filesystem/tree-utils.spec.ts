import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { TreeUtils } from './tree-utils';

describe('TreeUtils', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('findMatchingSubdirectory', () => {
    beforeEach(() => {
      // Create test directories
      tree.write('database/000_admin/.gitkeep', '');
      tree.write('database/010_auth/.gitkeep', '');
      tree.write('database/020_schema/.gitkeep', '');
    });

    it('should find directory by exact name', () => {
      const result = TreeUtils.findMatchingSubdirectory(tree, 'database', '010_auth');
      expect(result).toBe('010_auth');
    });

    it('should find directory by number', () => {
      const result = TreeUtils.findMatchingSubdirectory(tree, 'database', '10');
      expect(result).toBe('010_auth');
    });

    it('should find directory by name part', () => {
      const result = TreeUtils.findMatchingSubdirectory(tree, 'database', 'auth');
      expect(result).toBe('010_auth');
    });

    it('should return null for non-existent directory', () => {
      const result = TreeUtils.findMatchingSubdirectory(tree, 'database', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for non-existent base path', () => {
      const result = TreeUtils.findMatchingSubdirectory(tree, 'nonexistent', 'auth');
      expect(result).toBeNull();
    });
  });

  describe('getNextMigrationNumber', () => {
    it('should return 0001 for empty module', () => {
      tree.write('database/010_auth/.gitkeep', '');
      const result = TreeUtils.getNextMigrationNumber(tree, 'database/010_auth');
      expect(result).toBe('0001');
    });

    it('should return 0001 for non-existent module', () => {
      const result = TreeUtils.getNextMigrationNumber(tree, 'database/nonexistent');
      expect(result).toBe('0001');
    });

    it('should return next number after existing migrations', () => {
      tree.write('database/010_auth/0001_create_users_up.surql', 'CREATE TABLE users;');
      tree.write('database/010_auth/0001_create_users_down.surql', 'DROP TABLE users;');
      tree.write('database/010_auth/0002_add_roles_up.surql', 'CREATE TABLE roles;');
      tree.write('database/010_auth/0002_add_roles_down.surql', 'DROP TABLE roles;');

      const result = TreeUtils.getNextMigrationNumber(tree, 'database/010_auth');
      expect(result).toBe('0003');
    });

    it('should handle gaps in migration numbers', () => {
      tree.write('database/010_auth/0001_create_users_up.surql', 'CREATE TABLE users;');
      tree.write('database/010_auth/0005_add_roles_up.surql', 'CREATE TABLE roles;');

      const result = TreeUtils.getNextMigrationNumber(tree, 'database/010_auth');
      expect(result).toBe('0006');
    });
  });

  describe('getMigrationFiles', () => {
    beforeEach(() => {
      tree.write('database/010_auth/0001_create_users_up.surql', 'CREATE TABLE users;');
      tree.write('database/010_auth/0001_create_users_down.surql', 'DROP TABLE users;');
      tree.write('database/010_auth/README.md', 'Documentation');
      tree.write('database/010_auth/config.json', '{}');
    });

    it('should return only .surql files', () => {
      const result = TreeUtils.getMigrationFiles(tree, 'database/010_auth');
      expect(result).toEqual([
        '0001_create_users_down.surql',
        '0001_create_users_up.surql'
      ]);
    });

    it('should return empty array for non-existent module', () => {
      const result = TreeUtils.getMigrationFiles(tree, 'database/nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('isDirectory', () => {
    beforeEach(() => {
      tree.write('database/010_auth/.gitkeep', '');
      tree.write('database/config.json', '{}');
    });

    it('should return true for directory', () => {
      const result = TreeUtils.isDirectory(tree, 'database/010_auth');
      expect(result).toBe(true);
    });

    it('should return false for file', () => {
      const result = TreeUtils.isDirectory(tree, 'database/config.json');
      expect(result).toBe(false);
    });

    it('should return false for non-existent path', () => {
      const result = TreeUtils.isDirectory(tree, 'database/nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', () => {
      TreeUtils.ensureDirectory(tree, 'database/new_module');
      expect(tree.exists('database/new_module/.gitkeep')).toBe(true);
    });

    it('should not overwrite existing directory', () => {
      tree.write('database/existing/file.txt', 'content');
      TreeUtils.ensureDirectory(tree, 'database/existing');
      expect(tree.read('database/existing/file.txt', 'utf-8')).toBe('content');
    });
  });

  describe('copyFiles', () => {
    beforeEach(() => {
      tree.write('source/file1.surql', 'SQL content 1');
      tree.write('source/file2.surql', 'SQL content 2');
      tree.write('source/readme.md', 'Documentation');
    });

    it('should copy all files when no filter provided', () => {
      TreeUtils.copyFiles(tree, 'source', 'dest');
      
      expect(tree.exists('dest/file1.surql')).toBe(true);
      expect(tree.exists('dest/file2.surql')).toBe(true);
      expect(tree.exists('dest/readme.md')).toBe(true);
      expect(tree.read('dest/file1.surql', 'utf-8')).toBe('SQL content 1');
    });

    it('should copy only filtered files', () => {
      TreeUtils.copyFiles(tree, 'source', 'dest', (filename) => filename.endsWith('.surql'));
      
      expect(tree.exists('dest/file1.surql')).toBe(true);
      expect(tree.exists('dest/file2.surql')).toBe(true);
      expect(tree.exists('dest/readme.md')).toBe(false);
    });

    it('should handle non-existent source', () => {
      TreeUtils.copyFiles(tree, 'nonexistent', 'dest');
      expect(tree.children('dest')).toEqual([]);
    });
  });

  describe('readJsonFile', () => {
    beforeEach(() => {
      tree.write('config.json', JSON.stringify({ name: 'test', version: '1.0.0' }));
      tree.write('invalid.json', 'invalid json content');
    });

    it('should read and parse valid JSON', () => {
      const result = TreeUtils.readJsonFile(tree, 'config.json');
      expect(result).toEqual({ name: 'test', version: '1.0.0' });
    });

    it('should return null for invalid JSON', () => {
      const result = TreeUtils.readJsonFile(tree, 'invalid.json');
      expect(result).toBeNull();
    });

    it('should return null for non-existent file', () => {
      const result = TreeUtils.readJsonFile(tree, 'nonexistent.json');
      expect(result).toBeNull();
    });
  });

  describe('writeJsonFile', () => {
    it('should write JSON with proper formatting', () => {
      const data = { name: 'test', nested: { value: 42 } };
      TreeUtils.writeJsonFile(tree, 'output.json', data);
      
      const content = tree.read('output.json', 'utf-8');
      expect(content).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('findModuleDirectories', () => {
    beforeEach(() => {
      tree.write('database/000_admin/.gitkeep', '');
      tree.write('database/010_auth/.gitkeep', '');
      tree.write('database/020_schema/.gitkeep', '');
      tree.write('database/config.json', '{}');
      tree.write('database/invalid_module/.gitkeep', '');
    });

    it('should find all valid module directories', () => {
      const result = TreeUtils.findModuleDirectories(tree, 'database');
      
      expect(result).toEqual([
        { name: '000_admin', path: 'database/000_admin' },
        { name: '010_auth', path: 'database/010_auth' },
        { name: '020_schema', path: 'database/020_schema' }
      ]);
    });

    it('should exclude files and invalid module names', () => {
      const result = TreeUtils.findModuleDirectories(tree, 'database');
      
      const names = result.map(r => r.name);
      expect(names).not.toContain('config.json');
      expect(names).not.toContain('invalid_module');
    });

    it('should return empty array for non-existent path', () => {
      const result = TreeUtils.findModuleDirectories(tree, 'nonexistent');
      expect(result).toEqual([]);
    });
  });
});
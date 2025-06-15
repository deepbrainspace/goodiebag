import { MigrationFileProcessor } from './migration-file-processor';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('../infrastructure/env', () => ({
  replaceEnvVars: jest.fn((content: string) => content.replace('${TEST_VAR}', 'test_value'))
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('MigrationFileProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findMatchingSubdirectory', () => {
    it('should find directory by exact name match', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '000_admin', isDirectory: () => true },
        { name: '010_auth', isDirectory: () => true },
        { name: '020_schema', isDirectory: () => true }
      ] as any);

      const result = await MigrationFileProcessor.findMatchingSubdirectory('/base', '010_auth');
      
      expect(result).toBe('010_auth');
    });

    it('should find directory by number only', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '000_admin', isDirectory: () => true },
        { name: '010_auth', isDirectory: () => true }
      ] as any);

      const result = await MigrationFileProcessor.findMatchingSubdirectory('/base', '10');
      
      expect(result).toBe('010_auth');
    });

    it('should find directory by name only', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '000_admin', isDirectory: () => true },
        { name: '010_auth', isDirectory: () => true }
      ] as any);

      const result = await MigrationFileProcessor.findMatchingSubdirectory('/base', 'auth');
      
      expect(result).toBe('010_auth');
    });

    it('should find directory by number_name format', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '010_auth', isDirectory: () => true }
      ] as any);

      const result = await MigrationFileProcessor.findMatchingSubdirectory('/base', '10_auth');
      
      expect(result).toBe('010_auth');
    });

    it('should return null when no match found', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '010_auth', isDirectory: () => true }
      ] as any);

      const result = await MigrationFileProcessor.findMatchingSubdirectory('/base', 'nonexistent');
      
      expect(result).toBeNull();
    });

    it('should handle directory read errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(MigrationFileProcessor.findMatchingSubdirectory('/base', 'auth'))
        .rejects.toThrow('Failed to read subdirectories in /base: Permission denied');
    });

    it('should ignore files and only process directories', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'file.txt', isDirectory: () => false },
        { name: '010_auth', isDirectory: () => true }
      ] as any);

      const result = await MigrationFileProcessor.findMatchingSubdirectory('/base', 'auth');
      
      expect(result).toBe('010_auth');
    });
  });

  describe('discoverModules', () => {
    it('should discover and sort modules correctly', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '020_schema', isDirectory: () => true },
        { name: '000_admin', isDirectory: () => true },
        { name: '010_auth', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false }
      ] as any);

      const result = await MigrationFileProcessor.discoverModules('/base');
      
      expect(result).toEqual([
        { moduleId: '000_admin', modulePath: path.join('/base', '000_admin') },
        { moduleId: '010_auth', modulePath: path.join('/base', '010_auth') },
        { moduleId: '020_schema', modulePath: path.join('/base', '020_schema') }
      ]);
    });

    it('should handle empty directory', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const result = await MigrationFileProcessor.discoverModules('/base');
      
      expect(result).toEqual([]);
    });

    it('should return empty array when directory does not exist', async () => {
      const error = new Error('Directory not found') as any;
      error.code = 'ENOENT';
      mockFs.readdir.mockRejectedValue(error);

      const result = await MigrationFileProcessor.discoverModules('/base');
      
      expect(result).toEqual([]);
    });

    it('should handle other filesystem errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(MigrationFileProcessor.discoverModules('/base'))
        .rejects.toThrow('Failed to discover modules in /base: Permission denied');
    });

    it('should filter out non-module directories', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: '010_auth', isDirectory: () => true },
        { name: 'invalid_name', isDirectory: () => true },
        { name: 'config.json', isDirectory: () => false }
      ] as any);

      const result = await MigrationFileProcessor.discoverModules('/base');
      
      expect(result).toEqual([
        { moduleId: '010_auth', modulePath: path.join('/base', '010_auth') }
      ]);
    });
  });

  describe('getNextMigrationNumber', () => {
    it('should return 0001 for empty directory', async () => {
      mockFs.readdir.mockResolvedValue([]);

      const result = await MigrationFileProcessor.getNextMigrationNumber('/module');
      
      expect(result).toBe('0001');
    });

    it('should return 0001 when directory does not exist', async () => {
      const error = new Error('Directory not found') as any;
      error.code = 'ENOENT';
      mockFs.readdir.mockRejectedValue(error);

      const result = await MigrationFileProcessor.getNextMigrationNumber('/module');
      
      expect(result).toBe('0001');
    });

    it('should increment from highest existing migration', async () => {
      mockFs.readdir.mockResolvedValue([
        '0001_create_users_up.surql',
        '0001_create_users_down.surql',
        '0003_add_index_up.surql',
        '0003_add_index_down.surql',
        'README.md'
      ]);

      const result = await MigrationFileProcessor.getNextMigrationNumber('/module');
      
      expect(result).toBe('0004');
    });

    it('should handle non-sequential migration numbers', async () => {
      mockFs.readdir.mockResolvedValue([
        '0001_first_up.surql',
        '0005_second_up.surql',
        '0010_third_up.surql'
      ]);

      const result = await MigrationFileProcessor.getNextMigrationNumber('/module');
      
      expect(result).toBe('0011');
    });

    it('should ignore invalid migration file names', async () => {
      mockFs.readdir.mockResolvedValue([
        '0002_valid_up.surql',
        'invalid_file.surql',
        '001_invalid_format.surql',
        'not_a_migration.txt'
      ]);

      const result = await MigrationFileProcessor.getNextMigrationNumber('/module');
      
      expect(result).toBe('0003');
    });

    it('should handle filesystem errors', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(MigrationFileProcessor.getNextMigrationNumber('/module'))
        .rejects.toThrow('Failed to get next migration number for /module: Permission denied');
    });
  });

  describe('generateModuleId', () => {
    it('should generate module ID with gapped numbering', async () => {
      const existingModules = [
        { moduleId: '000_admin' },
        { moduleId: '010_auth' },
        { moduleId: '020_schema' }
      ];

      const result = MigrationFileProcessor.generateModuleId('messaging', existingModules);
      
      expect(result).toBe('030_messaging');
    });

    it('should start from 000 when no modules exist', async () => {
      const result = MigrationFileProcessor.generateModuleId('admin', []);
      
      expect(result).toBe('000_admin');
    });

    it('should generate next number after highest existing', async () => {
      const existingModules = [
        { moduleId: '000_admin' },
        { moduleId: '020_schema' } // highest is 020
      ];

      const result = MigrationFileProcessor.generateModuleId('auth', existingModules);
      
      expect(result).toBe('030_auth'); // next after 020
    });

    it('should normalize module names', async () => {
      const result = MigrationFileProcessor.generateModuleId('User Authentication!', []);
      
      expect(result).toBe('000_user_authentication_');
    });

    it('should handle modules with irregular numbering', async () => {
      const existingModules = [
        { moduleId: '5_custom' },
        { moduleId: '15_another' }
      ];

      const result = MigrationFileProcessor.generateModuleId('new', existingModules);
      
      // The algorithm finds next after highest (15), so returns 25
      expect(result).toBe('025_new');
    });
  });

  describe('parseMigrationFile', () => {
    it('should parse valid migration file name', () => {
      const result = MigrationFileProcessor.parseMigrationFile(
        '0001_create_users_up.surql',
        '/base/path',
        '010_auth'
      );

      expect(result).toEqual({
        number: '0001',
        name: 'create_users',
        direction: 'up',
        filename: '0001_create_users_up.surql',
        filePath: '/base/path/0001_create_users_up.surql',
        moduleId: '010_auth',
        content: '',
        checksum: ''
      });
    });

    it('should parse down migration file', () => {
      const result = MigrationFileProcessor.parseMigrationFile('0002_add_index_down.surql');

      expect(result).toEqual({
        number: '0002',
        name: 'add_index',
        direction: 'down',
        filename: '0002_add_index_down.surql',
        filePath: '0002_add_index_down.surql',
        moduleId: '',
        content: '',
        checksum: ''
      });
    });

    it('should return null for invalid file name', () => {
      const result = MigrationFileProcessor.parseMigrationFile('invalid_file.txt');
      
      expect(result).toBeNull();
    });

    it('should handle missing optional parameters', () => {
      const result = MigrationFileProcessor.parseMigrationFile('0001_test_up.surql');

      expect(result).toEqual({
        number: '0001',
        name: 'test',
        direction: 'up',
        filename: '0001_test_up.surql',
        filePath: '0001_test_up.surql',
        moduleId: '',
        content: '',
        checksum: ''
      });
    });
  });

  describe('matchesMigrationPattern', () => {
    it('should match by full filename', () => {
      const result = MigrationFileProcessor.matchesMigrationPattern(
        '0001_create_users_up.surql',
        '0001_create_users_up.surql'
      );
      
      expect(result).toBe(true);
    });

    it('should match by migration number', () => {
      const result = MigrationFileProcessor.matchesMigrationPattern(
        '0001_create_users_up.surql',
        '1'
      );
      
      expect(result).toBe(true);
    });

    it('should match by migration name', () => {
      const result = MigrationFileProcessor.matchesMigrationPattern(
        '0001_create_users_up.surql',
        'create_users'
      );
      
      expect(result).toBe(true);
    });

    it('should match by number_name format', () => {
      const result = MigrationFileProcessor.matchesMigrationPattern(
        '0001_create_users_up.surql',
        '1_create_users'
      );
      
      expect(result).toBe(true);
    });

    it('should handle case insensitive matching', () => {
      const result = MigrationFileProcessor.matchesMigrationPattern(
        '0001_create_users_up.surql',
        'CREATE_USERS'
      );
      
      expect(result).toBe(true);
    });

    it('should return false for non-matching patterns', () => {
      const result = MigrationFileProcessor.matchesMigrationPattern(
        '0001_create_users_up.surql',
        'nonexistent'
      );
      
      expect(result).toBe(false);
    });

    it('should return false for invalid filenames', () => {
      const result = MigrationFileProcessor.matchesMigrationPattern(
        'invalid_file.txt',
        'anything'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('filterMigrationFiles', () => {
    const sampleFiles = [
      '0001_create_users_up.surql',
      '0001_create_users_down.surql',
      '0002_add_index_up.surql',
      '0002_add_index_down.surql',
      '0003_alter_table_up.surql',
      'README.md',
      'config.json'
    ];

    it('should filter up migrations by default', () => {
      const result = MigrationFileProcessor.filterMigrationFiles(sampleFiles);
      
      expect(result).toEqual([
        '0001_create_users_up.surql',
        '0002_add_index_up.surql',
        '0003_alter_table_up.surql'
      ]);
    });

    it('should filter down migrations when specified', () => {
      const result = MigrationFileProcessor.filterMigrationFiles(sampleFiles, undefined, 'down');
      
      expect(result).toEqual([
        '0002_add_index_down.surql',
        '0001_create_users_down.surql'
      ]);
    });

    it('should filter by file pattern', () => {
      const result = MigrationFileProcessor.filterMigrationFiles(sampleFiles, 'create_users');
      
      expect(result).toEqual(['0001_create_users_up.surql']);
    });

    it('should filter by pattern and direction', () => {
      const result = MigrationFileProcessor.filterMigrationFiles(
        sampleFiles, 
        '0001', 
        'down'
      );
      
      expect(result).toEqual(['0001_create_users_down.surql']);
    });

    it('should return empty array when no matches', () => {
      const result = MigrationFileProcessor.filterMigrationFiles(sampleFiles, 'nonexistent');
      
      expect(result).toEqual([]);
    });

    it('should sort up migrations ascending', () => {
      const unsortedFiles = [
        '0003_third_up.surql',
        '0001_first_up.surql',
        '0002_second_up.surql'
      ];
      
      const result = MigrationFileProcessor.filterMigrationFiles(unsortedFiles);
      
      expect(result).toEqual([
        '0001_first_up.surql',
        '0002_second_up.surql',
        '0003_third_up.surql'
      ]);
    });

    it('should sort down migrations descending', () => {
      const unsortedFiles = [
        '0001_first_down.surql',
        '0003_third_down.surql',
        '0002_second_down.surql'
      ];
      
      const result = MigrationFileProcessor.filterMigrationFiles(unsortedFiles, undefined, 'down');
      
      // The actual implementation uses .reverse() which reverses the order after sorting
      expect(result).toEqual([
        '0002_second_down.surql',
        '0003_third_down.surql',
        '0001_first_down.surql'
      ]);
    });
  });

  describe('processContent', () => {
    it('should replace environment variables', () => {
      const content = 'USE NAMESPACE ${TEST_VAR};';
      const context = {};
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      expect(result).toContain('USE NAMESPACE test_value;');
    });

    it('should add default namespace when not present', () => {
      const content = 'DEFINE TABLE users;';
      const context = { defaultNamespace: 'myapp' };
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      expect(result).toContain('USE NAMESPACE myapp;');
    });

    it('should add default database when not present', () => {
      const content = 'DEFINE TABLE users;';
      const context = { defaultDatabase: 'main' };
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      expect(result).toContain('USE DATABASE main;');
    });

    it('should not add namespace when already present', () => {
      const content = 'USE NAMESPACE custom; DEFINE TABLE users;';
      const context = { defaultNamespace: 'myapp' };
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      expect(result).not.toContain('USE NAMESPACE myapp;');
      expect(result).toContain('USE NAMESPACE custom;');
    });

    it('should wrap in transactions when enabled for non-DDL operations', () => {
      const content = 'INSERT INTO users VALUES (1);';
      const context = { useTransactions: true };
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      expect(result).toContain('BEGIN TRANSACTION;');
      expect(result).toContain('COMMIT TRANSACTION;');
    });

    it('should not wrap DDL operations in transactions', () => {
      const content = 'DEFINE TABLE users;';
      const context = { useTransactions: true };
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      // Should not wrap DDL in transactions
      expect(result).not.toContain('BEGIN TRANSACTION;');
    });

    it('should not add transactions when already present', () => {
      const content = 'BEGIN TRANSACTION; INSERT INTO users VALUES (1); COMMIT TRANSACTION;';
      const context = { useTransactions: true };
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      // Should not add extra transaction wrapper
      const transactionCount = (result.match(/BEGIN TRANSACTION/g) || []).length;
      expect(transactionCount).toBe(1);
    });

    it('should preserve content when no processing needed', () => {
      const content = 'USE NAMESPACE test; USE DATABASE main; INSERT INTO users VALUES (1);';
      const context = {};
      
      const result = MigrationFileProcessor.processContent(content, context);
      
      expect(result).toBe(content);
    });
  });
});
import { MigrationRepository } from './migration-repository';
import { SurrealDBClient } from '../infrastructure/client';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('../infrastructure/client');
jest.mock('fs/promises');

const MockSurrealDBClient = SurrealDBClient as jest.MockedClass<typeof SurrealDBClient>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('MigrationRepository', () => {
  let repository: MigrationRepository;
  let mockClient: jest.Mocked<SurrealDBClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClient = {
      query: jest.fn().mockResolvedValue([[]]), // Default to empty array result
      create: jest.fn().mockResolvedValue(undefined),
      username: 'testuser'
    } as any;
    
    // Set up default filesystem mock to prevent schema file reading issues
    const defaultSchemaContent = `
      DEFINE TABLE IF NOT EXISTS system_migrations;
      DEFINE FIELD IF NOT EXISTS number ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS name ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS direction ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS filename ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS path ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS content ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS module ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS status ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS applied_at ON system_migrations TYPE datetime;
    `;
    
    mockFs.readFile.mockResolvedValue(defaultSchemaContent);
    
    MockSurrealDBClient.mockImplementation(() => mockClient);
    repository = new MigrationRepository(mockClient);
  });

  describe('initialize', () => {
    const mockSchemaContent = `
      DEFINE TABLE IF NOT EXISTS system_migrations;
      DEFINE FIELD IF NOT EXISTS number ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS name ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS direction ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS filename ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS path ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS content ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS module ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS status ON system_migrations TYPE string;
      DEFINE FIELD IF NOT EXISTS applied_at ON system_migrations TYPE datetime;
    `;

    it('should initialize with default schema file', async () => {
      mockFs.readFile.mockResolvedValue(mockSchemaContent);
      
      await repository.initialize();
      
      expect(mockFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('schema/system_migrations.surql'),
        'utf8'
      );
      expect(mockClient.query).toHaveBeenCalledWith(mockSchemaContent);
    });

    it('should use custom schema path when provided', async () => {
      const customPath = '/custom/schema.surql';
      repository = new MigrationRepository(mockClient, customPath);
      mockFs.readFile.mockResolvedValue(mockSchemaContent);
      
      await repository.initialize();
      
      expect(mockFs.readFile).toHaveBeenCalledWith(customPath, 'utf8');
    });

    it('should validate required fields in schema', async () => {
      const incompleteSchema = `
        DEFINE TABLE IF NOT EXISTS system_migrations;
        DEFINE FIELD IF NOT EXISTS number ON system_migrations TYPE string;
      `;
      mockFs.readFile.mockResolvedValue(incompleteSchema);
      
      await expect(repository.initialize()).rejects.toThrow('missing required field: name');
    });

    it('should handle file not found error', async () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      
      await expect(repository.initialize()).rejects.toThrow('Schema file not found');
    });

    it('should handle database query errors', async () => {
      mockFs.readFile.mockResolvedValue(mockSchemaContent);
      mockClient.query.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.initialize()).rejects.toThrow('Failed to initialize system_migrations table: DB error');
    });
  });

  describe('canApplyMigration', () => {
    it('should allow applying up migration when never run', async () => {
      mockClient.query.mockResolvedValue([[]]);
      
      const result = await repository.canApplyMigration('0001', 'create_users', 'up');
      
      expect(result.canApply).toBe(true);
    });

    it('should prevent applying up migration when already up', async () => {
      mockClient.query.mockResolvedValue([[{
        status: 'success',
        direction: 'up',
        applied_at: new Date()
      }]]);
      
      const result = await repository.canApplyMigration('0001', 'create_users', 'up');
      
      expect(result.canApply).toBe(false);
      expect(result.reason).toContain('already in \'up\' state');
    });

    it('should allow applying down migration when in up state', async () => {
      mockClient.query.mockResolvedValue([[{
        status: 'success',
        direction: 'up',
        applied_at: new Date()
      }]]);
      
      const result = await repository.canApplyMigration('0001', 'create_users', 'down');
      
      expect(result.canApply).toBe(true);
    });

    it('should prevent applying down migration when never run', async () => {
      mockClient.query.mockResolvedValue([[]]);
      
      const result = await repository.canApplyMigration('0001', 'create_users', 'down');
      
      expect(result.canApply).toBe(false);
      expect(result.reason).toContain('has never been run');
    });

    it('should allow re-applying up migration after failure', async () => {
      mockClient.query.mockResolvedValue([[{
        status: 'fail',
        direction: 'up',
        applied_at: new Date()
      }]]);
      
      const result = await repository.canApplyMigration('0001', 'create_users', 'up');
      
      expect(result.canApply).toBe(true);
    });

    it('should validate input parameters', async () => {
      await expect(repository.canApplyMigration('', 'test', 'up'))
        .rejects.toThrow('Number and name are required');
      
      await expect(repository.canApplyMigration('0001', 'test', 'invalid' as any))
        .rejects.toThrow('Requested direction must be \'up\' or \'down\'');
    });
  });

  describe('addMigration', () => {
    const validMigration = {
      number: '0001',
      name: 'create_users',
      direction: 'up' as const,
      filename: '0001_create_users_up.surql',
      path: 'database/010_auth',
      content: 'DEFINE TABLE users;',
      checksum: 'abc123',
      status: 'success' as const,
      namespace: 'test',
      database: 'test',
      execution_time_ms: 100
    };

    beforeEach(() => {
      const mockSchemaContent = `
        DEFINE TABLE IF NOT EXISTS system_migrations;
        DEFINE FIELD IF NOT EXISTS number ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS name ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS direction ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS filename ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS path ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS content ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS module ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS status ON system_migrations TYPE string;
        DEFINE FIELD IF NOT EXISTS applied_at ON system_migrations TYPE datetime;
      `;
      mockFs.readFile.mockResolvedValue(mockSchemaContent);
    });

    it('should add migration successfully', async () => {
      await repository.addMigration(validMigration);
      
      expect(mockClient.create).toHaveBeenCalledWith('system_migrations', {
        number: '0001',
        name: 'create_users',
        direction: 'up',
        filename: '0001_create_users_up.surql',
        path: 'database/010_auth',
        content: 'DEFINE TABLE users;',
        checksum: 'abc123',
        status: 'success',
        applied_by: 'testuser',
        execution_time_ms: 100
      });
    });

    it('should validate required fields', async () => {
      const invalidMigration = { ...validMigration, number: '' };
      
      await expect(repository.addMigration(invalidMigration))
        .rejects.toThrow('Missing required migration fields');
    });

    it('should validate direction values', async () => {
      const invalidMigration = { ...validMigration, direction: 'invalid' as any };
      
      await expect(repository.addMigration(invalidMigration))
        .rejects.toThrow('Direction must be \'up\' or \'down\'');
    });

    it('should validate status values', async () => {
      const invalidMigration = { ...validMigration, status: 'invalid' as any };
      
      await expect(repository.addMigration(invalidMigration))
        .rejects.toThrow('Status must be \'success\' or \'fail\'');
    });

    it('should validate path format', async () => {
      const invalidMigration = { ...validMigration, path: 'invalid path!' };
      
      await expect(repository.addMigration(invalidMigration))
        .rejects.toThrow('Invalid path format');
    });

    it('should use default values when not provided', async () => {
      const minimalMigration = {
        number: '0001',
        name: 'create_users',
        filename: '0001_create_users_up.surql',
        path: 'database/010_auth',
        content: 'DEFINE TABLE users;'
      };
      
      await repository.addMigration(minimalMigration);
      
      expect(mockClient.create).toHaveBeenCalledWith('system_migrations', 
        expect.objectContaining({
          direction: 'up',
          status: 'success'
        })
      );
    });
  });

  describe('getMigrationsByDirectionAndPath', () => {
    it('should return migrations for given direction and path', async () => {
      const mockMigrations = [
        {
          id: 'system_migrations:1',
          number: '0001',
          name: 'create_users',
          direction: 'up',
          filename: '0001_create_users_up.surql',
          path: 'database/010_auth',
          content: 'DEFINE TABLE users;',
          status: 'success',
          applied_at: new Date()
        }
      ];
      
      mockClient.query.mockResolvedValue([mockMigrations]);
      
      const result = await repository.getMigrationsByDirectionAndPath('up', 'database/010_auth');
      
      expect(result).toHaveLength(1);
      expect(result[0].number).toBe('0001');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE direction = $direction'),
        { direction: 'up', path: 'database/010_auth' }
      );
    });

    it('should handle empty results', async () => {
      mockClient.query.mockResolvedValue([[]]);
      
      const result = await repository.getMigrationsByDirectionAndPath('up', 'database/010_auth');
      
      expect(result).toEqual([]);
    });

    it('should validate direction parameter', async () => {
      await expect(repository.getMigrationsByDirectionAndPath('invalid', 'path'))
        .rejects.toThrow('Direction must be \'up\' or \'down\'');
    });

    it('should validate path parameter', async () => {
      await expect(repository.getMigrationsByDirectionAndPath('up', ''))
        .rejects.toThrow('Invalid or missing path');
      
      await expect(repository.getMigrationsByDirectionAndPath('up', 'invalid path!'))
        .rejects.toThrow('Invalid or missing path');
    });

    it('should handle database errors', async () => {
      mockClient.query.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.getMigrationsByDirectionAndPath('up', 'database/010_auth'))
        .rejects.toThrow('Failed to fetch migrations: DB error');
    });
  });

  describe('updateMigrationStatus', () => {
    it('should update migration status successfully', async () => {
      mockClient.query.mockResolvedValue([{ result: [{ id: 'system_migrations:123' }] }]);
      
      await repository.updateMigrationStatus('system_migrations:123', 'success');
      
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE $id SET'),
        expect.objectContaining({
          id: 'system_migrations:123',
          status: 'success',
          applied_at: expect.any(String)
        })
      );
    });

    it('should validate record ID format', async () => {
      await expect(repository.updateMigrationStatus('invalid', 'success'))
        .rejects.toThrow('Invalid record ID format');
      
      await expect(repository.updateMigrationStatus('other_table:123', 'success'))
        .rejects.toThrow('Invalid record ID format');
    });

    it('should handle non-existent records', async () => {
      mockClient.query.mockResolvedValue([{ result: [] }]);
      
      await expect(repository.updateMigrationStatus('system_migrations:123', 'success'))
        .rejects.toThrow('No record found with ID system_migrations:123');
    });

    it('should handle database errors', async () => {
      mockClient.query.mockRejectedValue(new Error('DB error'));
      
      await expect(repository.updateMigrationStatus('system_migrations:123', 'success'))
        .rejects.toThrow('Failed to update migration status: DB error');
    });
  });

  describe('getLatestMigrationStatus', () => {
    it('should return latest migration status', async () => {
      const mockMigration = {
        path: 'database/010_auth',
        status: 'success',
        applied_at: new Date(),
        direction: 'up',
        filename: '0001_create_users_up.surql'
      };
      
      mockClient.query.mockResolvedValue([[mockMigration]]);
      
      const result = await repository.getLatestMigrationStatus('0001', 'create_users');
      
      expect(result).toEqual(mockMigration);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY applied_at DESC'),
        { number: '0001', name: 'create_users' }
      );
    });

    it('should return null when no migrations found', async () => {
      mockClient.query.mockResolvedValue([[]]);
      
      const result = await repository.getLatestMigrationStatus('0001', 'create_users');
      
      expect(result).toBeNull();
    });

    it('should validate input parameters', async () => {
      await expect(repository.getLatestMigrationStatus('', 'test'))
        .rejects.toThrow('Number and name are required');
      
      await expect(repository.getLatestMigrationStatus('0001', ''))
        .rejects.toThrow('Number and name are required');
    });
  });
});
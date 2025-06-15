import { SurrealDBClient } from './client';
import { Surreal } from 'surrealdb';

jest.mock('surrealdb');

const MockSurreal = Surreal as jest.MockedClass<typeof Surreal>;

describe('SurrealDBClient', () => {
  let client: SurrealDBClient;
  let mockSurrealInstance: jest.Mocked<Surreal>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSurrealInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      use: jest.fn().mockResolvedValue(undefined),
      signin: jest.fn().mockResolvedValue(undefined)
    } as any;
    
    MockSurreal.mockImplementation(() => mockSurrealInstance);
    client = new SurrealDBClient();
  });

  describe('connect', () => {
    const connectionOptions = {
      url: 'ws://localhost:8000',
      username: 'root',
      password: 'root',
      namespace: 'test',
      database: 'test'
    };

    it('should connect to SurrealDB successfully', async () => {
      await client.connect(connectionOptions);
      
      expect(mockSurrealInstance.connect).toHaveBeenCalledWith('ws://localhost:8000');
      expect(mockSurrealInstance.signin).toHaveBeenCalledWith({
        username: 'root',
        password: 'root'
      });
      expect(mockSurrealInstance.use).toHaveBeenCalledWith({
        namespace: 'test',
        database: 'test'
      });
    });

    it('should store username for later use', async () => {
      await client.connect(connectionOptions);
      
      expect(client.username).toBe('root');
    });

    it('should throw error when connection fails', async () => {
      mockSurrealInstance.connect.mockRejectedValue(new Error('Connection failed'));
      
      await expect(client.connect(connectionOptions))
        .rejects.toThrow('Failed to connect to SurrealDB: Connection failed');
    });

    it('should throw error when signin fails', async () => {
      mockSurrealInstance.signin.mockRejectedValue(new Error('Signin failed'));
      
      await expect(client.connect(connectionOptions))
        .rejects.toThrow('Failed to connect to SurrealDB: Signin failed');
    });

    it('should throw error when use namespace/database fails', async () => {
      mockSurrealInstance.use.mockRejectedValue(new Error('Use failed'));
      
      await expect(client.connect(connectionOptions))
        .rejects.toThrow('Failed to connect to SurrealDB: Use failed');
    });

    it('should handle multiple connection calls', async () => {
      // Multiple connections
      await client.connect(connectionOptions);
      await client.connect(connectionOptions);
      
      expect(mockSurrealInstance.connect).toHaveBeenCalledTimes(2);
      expect(mockSurrealInstance.signin).toHaveBeenCalledTimes(2);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await client.connect({
        url: 'ws://localhost:8000',
        username: 'root',
        password: 'root',
        namespace: 'test',
        database: 'test'
      });
    });

    it('should execute query successfully', async () => {
      const mockResult = [{ id: 'user:1', name: 'John' }];
      mockSurrealInstance.query.mockResolvedValue(mockResult);
      
      const result = await client.query('SELECT * FROM user');
      
      expect(mockSurrealInstance.query).toHaveBeenCalledWith('SELECT * FROM user', undefined);
      expect(result).toEqual(mockResult);
    });

    it('should execute query with parameters', async () => {
      const mockResult = [{ id: 'user:1' }];
      mockSurrealInstance.query.mockResolvedValue(mockResult);
      const params = { id: 'user:1' };
      
      const result = await client.query('SELECT * FROM user WHERE id = $id', params);
      
      expect(mockSurrealInstance.query).toHaveBeenCalledWith('SELECT * FROM user WHERE id = $id', params);
      expect(result).toEqual(mockResult);
    });

    it('should handle query without connection (depends on SurrealDB behavior)', async () => {
      const disconnectedClient = new SurrealDBClient();
      mockSurrealInstance.query.mockRejectedValue(new Error('Not connected'));
      
      await expect(disconnectedClient.query('SELECT * FROM user'))
        .rejects.toThrow('Query execution failed: Not connected');
    });

    it('should handle query execution errors', async () => {
      mockSurrealInstance.query.mockRejectedValue(new Error('Query failed'));
      
      await expect(client.query('INVALID QUERY'))
        .rejects.toThrow('Query execution failed: Query failed');
    });

    it('should handle empty query string', async () => {
      mockSurrealInstance.query.mockResolvedValue([]);
      
      const result = await client.query('');
      
      expect(mockSurrealInstance.query).toHaveBeenCalledWith('', undefined);
      expect(result).toEqual([]);
    });

    it('should handle queries with empty results', async () => {
      mockSurrealInstance.query.mockResolvedValue([]);
      
      const result = await client.query('SELECT * FROM empty_table');
      
      expect(result).toEqual([]);
    });

    it('should handle complex query results', async () => {
      const mockResult = [
        [{ id: 'user:1', name: 'John' }],
        [{ id: 'user:2', name: 'Jane' }]
      ];
      mockSurrealInstance.query.mockResolvedValue(mockResult);
      
      const result = await client.query('SELECT * FROM user; SELECT * FROM user WHERE id = "user:2"');
      
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    beforeEach(async () => {
      await client.connect({
        url: 'ws://localhost:8000',
        username: 'root',
        password: 'root',
        namespace: 'test',
        database: 'test'
      });
    });

    it('should create record successfully', async () => {
      const data = { name: 'John', email: 'john@example.com' };
      await client.create('user', data);
      
      expect(mockSurrealInstance.create).toHaveBeenCalledWith('user', data);
    });

    it('should create record with specified ID', async () => {
      await client.create('user:john', { name: 'John' });
      
      expect(mockSurrealInstance.create).toHaveBeenCalledWith('user:john', { name: 'John' });
    });

    it('should handle create without connection', async () => {
      const disconnectedClient = new SurrealDBClient();
      mockSurrealInstance.create.mockRejectedValue(new Error('Not connected'));
      
      await expect(disconnectedClient.create('user', { name: 'John' }))
        .rejects.toThrow('Failed to create record: Not connected');
    });

    it('should handle create operation errors', async () => {
      mockSurrealInstance.create.mockRejectedValue(new Error('Create failed'));
      
      await expect(client.create('user', { name: 'John' }))
        .rejects.toThrow('Failed to create record: Create failed');
    });

    it('should handle create with empty table name', async () => {
      await client.create('', { name: 'John' });
      
      expect(mockSurrealInstance.create).toHaveBeenCalledWith('', { name: 'John' });
    });

    it('should handle create with null data', async () => {
      await client.create('user', null);
      
      expect(mockSurrealInstance.create).toHaveBeenCalledWith('user', null);
    });

    it('should handle create with complex data types', async () => {
      const complexData = {
        name: 'John',
        metadata: { age: 30, tags: ['admin', 'user'] },
        createdAt: new Date(),
        active: true
      };
      
      await client.create('user', complexData);
      
      expect(mockSurrealInstance.create).toHaveBeenCalledWith('user', complexData);
    });
  });

  describe('close', () => {
    it('should close connection successfully', async () => {
      await client.connect({
        url: 'ws://localhost:8000',
        username: 'root',
        password: 'root',
        namespace: 'test',
        database: 'test'
      });
      
      await client.close();
      
      expect(mockSurrealInstance.close).toHaveBeenCalled();
    });

    it('should handle close when not connected', async () => {
      // Should not throw when closing without connection
      await expect(client.close()).resolves.not.toThrow();
    });

    it('should handle close errors (unhandled in current implementation)', async () => {
      await client.connect({
        url: 'ws://localhost:8000',
        username: 'root',
        password: 'root',
        namespace: 'test',
        database: 'test'
      });
      
      mockSurrealInstance.close.mockRejectedValue(new Error('Close failed'));
      
      // Current implementation doesn't handle close errors
      await expect(client.close()).rejects.toThrow('Close failed');
    });

    it('should not reset connection state after closing (current implementation)', async () => {
      await client.connect({
        url: 'ws://localhost:8000',
        username: 'root',
        password: 'root',
        namespace: 'test',
        database: 'test'
      });
      
      expect(client.username).toBe('root');
      
      await client.close();
      
      // Current implementation doesn't reset connection properties
      expect(client.username).toBe('root');
    });
  });
});
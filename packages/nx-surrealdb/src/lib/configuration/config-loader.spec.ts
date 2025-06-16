import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigLoader, MigrationsConfig } from './config-loader';

jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigLoader', () => {
  const testBasePath = '/test/migrations';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    const validConfig: MigrationsConfig = {
      modules: {
        '000_admin': {
          name: 'Admin',
          dependencies: []
        },
        '010_auth': {
          name: 'Auth',
          dependencies: ['000_admin']
        }
      }
    };

    it('should load valid JSON config', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));
      
      const config = await ConfigLoader.loadConfig(testBasePath, 'config.json');
      
      expect(config).toEqual(validConfig);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(testBasePath, 'config.json'),
        'utf-8'
      );
    });

    it('should return null when no config file found', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      
      const config = await ConfigLoader.loadConfig(testBasePath);
      
      expect(config).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      mockFs.readFile.mockResolvedValue('{ invalid json }');
      
      await expect(ConfigLoader.loadConfig(testBasePath, 'config.json'))
        .rejects.toThrow('Failed to load configuration');
    });

    it('should handle absolute config paths', async () => {
      const absolutePath = '/absolute/path/to/config.json';
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));
      
      await ConfigLoader.loadConfig(testBasePath, absolutePath);
      
      expect(mockFs.readFile).toHaveBeenCalledWith(absolutePath, 'utf-8');
    });
  });

  describe('findConfigFile', () => {
    it('should find config.json first', async () => {
      mockFs.access
        .mockResolvedValueOnce(undefined) // config.json exists
        .mockRejectedValue(new Error('Not found')); // others don't
      
      const result = await ConfigLoader.findConfigFile(testBasePath);
      
      expect(result).toBe('config.json');
      expect(mockFs.access).toHaveBeenCalledWith(path.join(testBasePath, 'config.json'));
    });

    it('should find config.yaml if .json not found', async () => {
      mockFs.access
        .mockRejectedValueOnce(new Error('Not found')) // config.json doesn't exist
        .mockResolvedValueOnce(undefined) // config.yaml exists
        .mockRejectedValue(new Error('Not found')); // others don't
      
      const result = await ConfigLoader.findConfigFile(testBasePath);
      
      expect(result).toBe('config.yaml');
    });

    it('should return null if no config file found', async () => {
      mockFs.access.mockRejectedValue(new Error('Not found'));
      
      const result = await ConfigLoader.findConfigFile(testBasePath);
      
      expect(result).toBeNull();
    });
  });

  describe('validation', () => {
    it('should validate valid config', async () => {
      const validConfig = {
        modules: {
          '000_admin': {
            name: 'Admin',
            dependencies: []
          },
          '010_auth': {
            name: 'Auth',
            dependencies: ['000_admin']
          }
        }
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));
      
      const config = await ConfigLoader.loadConfig(testBasePath, 'config.json');
      expect(config).toBeDefined();
    });

    it('should reject config without modules', async () => {
      const invalidConfig = { settings: { useTransactions: true } };
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      await expect(ConfigLoader.loadConfig(testBasePath, 'config.json'))
        .rejects.toThrow('modules field is required');
    });

    it('should reject modules with invalid IDs', async () => {
      const invalidConfig = {
        modules: {
          'invalid_id': {
            name: 'Invalid',
            dependencies: []
          }
        }
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      await expect(ConfigLoader.loadConfig(testBasePath, 'config.json'))
        .rejects.toThrow('Module ID must follow pattern');
    });

    it('should reject modules without required fields', async () => {
      const invalidConfig = {
        modules: {
          '010_auth': {
            // missing name and depends
          }
        }
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      await expect(ConfigLoader.loadConfig(testBasePath, 'config.json'))
        .rejects.toThrow('Configuration validation failed');
    });

    it('should reject non-existent dependencies', async () => {
      const invalidConfig = {
        modules: {
          '010_auth': {
            name: 'Auth',
            dependencies: ['999_nonexistent']
          }
        }
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      await expect(ConfigLoader.loadConfig(testBasePath, 'config.json'))
        .rejects.toThrow('Dependency \'999_nonexistent\' does not exist');
    });

    it('should detect circular dependencies', async () => {
      const invalidConfig = {
        modules: {
          '010_auth': {
            name: 'Auth',
            dependencies: ['020_schema']
          },
          '020_schema': {
            name: 'Schema',
            dependencies: ['010_auth']
          }
        }
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));
      
      await expect(ConfigLoader.loadConfig(testBasePath, 'config.json'))
        .rejects.toThrow('Circular dependency detected');
    });
  });

  describe('createDefaultConfig', () => {
    it('should create default config from module list', () => {
      const modules = ['000_admin', '010_auth', '020_schema'];
      
      const config = ConfigLoader.createDefaultConfig(modules);
      
      expect(config.modules['000_admin'].dependencies).toEqual([]);
      expect(config.modules['010_auth'].dependencies).toEqual(['000_admin']);
      expect(config.modules['020_schema'].dependencies).toEqual(['010_auth']);
      expect(config.settings?.useTransactions).toBe(true);
    });

    it('should handle single module', () => {
      const modules = ['000_admin'];
      
      const config = ConfigLoader.createDefaultConfig(modules);
      
      expect(config.modules['000_admin'].dependencies).toEqual([]);
      expect(Object.keys(config.modules)).toHaveLength(1);
    });

    it('should sort modules and create proper names', () => {
      const modules = ['020_schema', '000_admin', '010_auth'];
      
      const config = ConfigLoader.createDefaultConfig(modules);
      
      expect(config.modules['000_admin'].name).toBe('Admin');
      expect(config.modules['010_auth'].name).toBe('Auth');
      expect(config.modules['020_schema'].name).toBe('Schema');
    });
  });

  describe('YAML support', () => {
    it('should throw error for unsupported YAML format', async () => {
      mockFs.readFile.mockResolvedValue('modules:\n  010_auth:\n    name: Auth');
      
      await expect(ConfigLoader.loadConfig(testBasePath, 'config.yaml'))
        .rejects.toThrow('YAML parsing not fully implemented');
    });

    it('should parse JSON-like content in YAML file', async () => {
      const jsonContent = JSON.stringify({
        modules: {
          '010_auth': {
            name: 'Auth',
            dependencies: []
          }
        }
      });
      
      mockFs.readFile.mockResolvedValue(jsonContent);
      
      const config = await ConfigLoader.loadConfig(testBasePath, 'config.yaml');
      expect(config).toBeDefined();
      expect(config?.modules['010_auth'].name).toBe('Auth');
    });
  });
});
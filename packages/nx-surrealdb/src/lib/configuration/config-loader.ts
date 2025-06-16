import * as fs from 'fs/promises';
import * as path from 'path';

export interface ModuleConfig {
  name: string;
  description?: string;
  dependencies: string[];  // Changed from 'depends' to match types.ts
  locked?: boolean;
  lockReason?: string;
}

export interface MigrationsConfig {
  modules: Record<string, ModuleConfig>;
  settings?: {
    configFormat?: 'json' | 'yaml';
    useTransactions?: boolean;
    defaultNamespace?: string;
    defaultDatabase?: string;
  };
}

export interface ConfigValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export class ConfigLoader {
  private static readonly DEFAULT_CONFIG_FILES = ['config.json', 'config.yaml', 'config.yml'];
  private static readonly MODULE_PATTERN = /^(\d{1,4})_(.+)$/;

  static async loadConfig(basePath: string, configPath?: string): Promise<MigrationsConfig | null> {
    const configFile = configPath || await this.findConfigFile(basePath);
    if (!configFile) {
      return null;
    }

    const fullPath = path.isAbsolute(configFile) ? configFile : path.join(basePath, configFile);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const config = this.parseConfig(content, fullPath);
      this.validateConfig(config);
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration from ${fullPath}: ${error.message}`);
    }
  }

  static async findConfigFile(basePath: string): Promise<string | null> {
    for (const filename of this.DEFAULT_CONFIG_FILES) {
      const fullPath = path.join(basePath, filename);
      try {
        await fs.access(fullPath);
        return filename;
      } catch {
        // File doesn't exist, continue
      }
    }
    return null;
  }

  private static parseConfig(content: string, filePath: string): MigrationsConfig {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.json') {
      return JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      // Basic YAML parsing - for full YAML support, we'd need js-yaml
      // For now, support simple key-value YAML that can be converted to JSON
      return this.parseSimpleYaml(content);
    } else {
      throw new Error(`Unsupported config file format: ${ext}. Supported formats: .json, .yaml, .yml`);
    }
  }

  private static parseSimpleYaml(content: string): MigrationsConfig {
    // This is a minimal YAML parser for basic structures
    // In production, we'd use a proper YAML library like js-yaml
    try {
      // Remove comments and normalize
      content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      // For now, just try to parse as JSON if it looks JSON-like
      if (content.trim().startsWith('{')) {
        return JSON.parse(content);
      }
      
      // Otherwise, throw an error suggesting JSON format
      throw new Error('YAML parsing not fully implemented. Please use JSON format.');
    } catch (error) {
      throw new Error(`Invalid YAML format: ${error.message}`);
    }
  }

  private static validateConfig(config: unknown): void {
    const errors: ConfigValidationError[] = [];

    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be an object');
    }

    if (!(config as { modules?: unknown }).modules || typeof (config as { modules?: unknown }).modules !== 'object') {
      errors.push({
        field: 'modules',
        message: 'modules field is required and must be an object',
        value: (config as { modules?: unknown }).modules
      });
    } else {
      // Validate each module
      for (const [moduleId, moduleConfig] of Object.entries((config as { modules: Record<string, unknown> }).modules)) {
        this.validateModule(moduleId, moduleConfig, errors);
      }

      // Validate dependencies exist
      this.validateDependencies((config as { modules: Record<string, ModuleConfig> }).modules, errors);
    }

    if ((config as { settings?: unknown }).settings && typeof (config as { settings?: unknown }).settings !== 'object') {
      errors.push({
        field: 'settings',
        message: 'settings must be an object',
        value: (config as { settings?: unknown }).settings
      });
    }

    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join('; ');
      throw new Error(`Configuration validation failed: ${errorMessages}`);
    }
  }

  private static validateModule(moduleId: string, moduleConfig: unknown, errors: ConfigValidationError[]): void {
    const fieldPrefix = `modules.${moduleId}`;

    // Validate module ID format
    if (!this.MODULE_PATTERN.test(moduleId)) {
      errors.push({
        field: fieldPrefix,
        message: 'Module ID must follow pattern: XXX_name (e.g., 010_auth)',
        value: moduleId
      });
    }

    if (!moduleConfig || typeof moduleConfig !== 'object') {
      errors.push({
        field: fieldPrefix,
        message: 'Module configuration must be an object',
        value: moduleConfig
      });
      return;
    }

    if (!(moduleConfig as Record<string, unknown>).name || typeof (moduleConfig as Record<string, unknown>).name !== 'string') {
      errors.push({
        field: `${fieldPrefix}.name`,
        message: 'Module name is required and must be a string',
        value: (moduleConfig as Record<string, unknown>).name
      });
    }

    if (!Array.isArray((moduleConfig as Record<string, unknown>).dependencies)) {
      errors.push({
        field: `${fieldPrefix}.dependencies`,
        message: 'Module dependencies must be an array',
        value: (moduleConfig as Record<string, unknown>).dependencies
      });
    } else {
      // Validate each dependency is a string
      ((moduleConfig as Record<string, unknown>).dependencies as unknown[]).forEach((dep: unknown, index: number) => {
        if (typeof dep !== 'string') {
          errors.push({
            field: `${fieldPrefix}.dependencies[${index}]`,
            message: 'Dependency must be a string',
            value: dep
          });
        }
      });
    }
  }

  private static validateDependencies(modules: Record<string, ModuleConfig>, errors: ConfigValidationError[]): void {
    const moduleIds = Object.keys(modules);
    
    for (const [moduleId, moduleConfig] of Object.entries(modules)) {
      if (!Array.isArray(moduleConfig.dependencies)) continue;
      
      for (const dependency of moduleConfig.dependencies) {
        if (!moduleIds.includes(dependency)) {
          errors.push({
            field: `modules.${moduleId}.dependencies`,
            message: `Dependency '${dependency}' does not exist in modules`,
            value: dependency
          });
        }
      }
    }

    // Check for circular dependencies
    this.detectCircularDependencies(modules, errors);
  }

  private static detectCircularDependencies(modules: Record<string, ModuleConfig>, errors: ConfigValidationError[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (moduleId: string, path: string[]): boolean => {
      if (recursionStack.has(moduleId)) {
        const cycle = [...path, moduleId].slice(path.indexOf(moduleId));
        errors.push({
          field: 'modules',
          message: `Circular dependency detected: ${cycle.join(' → ')}`,
          value: cycle
        });
        return true;
      }

      if (visited.has(moduleId)) {
        return false;
      }

      visited.add(moduleId);
      recursionStack.add(moduleId);

      const moduleConfig = modules[moduleId];
      if (moduleConfig && Array.isArray(moduleConfig.dependencies)) {
        for (const dependency of moduleConfig.dependencies) {
          if (hasCycle(dependency, [...path, moduleId])) {
            return true;
          }
        }
      }

      recursionStack.delete(moduleId);
      return false;
    };

    for (const moduleId of Object.keys(modules)) {
      if (!visited.has(moduleId)) {
        hasCycle(moduleId, []);
      }
    }
  }

  static createDefaultConfig(modules: string[]): MigrationsConfig {
    const config: MigrationsConfig = {
      modules: {},
      settings: {
        configFormat: 'json',
        useTransactions: true
      }
    };

    // Sort modules to establish basic dependency order
    const sortedModules = modules.sort();
    
    for (let i = 0; i < sortedModules.length; i++) {
      const moduleId = sortedModules[i];
      const match = moduleId.match(this.MODULE_PATTERN);
      const name = match ? match[2] : moduleId;
      
      config.modules[moduleId] = {
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
        description: `${name} module`,
        dependencies: i > 0 ? [sortedModules[i - 1]] : []
      };
    }

    return config;
  }
}
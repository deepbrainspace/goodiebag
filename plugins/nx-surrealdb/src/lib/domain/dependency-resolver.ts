import { ConfigLoader, MigrationsConfig, ModuleConfig } from '../configuration/config-loader';
import * as fs from 'fs/promises';

export interface DependencyNode {
  moduleId: string;
  config: ModuleConfig;
  dependencies: string[];
  dependents: string[];
}

export interface ResolutionResult {
  executionOrder: string[];
  dependencyGraph: Map<string, DependencyNode>;
}

export interface RollbackValidation {
  canRollback: boolean;
  blockedBy: string[];
  reason?: string;
}

export class DependencyResolver {
  private config: MigrationsConfig | null = null;
  private dependencyGraph: Map<string, DependencyNode> = new Map();

  constructor(private basePath: string) {}

  async initialize(configPath?: string): Promise<void> {
    this.config = await ConfigLoader.loadConfig(this.basePath, configPath);
    
    if (!this.config) {
      // Auto-discover modules if no config exists
      await this.autoDiscoverModules();
    }
    
    this.buildDependencyGraph();
  }

  private async autoDiscoverModules(): Promise<void> {
    try {
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      const modules = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => /^\d{1,4}_/.test(name))
        .sort();

      if (modules.length > 0) {
        this.config = ConfigLoader.createDefaultConfig(modules);
        // console.log(`Auto-discovered ${modules.length} modules:`, modules.join(', '));
      } else {
        this.config = { modules: {} };
      }
    } catch (error) {
      // console.warn(`Failed to auto-discover modules: ${error.message}`);
      this.config = { modules: {} };
    }
  }

  private buildDependencyGraph(): void {
    if (!this.config) return;

    this.dependencyGraph.clear();
    
    // First pass: create all nodes
    for (const [moduleId, moduleConfig] of Object.entries(this.config.modules)) {
      this.dependencyGraph.set(moduleId, {
        moduleId,
        config: moduleConfig,
        dependencies: [...moduleConfig.depends],
        dependents: []
      });
    }

    // Second pass: build dependents lists
    for (const [moduleId, moduleConfig] of Object.entries(this.config.modules)) {
      for (const dependency of moduleConfig.depends) {
        const depNode = this.dependencyGraph.get(dependency);
        if (depNode) {
          depNode.dependents.push(moduleId);
        }
      }
    }
  }

  getExecutionOrder(targetModules?: string[]): string[] {
    if (!this.config) return [];

    const requestedModules = targetModules || Object.keys(this.config.modules);
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (moduleId: string): void => {
      if (visited.has(moduleId)) return;
      if (visiting.has(moduleId)) {
        throw new Error(`Circular dependency detected involving ${moduleId}`);
      }

      const node = this.dependencyGraph.get(moduleId);
      if (!node) return;

      visiting.add(moduleId);

      // Visit all dependencies first (dependencies are always included)
      for (const dependency of node.dependencies) {
        visit(dependency);
      }

      visiting.delete(moduleId);
      visited.add(moduleId);
      result.push(moduleId);
    };

    // Visit all requested modules
    for (const moduleId of requestedModules) {
      visit(moduleId);
    }

    return result;
  }

  getRollbackOrder(targetModules?: string[]): string[] {
    // Rollback is the reverse of execution order
    return this.getExecutionOrder(targetModules).reverse();
  }

  validateRollback(moduleId: string, targetModules?: string[]): RollbackValidation {
    const node = this.dependencyGraph.get(moduleId);
    if (!node) {
      return {
        canRollback: false,
        blockedBy: [],
        reason: `Module ${moduleId} not found in dependency graph`
      };
    }

    // Check if any dependents would be affected
    // Only consider dependents that are NOT also being rolled back
    const affectedDependents = node.dependents.filter(dependent => {
      // If targetModules is specified, exclude dependents that are also in the rollback list
      return !targetModules || !targetModules.includes(dependent);
    });

    if (affectedDependents.length > 0) {
      return {
        canRollback: false,
        blockedBy: affectedDependents,
        reason: `Cannot rollback ${moduleId} because it has active dependents: ${affectedDependents.join(', ')}`
      };
    }

    return {
      canRollback: true,
      blockedBy: []
    };
  }

  validateModuleExists(moduleId: string): boolean {
    return this.dependencyGraph.has(moduleId);
  }

  getModuleDependencies(moduleId: string): string[] {
    const node = this.dependencyGraph.get(moduleId);
    return node ? [...node.dependencies] : [];
  }

  getModuleDependents(moduleId: string): string[] {
    const node = this.dependencyGraph.get(moduleId);
    return node ? [...node.dependents] : [];
  }

  getAllModules(): string[] {
    return Array.from(this.dependencyGraph.keys()).sort();
  }

  getResolutionResult(targetModules?: string[]): ResolutionResult {
    return {
      executionOrder: this.getExecutionOrder(targetModules),
      dependencyGraph: new Map(this.dependencyGraph)
    };
  }

  getConfig(): MigrationsConfig | null {
    return this.config;
  }

  hasConfig(): boolean {
    return this.config !== null && Object.keys(this.config.modules).length > 0;
  }

  // Static utility method for testing
  static async createResolver(basePath: string, configPath?: string): Promise<DependencyResolver> {
    const resolver = new DependencyResolver(basePath);
    await resolver.initialize(configPath);
    return resolver;
  }
}
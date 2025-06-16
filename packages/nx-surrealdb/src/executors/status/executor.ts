import { ExecutorContext, logger } from '@nx/devkit';
import { MigrationService } from '../../lib/domain/migration-service';
import { ModuleLockManager } from '../../lib/domain/module-lock-manager';
import { Debug } from '../../lib/infrastructure/debug';
import pc from 'picocolors';

export interface StatusExecutorSchema {
  url?: string;
  user?: string;
  pass?: string;
  namespace?: string;
  database?: string;
  module?: string | number;
  filename?: string | number;
  envFile?: string;
  initPath?: string;
  schemaPath?: string;
  configPath?: string;
  detailed?: boolean;
  json?: boolean;
  debug?: boolean;
}

interface StatusOutput {
  modules: Array<{
    moduleId: string;
    name?: string;
    appliedMigrations: number;
    pendingMigrations: number;
    lastApplied?: Date;
    dependencies: string[];
    dependents: string[];
    status: 'up-to-date' | 'pending' | 'error';
    locked?: boolean;
    lockReason?: string;
  }>;
  totalApplied: number;
  totalPending: number;
  dependencyGraph: Record<string, string[]>;
}

export default async function runExecutor(
  options: StatusExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const engine = new MigrationService(context);

  // Enable debug mode if requested
  Debug.setEnabled(!!options.debug);

  try {
    // Initialize migration engine
    await engine.initialize({
      url: options.url || '',
      user: options.user || '',
      pass: options.pass || '',
      namespace: options.namespace,
      database: options.database,
      envFile: options.envFile,
      useTransactions: true, // Not needed for status, but required by interface
      initPath: options.initPath || 'database',
      schemaPath: options.schemaPath,
      force: false, // Not applicable for status
      configPath: options.configPath,
      debug: options.debug
    });

    // Determine target modules and filenames
    const targetModules = (options.module !== undefined && options.module !== '') 
      ? String(options.module).split(',').map(m => m.trim()).filter(m => m.length > 0)
      : undefined;
    const targetFilenames = (options.filename !== undefined && options.filename !== '') 
      ? String(options.filename).split(',').map(f => f.trim()).filter(f => f.length > 0)
      : undefined;

    // Get migration status
    const status = await engine.getMigrationStatus(targetModules);
    
    // Initialize lock manager
    const config = engine.getConfig();
    const lockManager = ModuleLockManager.createLockManager(config);

    // If filename filtering is specified, show specific file status instead
    if (targetFilenames && targetFilenames.length > 0) {
      const resolvedFilenames = await engine.resolveTargetFilenames(targetFilenames, targetModules, 'up');
      const fileStatuses = await engine.getFileStatus(resolvedFilenames);
      
      if (options.json) {
        const fileStatus = {
          files: fileStatuses.map(fs => ({
            filename: fs.filename,
            moduleId: fs.moduleId,
            number: fs.number,
            name: fs.name,
            direction: fs.direction,
            status: fs.status,
            appliedAt: fs.appliedAt,
            checksum: fs.checksum,
            dependencies: fs.dependencies,
            dependents: fs.dependents
          }))
        };
        console.log(JSON.stringify(fileStatus, null, 2));
        return { success: true };
      }

      // Enhanced filename status display
      const appliedCount = fileStatuses.filter(fs => fs.status === 'applied').length;
      const pendingCount = fileStatuses.filter(fs => fs.status === 'pending').length;

      logger.info(`\n📄 File Status Summary:`);
      logger.info(`   Files Found: ${fileStatuses.length}`);
      logger.info(`   Applied: ${appliedCount}`);
      logger.info(`   Pending: ${pendingCount}`);

      logger.info(`\n📋 File Details:`);
      for (const fileStatus of fileStatuses) {
        const statusIcon = fileStatus.status === 'applied' ? '✅' : '🔄';
        const statusText = fileStatus.status === 'applied' ? 'APPLIED' : 'PENDING';
        
        logger.info(`\n   ${statusIcon} ${fileStatus.moduleId}/${fileStatus.filename} [${statusText}]`);
        logger.info(`      Number: ${fileStatus.number}`);
        logger.info(`      Name: ${fileStatus.name}`);
        logger.info(`      Direction: ${fileStatus.direction}`);
        
        if (fileStatus.appliedAt) {
          logger.info(`      Applied At: ${fileStatus.appliedAt.toISOString()}`);
        }
        
        if (fileStatus.dependencies.length > 0) {
          logger.info(`      Module Dependencies: ${fileStatus.dependencies.join(', ')}`);
        }
        
        if (fileStatus.dependents.length > 0) {
          logger.info(`      Module Dependents: ${fileStatus.dependents.join(', ')}`);
        }

        if (options.detailed && fileStatus.checksum) {
          logger.info(`      Checksum: ${fileStatus.checksum.substring(0, 12)}...`);
        }
      }

      // Show dependency graph for involved modules when detailed flag is used
      if (options.detailed) {
        const involvedModules = [...new Set(fileStatuses.map(fs => fs.moduleId))];
        const moduleStatuses = status.modules.filter(m => involvedModules.includes(m.moduleId));
        
        showDependencyGraph(moduleStatuses, '🌐 Module Dependency Graph:');
      }

      return { success: true };
    }

    if (options.json) {
      // Output JSON format
      const output: StatusOutput = {
        modules: status.modules.map(module => {
          const lockValidation = lockManager.validateModuleLock(module.moduleId);
          return {
            moduleId: module.moduleId,
            appliedMigrations: module.appliedMigrations,
            pendingMigrations: module.pendingMigrations,
            lastApplied: module.lastApplied,
            dependencies: module.dependencies,
            dependents: module.dependents,
            status: module.pendingMigrations > 0 ? 'pending' : 'up-to-date',
            locked: lockValidation.isLocked ? true : undefined,
            lockReason: lockValidation.reason
          };
        }),
        totalApplied: status.totalApplied,
        totalPending: status.totalPending,
        dependencyGraph: status.modules.reduce((graph, module) => {
          graph[module.moduleId] = module.dependencies;
          return graph;
        }, {} as Record<string, string[]>)
      };

      console.log(JSON.stringify(output, null, 2));
      return { success: true };
    }

    // Human-readable format
    if (status.modules.length === 0) {
      logger.info('No migration modules found');
      return { success: true };
    }

    // Default: Minimal summary (unless detailed or debug flag is used)
    if (!options.detailed && !options.debug) {
      if (status.totalPending > 0) {
        logger.info(`${status.totalPending} migration(s) pending, ${status.totalApplied} applied`);
      } else {
        logger.info(`All migrations up to date (${status.totalApplied} applied)`);
      }
      return { success: true };
    }

    // Detailed output
    logger.info(`\n📈 Migration Status Summary`);
    logger.info(`   Total Applied: ${status.totalApplied}`);
    logger.info(`   Total Pending: ${status.totalPending}`);
    
    if (status.totalPending > 0) {
      logger.info(`   🔄 ${status.totalPending} migration(s) pending`);
    } else {
      logger.info(`   ✅ All migrations up to date`);
    }

    logger.info(`\n📋 Module Details:`);
    
    for (const module of status.modules) {
      const statusIcon = module.pendingMigrations > 0 ? '🔄' : '✅';
      const statusText = module.pendingMigrations > 0 ? 'PENDING' : 'UP-TO-DATE';
      const coloredStatus = module.pendingMigrations > 0 
        ? pc.yellow(`[${statusText}]`)
        : pc.green(`[${statusText}]`);
      
      // Add lock information
      const lockValidation = lockManager.validateModuleLock(module.moduleId);
      const lockDisplay = lockValidation.isLocked ? ` ${lockValidation.lockIcon}` : '';
      
      logger.info(`\n   ${statusIcon} ${module.moduleId} ${coloredStatus}${lockDisplay}`);
      logger.info(`      Applied: ${module.appliedMigrations} migration(s)`);
      
      if (module.pendingMigrations > 0) {
        logger.info(`      Pending: ${module.pendingMigrations} migration(s)`);
      }
      
      if (module.lastApplied) {
        logger.info(`      Last Applied: ${module.lastApplied.toISOString()}`);
      }

      // Show lock information if locked
      if (lockValidation.isLocked) {
        logger.info(`      🔒 Locked: ${lockValidation.reason || 'Module is locked for safety'}`);
      }

      // Show dependencies
      if (module.dependencies.length > 0) {
        logger.info(`      Dependencies: ${module.dependencies.join(', ')}`);
      }

      // Show dependents
      if (module.dependents.length > 0) {
        logger.info(`      Dependents: ${module.dependents.join(', ')}`);
      }

      // Show detailed info if requested
      if (options.detailed) {
        // Get pending migrations for this module
        const pendingMigrations = await engine.findPendingMigrations([module.moduleId]);
        if (pendingMigrations.length > 0) {
          logger.info(`      Pending Files:`);
          for (const migration of pendingMigrations) {
            logger.info(`        • ${migration.filename}`);
          }
        }
      }
    }

    // Show dependency visualization
    showDependencyGraph(status.modules);

    return { success: true };

  } catch (error) {
    logger.error('💥 Status check failed:');
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  } finally {
    await engine.close();
  }
}

function showDependencyGraph(
  modules: Array<{ moduleId: string; dependencies: string[]; dependents: string[] }>, 
  title: string = '🌐 Dependency Graph:'
): void {
  logger.info(`\n${title}`);
  
  // Build a complete tree structure from the modules
  const tree = buildDependencyTree(modules);
  
  // Display the tree
  displayDependencyTree(tree, '   ');
}

interface TreeNode {
  moduleId: string;
  isRoot: boolean;
  children: TreeNode[];
  dependencies: string[];
}

function buildDependencyTree(
  modules: Array<{ moduleId: string; dependencies: string[]; dependents: string[] }>
): TreeNode[] {
  const moduleMap = new Map(modules.map(m => [m.moduleId, m]));
  const nodeMap = new Map<string, TreeNode>();
  const processedModules = new Set<string>();
  
  // Create nodes for all modules
  for (const module of modules) {
    nodeMap.set(module.moduleId, {
      moduleId: module.moduleId,
      isRoot: module.dependencies.length === 0,
      children: [],
      dependencies: module.dependencies
    });
  }
  
  // Build parent-child relationships
  for (const module of modules) {
    const parentNode = nodeMap.get(module.moduleId);
    if (!parentNode) continue;
    
    for (const dependent of module.dependents) {
      const childNode = nodeMap.get(dependent);
      if (childNode) {
        parentNode.children.push(childNode);
      }
    }
  }
  
  // Find root nodes (modules with no dependencies within our set)
  const roots: TreeNode[] = [];
  for (const module of modules) {
    const node = nodeMap.get(module.moduleId);
    if (!node) continue;
    
    // Check if all dependencies are outside our module set
    const hasInternalDependencies = module.dependencies.some(dep => moduleMap.has(dep));
    
    if (!hasInternalDependencies) {
      roots.push(node);
      processedModules.add(module.moduleId);
    }
  }
  
  // If no roots found (circular dependencies or all modules have deps), 
  // find modules with external dependencies only
  if (roots.length === 0) {
    for (const module of modules) {
      if (processedModules.has(module.moduleId)) continue;
      const node = nodeMap.get(module.moduleId);
      if (node) {
        roots.push(node);
      }
    }
  }
  
  return roots;
}

function displayDependencyTree(nodes: TreeNode[], prefix: string, isChild: boolean = false): void {
  for (const node of nodes) {
    const suffix = node.isRoot ? ' (root)' : '';
    
    if (isChild) {
      logger.info(`${prefix}└─ ${node.moduleId}${suffix}`);
    } else {
      logger.info(`${prefix}${node.moduleId}${suffix}`);
    }
    
    // Display children
    if (node.children.length > 0) {
      const childPrefix = isChild ? prefix + '  ' : prefix;
      displayDependencyTree(node.children, childPrefix, true);
    }
  }
}


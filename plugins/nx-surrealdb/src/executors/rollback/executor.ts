import { ExecutorContext, logger } from '@nx/devkit';
import { MigrationService } from '../../lib/domain/migration-service';
import { ModuleLockManager } from '../../lib/domain/module-lock-manager';
import { Debug } from '../../lib/infrastructure/debug';

export interface RollbackExecutorSchema {
  url?: string;
  user?: string;
  pass?: string;
  namespace?: string;
  database?: string;
  module?: string | number;
  filename?: string | number;
  envFile?: string;
  useTransactions?: boolean;
  initPath?: string;
  schemaPath?: string;
  force?: boolean;
  configPath?: string;
  dryRun?: boolean;
  steps?: number;
  detailed?: boolean;
  debug?: boolean;
}

export default async function runExecutor(
  options: RollbackExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const service = new MigrationService(context);
  const debug = Debug.scope('rollback-executor');

  // Enable debug mode if requested
  Debug.setEnabled(!!options.debug);

  try {
    // Service already initialized above

    // Determine target modules and filenames  
    const rawTargetModules = (options.module !== undefined && options.module !== '') 
      ? String(options.module).split(',').map(m => m.trim()).filter(m => m.length > 0)
      : undefined;
    const targetFilenames = (options.filename !== undefined && options.filename !== '') 
      ? String(options.filename).split(',').map(f => f.trim()).filter(f => f.length > 0)
      : undefined;
    debug.log(`Raw target modules: ${rawTargetModules ? rawTargetModules.join(', ') : 'all'}`);
    debug.log(`Target filenames: ${targetFilenames ? targetFilenames.join(', ') : 'all'}`);

    // Initialize migration service first
    await service.initialize({
      url: options.url || '',
      user: options.user || '',
      pass: options.pass || '',
      namespace: options.namespace,
      database: options.database,
      envFile: options.envFile,
      useTransactions: options.useTransactions,
      initPath: options.initPath || 'database',
      schemaPath: options.schemaPath,
      force: options.force || false,
      configPath: options.configPath,
      debug: options.debug,
      dryRun: options.dryRun || false
    });

    // Now resolve target modules to full names (e.g., "010" -> "010_auth")
    const resolvedTargetModules = rawTargetModules ? service.resolveTargetModules(rawTargetModules) : undefined;
    debug.log(`Resolved target modules: ${resolvedTargetModules ? resolvedTargetModules.join(', ') : 'all'}`);

    // Handle filename-specific rollback validation
    if (targetFilenames && targetFilenames.length > 0) {
      try {
        const rollbackResult = await service.resolveRollbackFilenames(targetFilenames, resolvedTargetModules);
        
        // Show dependency warnings if any
        if (rollbackResult.warnings.length > 0) {
          logger.warn('⚠️  Rollback filename warnings:');
          for (const warning of rollbackResult.warnings) {
            logger.warn(`   • ${warning}`);
          }
        }

        debug.log(`Resolved ${rollbackResult.resolved.length} rollback filenames`);
      } catch (error) {
        logger.error(`❌ Failed to resolve rollback filenames: ${error.message}`);
        return { success: false };
      }
    }

    // First, validate rollback safety unless force is enabled
    if (!options.force) {
      logger.info('🔍 Validating rollback safety...');
      
      const validation = await service.validateRollback(rawTargetModules);
      
      if (!validation.canRollback) {
        logger.error('❌ Rollback validation failed!');
        logger.error('   Blocked by dependencies:');
        for (const blocker of validation.blockedBy) {
          logger.error(`   • ${blocker}`);
        }
        
        if (validation.warnings.length > 0) {
          logger.error('   Warnings:');
          for (const warning of validation.warnings) {
            logger.error(`   • ${warning}`);
          }
        }
        
        logger.info('\n💡 To resolve this:');
        logger.info('   Option 1: Rollback dependent modules first');
        for (const blocker of validation.blockedBy) {
          logger.info(`   • nx run ${context.projectName}:rollback --module ${blocker}`);
        }
        logger.info('   Option 2: Use --force to bypass safety checks (not recommended)');
        return { success: false };
      }

      if (validation.warnings.length > 0) {
        logger.warn('⚠️  Rollback warnings:');
        for (const warning of validation.warnings) {
          logger.warn(`   • ${warning}`);
        }
      }

      logger.info('✅ Rollback safety validation passed');
    }

    // Execute rollback migrations
    if (options.dryRun) {
      logger.info('🔍 Dry run mode - showing rollback migrations without executing them');
    }
    
    if (options.detailed || options.debug) {
      logger.info('🔄 Starting rollback execution...');
    }
    
    const result = await service.executeMigrations(resolvedTargetModules, 'rollback', targetFilenames);
    
    if (result.success) {
      if (result.filesProcessed === 0 && result.results.length === 0) {
        logger.info(`⚠️  No migrations to rollback - all requested migrations are already rolled back or not yet applied`);
        logger.info(`   Execution time: ${result.executionTimeMs}ms`);
      } else {
        logger.info(`✅ Rollback completed successfully!`);
        logger.info(`   Files processed: ${result.filesProcessed}`);
        logger.info(`   Files skipped: ${result.filesSkipped}`);
        logger.info(`   Execution time: ${result.executionTimeMs}ms`);
      }
      
      if (result.results.length > 0) {
        logger.info('\n📊 Rollback Details:');
        for (const fileResult of result.results) {
          const status = fileResult.success ? '✅' : fileResult.skipped ? '⏭️' : '❌';
          const reason = fileResult.skipped ? ` (${fileResult.skipReason})` : 
                        fileResult.error ? ` (${fileResult.error})` : '';
          logger.info(`   ${status} ${fileResult.file.moduleId}/${fileResult.file.filename}${reason}`);
          
          // Show detailed information when detailed flag is used
          if (options.detailed && (fileResult.success || fileResult.skipped)) {
            logger.info(`      File: ${fileResult.file.number}_${fileResult.file.name}_${fileResult.file.direction}.surql`);
            logger.info(`      Execution time: ${fileResult.executionTimeMs}ms`);
            if (fileResult.file.checksum) {
              logger.info(`      Checksum: ${fileResult.file.checksum.substring(0, 12)}...`);
            }
          }
        }
      }
    } else {
      logger.error('❌ Rollback failed!');
      
      for (const fileResult of result.results) {
        if (!fileResult.success && !fileResult.skipped) {
          logger.error(`   ❌ ${fileResult.file.moduleId}/${fileResult.file.filename}: ${fileResult.error}`);
          
          // Show detailed error information when detailed flag is used
          if (options.detailed) {
            logger.error(`      File: ${fileResult.file.number}_${fileResult.file.name}_${fileResult.file.direction}.surql`);
            logger.error(`      Execution time: ${fileResult.executionTimeMs}ms`);
          }
        }
      }
      
      logger.info(`   Files processed: ${result.filesProcessed}`);
      logger.info(`   Execution time: ${result.executionTimeMs}ms`);
    }

    return { success: result.success };

  } catch (error) {
    logger.error('💥 Rollback execution failed:');
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  } finally {
    await service.close();
  }
}
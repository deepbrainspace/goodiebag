import { ExecutorContext, logger } from '@nx/devkit';
import { MigrationService } from '../../lib/domain/migration-service';
import { Debug } from '../../lib/infrastructure/debug';

export interface MigrateExecutorSchema {
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
  detailed?: boolean;
  debug?: boolean;
}

export default async function runExecutor(
  options: MigrateExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const engine = new MigrationService(context);
  const debug = Debug.scope('migrate-executor');

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
      useTransactions: options.useTransactions,
      initPath: options.initPath || 'database',
      schemaPath: options.schemaPath,
      force: options.force || false,
      configPath: options.configPath,
      debug: options.debug,
      dryRun: options.dryRun || false
    });

    // Determine target modules and filenames
    const targetModules = (options.module !== undefined && options.module !== '') 
      ? String(options.module).split(',').map(m => m.trim()).filter(m => m.length > 0)
      : undefined;
    const targetFilenames = (options.filename !== undefined && options.filename !== '') 
      ? String(options.filename).split(',').map(f => f.trim()).filter(f => f.length > 0)
      : undefined;
    debug.log(`Target modules: ${targetModules ? targetModules.join(', ') : 'all'}`);
    debug.log(`Target filenames: ${targetFilenames ? targetFilenames.join(', ') : 'all'}`);

    // Execute migrations
    if (options.dryRun) {
      logger.info('Dry run mode - showing pending migrations without applying them');
    } else if (options.debug) {
      logger.info('🚀 Starting migration execution...');
    }
    
    const result = await engine.executeMigrations(targetModules, 'migrate', targetFilenames);
    
    if (result.success) {
      if (result.filesProcessed === 0 && result.results.length === 0) {
        logger.info(`✅ All migrations are up to date - no pending migrations found`);
        logger.info(`   Execution time: ${result.executionTimeMs}ms`);
      } else {
        logger.info(`✅ Migration completed successfully!`);
        logger.info(`   Files processed: ${result.filesProcessed}`);
        logger.info(`   Files skipped: ${result.filesSkipped}`);
        logger.info(`   Execution time: ${result.executionTimeMs}ms`);
      }
      
      if (result.results.length > 0) {
        logger.info('\n📊 Migration Details:');
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
      logger.error('❌ Migration failed!');
      
      for (const fileResult of result.results) {
        if (!fileResult.success && !fileResult.skipped) {
          logger.error(`   ❌ ${fileResult.file.moduleId}/${fileResult.file.filename}: ${fileResult.error}`);
        }
      }
      
      logger.info(`   Files processed: ${result.filesProcessed}`);
      logger.info(`   Execution time: ${result.executionTimeMs}ms`);
    }

    return { success: result.success };

  } catch (error) {
    logger.error('💥 Migration execution failed:');
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  } finally {
    await engine.close();
  }
}
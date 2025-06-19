import { ExecutorContext } from '@nx/devkit';
import { SurrealDBClient } from '../../lib/infrastructure/client';
import { loadEnvFile, replaceEnvVars } from '../../lib/infrastructure/env';
import { Debug } from '../../lib/infrastructure/debug';

export interface ResetExecutorSchema {
  url: string;
  user: string;
  pass: string;
  namespace: string;
  database: string;
  envFile?: string;
  confirm?: boolean;
  dryRun?: boolean;
  debug?: boolean;
}

export default async function runExecutor(
  options: ResetExecutorSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const debug = Debug.scope('reset-executor');

  // Enable debug mode if requested
  Debug.setEnabled(!!options.debug);

  try {
    console.log('🗑️  Migration Tracking Reset');
    console.log('');

    // Load environment variables
    if (context && options.envFile) {
      loadEnvFile(context, options.envFile);
    }

    // Resolve environment variables in connection options
    const connectionOptions = {
      url: replaceEnvVars(options.url),
      username: replaceEnvVars(options.user),
      password: replaceEnvVars(options.pass),
      namespace: replaceEnvVars(options.namespace),
      database: replaceEnvVars(options.database),
    };

    debug.log('Connecting to database...');
    debug.data('Connection options', {
      url: connectionOptions.url,
      username: connectionOptions.username,
      namespace: connectionOptions.namespace,
      database: connectionOptions.database,
    });

    // Create database client
    const client = new SurrealDBClient();
    await client.connect(connectionOptions);

    try {
      // Check current migration records
      const records = await client.query('SELECT count() FROM system_migrations GROUP ALL');
      const count = (records?.[0]?.result?.[0] as { count?: number })?.count || 0;

      console.log(`📊 Current migration records: ${count}`);
      console.log('');

      if (count === 0) {
        console.log('✨ No migration records found. Nothing to reset.');
        return { success: true };
      }

      // Show sample records for verification
      if (!options.dryRun && !options.confirm) {
        console.log('📋 Sample migration records:');
        const samples = await client.query(
          'SELECT number, name, direction, path, applied_at FROM system_migrations ORDER BY applied_at DESC LIMIT 5'
        );
        const sampleRecords = samples?.[0]?.result || [];

        if (sampleRecords.length > 0) {
          sampleRecords.forEach(
            (record: {
              number: string;
              name: string;
              direction: string;
              path: string;
              applied_at: string;
            }) => {
              console.log(
                `   • ${record.number}_${record.name}_${record.direction} (${record.path}) - ${record.applied_at}`
              );
            }
          );
          console.log('');
        }
      }

      if (options.dryRun) {
        console.log('🔍 DRY RUN: Would delete all migration tracking records');
        console.log(`   Records to delete: ${count}`);
        console.log('   Command: DELETE FROM system_migrations;');
        console.log('');
        console.log('💡 Run without --dryRun to actually delete the records');
        return { success: true };
      }

      if (!options.confirm) {
        console.log('⚠️  WARNING: This will permanently delete ALL migration tracking records!');
        console.log('');
        console.log('   This means:');
        console.log('   • All migration history will be lost');
        console.log('   • All migrations will appear as "pending" after reset');
        console.log('   • You may need to manually track which migrations were already applied');
        console.log('');
        console.log('💡 Recommendation:');
        console.log('   • Use --dryRun first to see what will be deleted');
        console.log('   • Consider backing up the system_migrations table first');
        console.log('   • Use --confirm flag to skip this prompt in scripts');
        console.log('');
        console.log('❌ Reset cancelled. Use --confirm to proceed or --dryRun to preview.');
        return { success: false };
      }

      // Perform the reset
      console.log('🗑️  Deleting all migration tracking records...');
      await client.query('DELETE FROM system_migrations;');

      // Verify deletion
      const verifyRecords = await client.query('SELECT count() FROM system_migrations GROUP ALL');
      const remainingCount = (verifyRecords?.[0]?.result?.[0] as { count?: number })?.count || 0;

      if (remainingCount === 0) {
        console.log('✅ Migration tracking reset completed successfully!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   • Run "nx run database:status" to see all migrations as pending');
        console.log('   • Run "nx run database:migrate" to apply migrations from scratch');
        console.log('   • Consider updating migration files if schema has changed');
      } else {
        console.log(`⚠️  Warning: ${remainingCount} records remain after reset`);
        return { success: false };
      }
    } finally {
      await client.close();
    }

    return { success: true };
  } catch (error) {
    console.error('💥 Reset failed:', error.message);
    return { success: false };
  }
}

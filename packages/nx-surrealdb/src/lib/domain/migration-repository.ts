import { Migration, MigrationRecord } from '../configuration/types';
import { SurrealDBClient } from '../infrastructure/client';
import { Debug } from '../infrastructure/debug';
import * as fs from 'fs/promises';
import * as path from 'path';

export class MigrationRepository {
  private debug = Debug.scope('migration-repository');

  constructor(
    private client: SurrealDBClient,
    private schemaPath?: string,
    private dryRun: boolean = false
  ) {}

  async initialize(): Promise<void> {
    // Default schema path relative to the plugin
    const defaultSchemaPath = path.join(__dirname, '../../schema/system_migrations.surql');
    const schemaFile = this.schemaPath || defaultSchemaPath;

    if (this.dryRun) {
      this.debug.log('🔍 [DRY-RUN] Would initialize system_migrations table');
      this.debug.log(`   Schema file: ${schemaFile}`);
      return;
    }

    try {
      // Read the schema file
      const schemaQuery = await fs.readFile(schemaFile, 'utf8');

      // Basic validation to ensure required fields are defined
      const requiredFields = ['number', 'name', 'direction', 'filename', 'path', 'content', 'module', 'status', 'applied_at'];
      for (const field of requiredFields) {
        if (!schemaQuery.includes(`DEFINE FIELD IF NOT EXISTS ${field} ON system_migrations`)) {
          throw new Error(`Schema file ${schemaFile} is missing required field: ${field}`);
        }
      }

      // Execute the schema query
      await this.client.query(schemaQuery);
      this.debug.log('Initialized system_migrations table');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Schema file not found: ${schemaFile}`);
      }
      throw new Error(`Failed to initialize system_migrations table: ${error.message}`);
    }
  }


  async canApplyMigration(
    number: string,
    name: string,
    requestedDirection: 'up' | 'down'
  ): Promise<{ canApply: boolean; reason?: string }> {
    if (!['up', 'down'].includes(requestedDirection)) {
      throw new Error("Requested direction must be 'up' or 'down'");
    }
    if (!number || !name) {
      throw new Error('Number and name are required');
    }

    try {
      const currentStatus = await this.getLatestMigrationStatus(number, name);
      
      if (!currentStatus) {
        if (requestedDirection === 'up') {
          return { canApply: true };
        }
        return {
          canApply: false,
          reason: `Migration ${number}_${name} has never been run; cannot apply 'down'.`
        };
      }

      if (currentStatus.status === 'fail') {
        if (requestedDirection === 'up') {
          return { canApply: true };
        }
        return {
          canApply: false,
          reason: `Migration ${number}_${name} has failed previously; cannot apply 'down'.`
        };
      }

      if (currentStatus.direction === 'up' && requestedDirection === 'up') {
        return {
          canApply: false,
          reason: `Migration ${number}_${name} is already in 'up' state; cannot apply 'up' again.`
        };
      }

      if (currentStatus.direction === 'down' && requestedDirection === 'down') {
        return {
          canApply: false,
          reason: `Migration ${number}_${name} is already in 'down' state; cannot apply 'down' again.`
        };
      }

      return { canApply: true };
    } catch (error) {
      throw new Error(`Failed to check migration applicability: ${error.message}`);
    }
  }


  async getLatestMigrationStatus(number: string, name: string): Promise<Migration | null> {
    if (!number || !name) {
      throw new Error('Number and name are required');
    }

    const params: Record<string, string> = { number, name };
    const query = `
      SELECT path, status, applied_at, direction, filename
      FROM system_migrations
      WHERE number = $number AND name = $name
      ORDER BY applied_at DESC
      LIMIT 1
    `;

    try {
      this.debug.log(`Querying latest migration status for ${number}_${name}`);
      this.debug.log(`Query: ${query}`);
      this.debug.log(`Params:`, params);
      
      const result = await this.client.query(query, params); 
      this.debug.log(`Raw query result:`, JSON.stringify(result, null, 2));
      
      const migration = result[0][0] ?? null;
      this.debug.log(`Parsed migration result:`, migration);
      
      return migration as Migration;
    } catch (error) {
      this.debug.error(`Failed to fetch migration status for ${number}_${name}:`, error);
      throw new Error(`Failed to fetch migration status: ${error.message}`);
    }
  }

  async addMigration(migration: MigrationRecord): Promise<void> {
    await this.initialize();
    
    if (!migration.number || !migration.name || !migration.filename || !migration.path || !migration.content) {
      throw new Error('Missing required migration fields');
    }
    if (!['up', 'down'].includes(migration.direction || 'up')) {
      throw new Error("Direction must be 'up' or 'down'");
    }
    if (!['success', 'fail'].includes(migration.status || 'success')) {
      throw new Error("Status must be 'success' or 'fail'");
    }
    if (!/^[a-zA-Z0-9_/.-]+$/.test(migration.path)) {
      throw new Error('Invalid path format');
    }

    const migrationData = {
      number: migration.number,
      name: migration.name,
      direction: migration.direction ?? 'up',
      filename: migration.filename,
      path: migration.path,
      content: migration.content,
      module: migration.module,
      checksum: migration.checksum,
      status: migration.status ?? 'success',
      applied_by: this.client.username,
      execution_time_ms: migration.execution_time_ms
    };

    if (this.dryRun) {
      this.debug.log('🔍 [DRY-RUN] Would record migration execution:');
      this.debug.log(`   Migration: ${migration.number}_${migration.name}_${migration.direction}.surql`);
      this.debug.log(`   Module: ${migration.module}`);
      this.debug.log(`   Status: ${migration.status}`);
      this.debug.log(`   Direction: ${migration.direction}`);
      return;
    }

    await this.client.create("system_migrations", migrationData);
  }

  async getMigrationStatus(direction: string, number: string, name: string, filename?: string):
  Promise<Migration | null> {
    if (!['up', 'down'].includes(direction)) {
      throw new Error("Direction must be 'up' or 'down'");
    }
    if (!number || !name) {
      throw new Error('Number and name are required');
    }
    if (filename && !/^[a-zA-Z0-9_/.-]+$/.test(filename)) {
      throw new Error('Invalid filename format');
    }

    const params: Record<string, string> = { direction, number, name };
    let query = `
      SELECT * FROM system_migrations 
      WHERE number = $number 
      AND name = $name
      ORDER BY applied_at DESC
      LIMIT 1
    `;
    
    if (filename) {
      query = `
        SELECT * FROM system_migrations 
        WHERE number = $number 
        AND name = $name 
        AND filename = $filename
        ORDER BY applied_at DESC
        LIMIT 1
      `;
      params.filename = filename;
    }

    try {
      const result = await this.client.query(query, params);
      const migration = result[0]?.[0];
      
      if (!migration) return null;
      
      const migrationData = migration as any;
      return {
        id: migrationData.id,
        number: migrationData.number,
        name: migrationData.name,
        direction: migrationData.direction,
        filename: migrationData.filename,
        path: migrationData.path,
        content: migrationData.content,
        module: migrationData.module,
        checksum: migrationData.checksum,
        status: migrationData.status,
        namespace: migrationData.namespace,
        database: migrationData.database,
        applied_at: migrationData.applied_at,
        applied_by: migrationData.applied_by,
        execution_time_ms: migrationData.execution_time_ms
      };
    } catch (error) {
      throw new Error(`Failed to fetch migration status: ${error.message}`);
    }
  }

  async getMigrationsByDirectionAndPath(direction: string, path: string): Promise<Migration[]> {
    if (!['up', 'down'].includes(direction)) {
      throw new Error("Direction must be 'up' or 'down'");
    }
    if (!path || !/^[a-zA-Z0-9_/.-]+$/.test(path)) {
      throw new Error('Invalid or missing path');
    }

    try {
      this.debug.log(`Querying migrations by direction='${direction}' and path='${path}'`);
      
      const result = await this.client.query(
        `
        SELECT * FROM system_migrations 
        WHERE direction = $direction 
        AND path = $path
        ORDER BY number ASC
        `,
        { direction, path }
      );
      
      this.debug.log(`Raw query result:`, JSON.stringify(result, null, 2));
      this.debug.log(`Accessing result[0]:`, result[0]);
      this.debug.log(`Accessing result[0]?.result:`, result[0]?.result);
      this.debug.log(`result[0] length:`, Array.isArray(result[0]) ? result[0].length : 'not array');
      this.debug.log(`result[0]?.result length:`, Array.isArray(result[0]?.result) ? result[0].result.length : 'not array');
      
      const migrations = ((result[0] as unknown) as any[] || []).map((m: any) => ({
        id: m.id,
        number: m.number,
        name: m.name,
        direction: m.direction,
        filename: m.filename,
        path: m.path,
        content: m.content,
        checksum: m.checksum,
        status: m.status,
        namespace: m.namespace,
        database: m.database,
        applied_at: m.applied_at,
        applied_by: m.applied_by,
        execution_time_ms: m.execution_time_ms
      })) as Migration[];
      
      this.debug.log(`Mapped migrations count: ${migrations.length}`);
      if (migrations.length > 0) {
        this.debug.log(`Sample migration:`, migrations[0]);
      }
      
      return migrations;
    } catch (error) {
      this.debug.error(`Failed to fetch migrations for direction='${direction}' path='${path}':`, error);
      throw new Error(`Failed to fetch migrations: ${error.message}`);
    }
  }

  async findLastMigrations(moduleIds: string[]): Promise<Migration[]> {
    if (moduleIds.length === 0) {
      return [];
    }

    try {
      this.debug.log(`Finding last migrations for modules: [${moduleIds.join(', ')}]`);
      
      // Use SurrealDB's GROUP BY to get the latest record per migration file automatically
      const result = await this.client.query(`
        SELECT id, module, name, number, direction, status, applied_at, filename, path, content, checksum, namespace, database, applied_by, execution_time_ms
        FROM system_migrations 
        WHERE module IN [${moduleIds.map(m => `'${m}'`).join(', ')}]
        GROUP BY module, name, number 
        ORDER BY applied_at DESC
      `);

      const migrations = (result[0] as unknown) as any[] || [];
      this.debug.log(`Found ${migrations.length} latest migration records across modules`);
      
      // Filter to only include migrations where the latest record is UP + SUCCESS (case insensitive)
      const eligibleMigrations = migrations.filter((migration: any) => 
        migration.direction?.toLowerCase() === 'up' && migration.status?.toLowerCase() === 'success'
      );
      
      this.debug.log(`Found ${eligibleMigrations.length} migrations eligible for rollback (latest record is UP+SUCCESS)`);

      // Convert to Migration interface format
      const result_migrations = eligibleMigrations.map(m => ({
        id: m.id,
        number: m.number,
        name: m.name,
        direction: m.direction,
        filename: m.filename || '',
        path: m.path || '',
        content: m.content || '',
        module: m.module,
        checksum: m.checksum,
        status: m.status,
        namespace: m.namespace,
        database: m.database,
        applied_at: m.applied_at,
        applied_by: m.applied_by,
        execution_time_ms: m.execution_time_ms
      }));

      // Sort migrations by number in descending order within each module
      // Preserve the module order that was passed in (important for rollback order)
      const moduleOrder = new Map<string, number>();
      moduleIds.forEach((moduleId, index) => {
        moduleOrder.set(moduleId, index);
      });
      
      result_migrations.sort((a, b) => {
        // First sort by module order (preserve the order passed in)
        const aOrder = moduleOrder.get(a.module) ?? 999;
        const bOrder = moduleOrder.get(b.module) ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // Then sort by number in descending order (newest first)
        return b.number.localeCompare(a.number);
      });

      this.debug.log(`Returning ${result_migrations.length} eligible migrations for rollback (preserving module order, number DESC)`);
      return result_migrations;

    } catch (error) {
      this.debug.error(`Failed to fetch last migrations for modules [${moduleIds.join(', ')}]:`, error);
      throw new Error(`Failed to fetch last migrations: ${error.message}`);
    }
  }

  async updateMigrationStatus(recordId: string, status: 'success' | 'fail'): Promise<void> {
    if (!recordId.startsWith('system_migrations:') || recordId.length < 18) {
      throw new Error('Invalid record ID format. Expected system_migrations:<uuid>');
    }

    try {
      const result = await this.client.query(
        `
        UPDATE $id SET
          status = $status,
          applied_at = $applied_at
        `,
        {
          id: recordId,
          status: status,
          applied_at: new Date().toISOString()
        }
      );

      if (!result[0]?.result?.length) {
        throw new Error(`No record found with ID ${recordId}`);
      }
    } catch (error) {
      throw new Error(`Failed to update migration status: ${error.message}`);
    }
  }

  async getAllModuleStatusCounts(moduleIds?: string[]): Promise<Map<string, {
    appliedCount: number;
    totalCount: number;
    lastApplied?: Date;
  }>> {
    try {
      const targetDescription = moduleIds && moduleIds.length > 0 
        ? `specific modules: [${moduleIds.join(', ')}]`
        : 'all modules';
      this.debug.log(`Getting status counts for ${targetDescription}`);
      
      // Get latest status per migration file using GROUP BY - filter by modules if specified
      const whereClause = moduleIds && moduleIds.length > 0 
        ? `WHERE module IN [${moduleIds.map(m => `'${m}'`).join(', ')}]`
        : '';
        
      const result = await this.client.query(`
        SELECT module, name, number, direction, status, applied_at
        FROM system_migrations 
        ${whereClause}
        GROUP BY module, name, number 
        ORDER BY applied_at DESC
      `);

      const migrations = result[0] || [];
      this.debug.log(`Found ${migrations.length} migration records for ${targetDescription}`);
      
      // Group by module and calculate counts
      const moduleStats = new Map<string, {
        appliedCount: number;
        totalCount: number;
        lastApplied?: Date;
      }>();
      
      // Group migrations by module
      const migrationsByModule = new Map<string, MigrationRecord[]>();
      const migrationsArray = Array.isArray(migrations) ? migrations : [];
      for (const migration of migrationsArray) {
        const moduleId = migration.module;
        if (!migrationsByModule.has(moduleId)) {
          migrationsByModule.set(moduleId, []);
        }
        migrationsByModule.get(moduleId)!.push(migration);
      }
      
      // Calculate stats for each module
      for (const [moduleId, moduleMigrations] of migrationsByModule.entries()) {
        // Count applied migrations (latest status is UP + SUCCESS, case insensitive)
        const appliedMigrations = moduleMigrations.filter(migration => 
          migration.direction?.toLowerCase() === 'up' && migration.status?.toLowerCase() === 'success'
        );
        
        // Find the most recent applied migration date
        let lastApplied: Date | undefined;
        if (appliedMigrations.length > 0) {
          const sortedByDate = appliedMigrations.sort((a, b) => 
            new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
          );
          lastApplied = new Date(sortedByDate[0].applied_at);
        }

        moduleStats.set(moduleId, {
          appliedCount: appliedMigrations.length,
          totalCount: moduleMigrations.length,
          lastApplied
        });
        
        this.debug.log(`Module ${moduleId}: ${appliedMigrations.length}/${moduleMigrations.length} applied`);
      }
      
      return moduleStats;

    } catch (error) {
      this.debug.error(`Failed to get status counts:`, error);
      throw new Error(`Failed to get module status counts: ${error.message}`);
    }
  }
}
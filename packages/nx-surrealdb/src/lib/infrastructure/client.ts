import { Surreal } from 'surrealdb';
import { SurrealDBConfig, SurrealQueryResult } from '../configuration/types';
import { Debug } from './debug';

export class SurrealDBClient {
  private db: Surreal;
  private debug = Debug.scope('surrealdb-client');
  private isDryRun: boolean = false;
  public username?: string;
  public namespace?: string;
  public database?: string;

  constructor(dryRun: boolean = false) {
    this.db = new Surreal();
    this.isDryRun = dryRun;
    this.debug.log(`SurrealDBClient initialized with dry-run: ${dryRun}`);
  }

  async create(table: string, data: Record<string, unknown>): Promise<void> {
    if (this.isDryRun) {
      this.debug.log('🔍 [DRY-RUN] Would create record:');
      this.debug.log(`   Table: ${table}`);
      this.debug.log(`   Data:`, JSON.stringify(data, null, 2));
      return;
    }

    try {
      await this.db.create(table, data as Record<string, unknown>); // Cast to any if library expects it, or ensure library handles unknown
    } catch (error) {
      throw new Error(`Failed to create record: ${error.message}`);
    }
  }

  async connect(config: SurrealDBConfig) {
    if (this.isDryRun) {
      this.debug.log('🔍 [DRY-RUN] Connecting to SurrealDB for read-only queries:', {
        url: config.url,
        namespace: config.namespace,
        database: config.database,
        username: config.username,
        hasPassword: !!config.password
      });
      
      // Store connection details
      this.username = config.username;
      this.namespace = config.namespace;
      this.database = config.database;
      
      // Still establish real connection for read-only queries in dry-run mode
      // This allows us to check migration status and other read operations
    }

    try {
      this.debug.log('Connecting to SurrealDB:', {
        url: config.url,
        namespace: config.namespace,
        database: config.database,
        username: config.username,
        hasPassword: !!config.password
      });
      
      await this.db.connect(config.url);
      await this.db.signin({
        username: config.username,
        password: config.password,
      });
      await this.db.use({
        namespace: config.namespace,
        database: config.database,
      });

      // Store connection details
      this.username = config.username;
      this.namespace = config.namespace;
      this.database = config.database;
    } catch (error) {
      this.debug.error('SurrealDB connection failed:', error);
      throw new Error(`Failed to connect to SurrealDB: ${error.message}`);
    }
  }

  async query(sql: string, params?: Record<string, unknown>): Promise<SurrealQueryResult[]> {
    if (this.isDryRun) {
      // Check if this is a read-only query
      const isReadOnlyQuery = this.isReadOnlyQuery(sql);
      
      if (isReadOnlyQuery) {
        this.debug.log('🔍 [DRY-RUN] Executing read-only query:');
      } else {
        this.debug.log('🔍 [DRY-RUN] Would execute write query:');
      }
      
      // Format SQL for better readability
      const formattedSql = this.formatSqlForDisplay(sql);
      this.debug.log(`   SQL:\n${formattedSql}`);
      
      if (params && Object.keys(params).length > 0) {
        this.debug.log(`   Parameters:`);
        for (const [key, value] of Object.entries(params)) {
          this.debug.log(`     $${key}: ${JSON.stringify(value)}`);
        }
      }
      
      // For read-only queries, execute them even in dry-run mode
      if (isReadOnlyQuery) {
        try {
          return await this.db.query(sql, params);
        } catch (error) {
          throw new Error(`Query execution failed: ${error.message}`);
        }
      }
      
      // For write queries, return empty result in dry-run mode
      return [];
    }

    try {
      return await this.db.query(sql, params);
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  private isReadOnlyQuery(sql: string): boolean {
    // Normalize SQL for checking (case insensitive)
    const normalizedSql = sql.trim().toLowerCase();
    
    // Common read-only patterns (case insensitive)
    const readOnlyPatterns = [
      /^select\s/i,           // SELECT queries
      /^show\s/i,             // SHOW queries
      /^describe\s/i,         // DESCRIBE queries
      /^explain\s/i           // EXPLAIN queries
    ];
    
    // Common write patterns (case insensitive)
    const writePatterns = [
      /^insert\s/i,           // INSERT
      /^update\s/i,           // UPDATE  
      /^delete\s/i,           // DELETE
      /^create\s/i,           // CREATE
      /^drop\s/i,             // DROP
      /^alter\s/i,            // ALTER
      /^define\s/i,           // DEFINE (SurrealDB)
      /^remove\s/i,           // REMOVE (SurrealDB)
      /^relate\s/i            // RELATE (SurrealDB)
    ];
    
    // Check for write patterns first (more specific)
    if (writePatterns.some(pattern => pattern.test(normalizedSql))) {
      return false;
    }
    
    // Check for read patterns
    if (readOnlyPatterns.some(pattern => pattern.test(normalizedSql))) {
      return true;
    }
    
    // Default to write operation for safety
    return false;
  }

  private formatSqlForDisplay(sql: string): string {
    // Simple SQL formatting for better readability
    return sql
      .trim()
      .split('\n')
      .map(line => `     ${line.trim()}`)
      .join('\n');
  }



  async close() {
    if (this.isDryRun) {
      this.debug.log('🔍 [DRY-RUN] Would close database connection');
      return;
    }
    
    await this.db.close();
  }
}
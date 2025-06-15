import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { SurrealDBClient } from '../infrastructure/client';
import { MigrationRepository } from './migration-repository';
import { ModuleLockManager } from './module-lock-manager';
import { ConfigLoader } from '../configuration/config-loader';
import { DependencyResolver } from './dependency-resolver';
import { MigrationFileProcessor, type MigrationFile, type MigrationContext } from '../filesystem/migration-file-processor';
import { PatternResolver, type PatternResolutionResult, type ResolvedFilename } from '../filesystem/pattern-resolver';
import { replaceEnvVars, loadEnvFile } from '../infrastructure/env';
import { resolveProjectPath } from '../infrastructure/project';
import { Debug } from '../infrastructure/debug';
import { MigrationRecord, Migration } from '../configuration/types';

export interface MigrationServiceOptions {
  url: string;
  user: string;
  pass: string;
  namespace?: string;
  database?: string;
  envFile?: string;
  useTransactions?: boolean;
  initPath?: string;
  schemaPath?: string;
  force?: boolean;
  configPath?: string;
  debug?: boolean;
  dryRun?: boolean;
}

export interface MigrationExecutionContext {
  client: SurrealDBClient;
  repository: MigrationRepository;
  resolver: DependencyResolver;
  options: ResolvedMigrationOptions;
}

export interface ResolvedMigrationOptions {
  url: string;
  user: string;
  pass: string;
  namespace: string;
  database: string;
  useTransactions: boolean;
  initPath: string;
  schemaPath?: string;
  force: boolean;
  configPath?: string;
  debug?: boolean;
  dryRun: boolean;
}


export interface MigrationResult {
  success: boolean;
  filesProcessed: number;
  filesSkipped: number;
  executionTimeMs: number;
  results: MigrationFileResult[];
}

export interface MigrationFileResult {
  file: MigrationFile;
  success: boolean;
  executionTimeMs: number;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export class MigrationService {
  private context: MigrationExecutionContext | null = null;
  private options: MigrationServiceOptions | null = null;
  private patternResolver: PatternResolver | null = null;
  private debug = Debug.scope('migration-service');

  constructor(private projectContext?: any) {}

  // Static utility methods for file operations
  static async findMatchingSubdirectory(basePath: string, pattern: string): Promise<string | null> {
    return MigrationFileProcessor.findMatchingSubdirectory(basePath, pattern);
  }

  async initialize(options: MigrationServiceOptions): Promise<void> {
    // Store options for later use
    this.options = options;
    
    // Enable debug mode if requested
    Debug.setEnabled(!!options.debug);
    
    // Load environment variables
    if (this.projectContext && options.envFile) {
      loadEnvFile(this.projectContext, options.envFile);
    }

    // Resolve options with environment variables
    const resolvedOptions: ResolvedMigrationOptions = {
      url: options.url ? replaceEnvVars(options.url) : process.env.SURREALDB_URL!,
      user: options.user ? replaceEnvVars(options.user) : process.env.SURREALDB_ROOT_USER!,
      pass: options.pass ? replaceEnvVars(options.pass) : process.env.SURREALDB_ROOT_PASS!,
      namespace: options.namespace ? replaceEnvVars(options.namespace) : process.env.SURREALDB_NAMESPACE || 'default',
      database: options.database ? replaceEnvVars(options.database) : process.env.SURREALDB_DATABASE || 'default',
      useTransactions: options.useTransactions ?? true,
      initPath: options.initPath ? replaceEnvVars(options.initPath) : process.env.MIGRATIONS_PATH || 'database',
      schemaPath: options.schemaPath ? replaceEnvVars(options.schemaPath) : undefined,
      force: options.force || false,
      configPath: options.configPath,
      debug: options.debug || false,
      dryRun: options.dryRun || false
    };

    if (!resolvedOptions.url || !resolvedOptions.user || !resolvedOptions.pass) {
      throw new Error('Missing required configuration. Provide either through options or environment variables.');
    }

    // Resolve project path if we have project context
    const basePath = this.projectContext 
      ? resolveProjectPath(this.projectContext, resolvedOptions.initPath)
      : resolvedOptions.initPath;

    // Initialize database client with dry-run flag
    const client = new SurrealDBClient(resolvedOptions.dryRun);
    await client.connect({
      url: resolvedOptions.url,
      username: resolvedOptions.user,
      password: resolvedOptions.pass,
      namespace: resolvedOptions.namespace,
      database: resolvedOptions.database
    });

    // Initialize migration repository with dry-run flag
    const repository = new MigrationRepository(client, resolvedOptions.schemaPath, resolvedOptions.dryRun);
    await repository.initialize();

    // Initialize dependency resolver
    const resolver = new DependencyResolver(basePath);
    await resolver.initialize(resolvedOptions.configPath);

    // Initialize pattern resolver
    this.patternResolver = new PatternResolver(resolver, basePath);

    this.context = {
      client,
      repository,
      resolver,
      options: resolvedOptions
    };
  }

  async findPendingMigrations(
    targetModules?: string[], 
    direction: 'up' | 'down' = 'up'
  ): Promise<MigrationFile[]> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }
    this.debug.log("findPendingMigrations:",targetModules);
    
    const { resolver, options, repository } = this.context;
    const basePath = this.projectContext 
      ? resolveProjectPath(this.projectContext, options.initPath)
      : options.initPath;

    // Determine which modules to process
    const modulesToProcess = targetModules && targetModules.length > 0
      ? this.resolveTargetModules(targetModules)
      : resolver.getAllModules();

    // Get execution order based on dependencies
    const executionOrder = direction === 'up'
      ? resolver.getExecutionOrder(modulesToProcess)
      : resolver.getRollbackOrder(modulesToProcess);

    const pendingMigrations: MigrationFile[] = [];

    for (const moduleId of executionOrder) {
      const moduleFiles = await this.findModuleMigrations(moduleId, direction, basePath);
      
      for (const file of moduleFiles) {
        // Check if migration should be applied
        const { canApply } = await repository.canApplyMigration(
          file.number,
          file.name,
          direction
        );

        if (canApply || options.force) {
          pendingMigrations.push(file);
        }
      }
    }

    return pendingMigrations;
  }

  async executeMigrations(
    targetModules?: string[],
    operation: 'migrate' | 'rollback' = 'migrate',
    targetFilenames?: string[]
  ): Promise<MigrationResult> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    
    // For rollback, find last applied migrations instead of pending migrations
    let migrationsToProcess: MigrationFile[];
    if (operation === 'rollback') {
      // If no target modules specified, get all modules for rollback
      let modulesToRollback: string[];
      if (targetModules && targetModules.length > 0) {
        // For specific modules, resolve them first
        const resolvedModules = this.resolveTargetModules(targetModules);
        const resolvedSet = new Set(resolvedModules);
        
        // Get the full rollback order, then filter to only requested modules
        const allModules = this.context.resolver.getAllModules();
        const fullRollbackOrder = this.context.resolver.getRollbackOrder(allModules);
        
        // Keep only the modules that were specifically requested, but in rollback order
        modulesToRollback = fullRollbackOrder.filter(module => resolvedSet.has(module));
        
        this.debug.log(`Specific modules requested for rollback (in order): ${modulesToRollback.join(', ')}`);
      } else {
        // For full rollback, get all modules in proper rollback order
        const allModules = this.context.resolver.getAllModules();
        modulesToRollback = this.context.resolver.getRollbackOrder(allModules);
        this.debug.log(`Rolling back all modules in order: ${modulesToRollback.join(', ')}`);
      }
      
      const appliedMigrations = await this.findLastMigrations(modulesToRollback);
      
      // Find corresponding down files for each applied migration
      const { options } = this.context;
      const basePath = this.projectContext 
        ? resolveProjectPath(this.projectContext, options.initPath)
        : options.initPath;

      migrationsToProcess = [];
      this.debug.log(`Processing ${appliedMigrations.length} applied migrations for rollback`);
      for (const migration of appliedMigrations) {
        const downFilename = `${migration.number}_${migration.name}_down.surql`;
        const downFilePath = path.join(basePath, migration.module, downFilename);
        this.debug.log(`Looking for down file: ${downFilePath}`);
        
        try {
          const content = await fs.readFile(downFilePath, 'utf-8');
          const checksum = crypto.createHash('sha256').update(content).digest('hex');
          this.debug.log(`Successfully loaded down file: ${downFilename}`);
          
          migrationsToProcess.push({
            number: migration.number,
            name: migration.name,
            direction: 'down',
            filename: downFilename,
            filePath: downFilePath,
            moduleId: migration.module,
            content,
            checksum
          });
        } catch (error) {
          this.debug.log(`Warning: Down file not found for ${migration.number}_${migration.name} in ${migration.module}: ${downFilePath}`);
          this.debug.log(`Error details: ${error.message}`);
        }
      }
      
      // Filter out locked modules unless force is enabled
      if (!options.force && operation === 'rollback') {
        const config = this.context.resolver.getConfig();
        const lockManager = ModuleLockManager.createLockManager(config);
        const originalCount = migrationsToProcess.length;
        
        migrationsToProcess = migrationsToProcess.filter(migration => {
          const isLocked = lockManager.isModuleLocked(migration.moduleId);
          if (isLocked) {
            this.debug.log(`Skipping locked module migration: ${migration.moduleId}/${migration.filename}`);
          }
          return !isLocked;
        });
        
        const filteredCount = originalCount - migrationsToProcess.length;
        if (filteredCount > 0) {
          this.debug.log(`Filtered out ${filteredCount} migrations from locked modules`);
        }
      }
      
      this.debug.log(`Total migrations to process: ${migrationsToProcess.length}`);
    } else {
      migrationsToProcess = await this.findPendingMigrations(targetModules, 'up');
    }

    // Apply filename filtering if specified
    if (targetFilenames && targetFilenames.length > 0) {
      const resolvedFilenames = await this.resolveTargetFilenames(
        targetFilenames, 
        targetModules, 
        operation === 'rollback' ? 'down' : 'up'
      );
      
      // Filter migrations to only include resolved filenames
      const filenameSet = new Set(resolvedFilenames.map(rf => rf.filename));
      migrationsToProcess = migrationsToProcess.filter(m => filenameSet.has(m.filename));
      
      this.debug.log(`Filtered migrations by filename: ${migrationsToProcess.length} remaining`);
    }
    
    if (migrationsToProcess.length === 0) {
      this.debug.log(`No migrations to process - returning early`);
      return {
        success: true,
        filesProcessed: 0,
        filesSkipped: 0,
        executionTimeMs: Math.round(performance.now() - startTime),
        results: []
      };
    }

    this.debug.log(`Starting execution of ${migrationsToProcess.length} migrations`);

    const results: MigrationFileResult[] = [];
    let filesProcessed = 0;
    let filesSkipped = 0;

    this.debug.log(`Processing ${migrationsToProcess.length} migration files`);
    for (const migrationFile of migrationsToProcess) {
      this.debug.log(`Executing migration: ${migrationFile.filename}`);
      const result = await this.executeSingleMigration(migrationFile);
      results.push(result);
      this.debug.log(`Migration ${migrationFile.filename} result: success=${result.success}, skipped=${result.skipped}`);

      if (result.skipped) {
        filesSkipped++;
        this.debug.log(`Incremented skipped count to: ${filesSkipped}`);
      } else if (result.success) {
        filesProcessed++;
        this.debug.log(`Incremented processed count to: ${filesProcessed}`);
      } else {
        this.debug.log(`Migration failed: ${result.error}`);
        // If a migration fails and we're not forcing, stop execution
        if (!this.context.options.force) {
          this.debug.log(`Stopping execution due to failure (force=${this.context.options.force})`);
          break;
        }
      }
    }

    const executionTimeMs = Math.round(performance.now() - startTime);
    const finalSuccess = results.every(r => r.success || r.skipped);
    
    this.debug.log(`Final result: success=${finalSuccess}, filesProcessed=${filesProcessed}, filesSkipped=${filesSkipped}, results.length=${results.length}`);

    return {
      success: finalSuccess,
      filesProcessed,
      filesSkipped,
      executionTimeMs,
      results
    };
  }

  async validateRollback(targetModules?: string[]): Promise<{ 
    canRollback: boolean; 
    blockedBy: string[]; 
    warnings: string[];
    migrationChecks: Array<{
      moduleId: string;
      hasAppliedMigrations: boolean;
      rollbackFilesAvailable: boolean;
      dependencyConflicts: string[];
    }>;
  }> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const { resolver, options } = this.context;
    const basePath = this.projectContext 
      ? resolveProjectPath(this.projectContext, options.initPath)
      : options.initPath;

    // Resolve target modules to handle patterns like "010" -> "010_auth"
    const resolvedModules = targetModules 
      ? this.resolveTargetModules(targetModules)
      : resolver.getAllModules();

    // Initialize result collectors
    const warnings: string[] = [];
    const blockedBySet = new Set<string>();
    const migrationChecks = [];
    let canRollback = true;

    // Validate each module
    for (const moduleId of resolvedModules) {
      // 1. Check dependency conflicts
      const dependencyValidation = resolver.validateRollback(moduleId, resolvedModules);
      if (!dependencyValidation.canRollback) {
        // Check if the blockers actually have applied migrations
        const actualBlockers = [];
        for (const blocker of dependencyValidation.blockedBy) {
          const blockerMigrations = await this.getAppliedMigrations(blocker);
          if (blockerMigrations.length > 0) {
            actualBlockers.push(blocker);
          }
        }
        
        if (actualBlockers.length > 0) {
          canRollback = false;
          actualBlockers.forEach(blocker => blockedBySet.add(blocker));
          warnings.push(`Cannot rollback ${moduleId} because it has active dependents with applied migrations: ${actualBlockers.join(', ')}`);
        }
        // If no actual blockers (all dependents have 0 applied migrations), allow rollback
      }

      // 2. Get migration state
      const [appliedMigrations, rollbackFiles] = await Promise.all([
        this.getAppliedMigrations(moduleId),
        this.findModuleMigrations(moduleId, 'down', basePath)
      ]);
      
      const hasAppliedMigrations = appliedMigrations.length > 0;
      const hasRollbackFiles = rollbackFiles.length > 0;

      // 3. Validate rollback file availability
      if (hasAppliedMigrations && !hasRollbackFiles) {
        canRollback = false;
        warnings.push(`Module ${moduleId} has applied migrations but no rollback files available`);
      }

      // 4. Validate each applied migration has a corresponding rollback file
      if (hasAppliedMigrations && hasRollbackFiles) {
        const rollbackFileMap = new Map(
          rollbackFiles.map(rf => [`${rf.number}_${rf.name}`, rf])
        );
        
        for (const applied of appliedMigrations) {
          const migrationKey = `${applied.number}_${applied.name}`;
          if (!rollbackFileMap.has(migrationKey)) {
            canRollback = false;
            warnings.push(`Missing rollback file for migration ${migrationKey} in ${moduleId}`);
          }
        }
      }

      // 5. Record migration check results
      migrationChecks.push({
        moduleId,
        hasAppliedMigrations,
        rollbackFilesAvailable: hasRollbackFiles,
        dependencyConflicts: dependencyValidation.blockedBy
      });
    }

    // Check for locked modules ONLY if there are applied migrations to rollback and force is not enabled
    if (!options.force && canRollback) {
      const modulesWithAppliedMigrations = migrationChecks.filter(check => check.hasAppliedMigrations);
      
      if (modulesWithAppliedMigrations.length > 0) {
        const config = resolver.getConfig();
        const lockManager = ModuleLockManager.createLockManager(config);
        const modulesToCheck = modulesWithAppliedMigrations.map(check => check.moduleId);
        const lockValidation = lockManager.validateRollbackLock(modulesToCheck);
        
        if (lockValidation.blockedModules.length > 0) {
          // Add warnings for locked modules but don't block the operation
          for (const blockedModule of lockValidation.blockedModules) {
            const reason = lockValidation.lockReasons[blockedModule];
            warnings.push(`🔒 Module ${blockedModule} is locked and will be skipped: ${reason}`);
          }
        }
      }
    }

    // Handle force flag override
    if (options.force && !canRollback) {
      warnings.push('WARNING: Force flag enabled - bypassing rollback safety checks');
      canRollback = true;
    }

    return {
      canRollback,
      blockedBy: Array.from(blockedBySet),
      warnings,
      migrationChecks
    };
  }

  async getMigrationStatus(targetModules?: string[]): Promise<{
    modules: Array<{
      moduleId: string;
      appliedMigrations: number;
      pendingMigrations: number;
      lastApplied?: Date;
      dependencies: string[];
      dependents: string[];
    }>;
    totalApplied: number;
    totalPending: number;
  }> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const { resolver, repository } = this.context;
    const modulesToCheck = targetModules ? this.resolveTargetModules(targetModules) : resolver.getAllModules();
    
    // Get all status counts in one query
    const dbStatusMap = await repository.getAllModuleStatusCounts(modulesToCheck);
    
    const modules = [];
    let totalApplied = 0;
    let totalPending = 0;

    for (const moduleId of modulesToCheck) {
      const dependencies = resolver.getModuleDependencies(moduleId);
      const dependents = resolver.getModuleDependents(moduleId);
      
      // Get filesystem count and database counts
      const statusCounts = await this.getModuleStatusCounts(moduleId);
      const dbStatus = dbStatusMap.get(moduleId);
      
      const appliedMigrations = dbStatus?.appliedCount || 0;
      const pendingMigrations = statusCounts.totalFileCount - appliedMigrations;
      const lastApplied = dbStatus?.lastApplied;

      modules.push({
        moduleId,
        appliedMigrations,
        pendingMigrations,
        lastApplied,
        dependencies,
        dependents
      });

      totalApplied += appliedMigrations;
      totalPending += pendingMigrations;
    }

    return {
      modules,
      totalApplied,
      totalPending
    };
  }

  async getFileStatus(resolvedFilenames: ResolvedFilename[]): Promise<Array<{
    filename: string;
    moduleId: string;
    number: string;
    name: string;
    direction: 'up' | 'down';
    status: 'applied' | 'pending' | 'unknown';
    appliedAt?: Date;
    checksum?: string;
    dependencies: string[];
    dependents: string[];
  }>> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    const { repository, resolver } = this.context;
    const fileStatuses = [];

    for (const file of resolvedFilenames) {
      // Check if migration is applied
      const migrationStatus = await repository.getLatestMigrationStatus(file.number, file.name);
      const isApplied = migrationStatus && migrationStatus.status === 'success';
      
      // Get module dependencies and dependents
      const dependencies = resolver.getModuleDependencies(file.moduleId);
      const dependents = resolver.getModuleDependents(file.moduleId);

      fileStatuses.push({
        filename: file.filename,
        moduleId: file.moduleId,
        number: file.number,
        name: file.name,
        direction: file.direction,
        status: isApplied ? 'applied' : 'pending',
        appliedAt: migrationStatus?.applied_at ? new Date(migrationStatus.applied_at) : undefined,
        checksum: migrationStatus?.checksum,
        dependencies,
        dependents
      });
    }

    return fileStatuses;
  }

  private buildMigrationRecord(
    migrationFile: MigrationFile, 
    status: 'success' | 'fail', 
    executionTimeMs: number
  ): MigrationRecord {
    const { options } = this.context!;
    
    return {
      number: migrationFile.number,
      name: migrationFile.name,
      direction: migrationFile.direction,
      filename: migrationFile.filename,
      path: path.dirname(migrationFile.filePath),
      content: migrationFile.content,
      module: migrationFile.moduleId,
      namespace: options.namespace,
      database: options.database,
      checksum: migrationFile.checksum,
      status,
      execution_time_ms: executionTimeMs
    };
  }

  async findLastMigrations(moduleIds: string[]): Promise<Migration[]> {
    if (!this.context) {
      throw new Error('Migration engine not initialized. Call initialize() first.');
    }

    return await this.context.repository.findLastMigrations(moduleIds);
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.client.close();
      this.context = null;
    }
  }

  public resolveTargetModules(targetModules: string[]): string[] {
    if (!this.patternResolver) {
      throw new Error('Migration engine not initialized.');
    }

    const result = this.patternResolver.resolveModules(targetModules);
    
    if (result.notFound.length > 0) {
      const allModules = this.context?.resolver.getAllModules() || [];
      throw new Error(`Module(s) not found: ${result.notFound.join(', ')}. Available modules: ${allModules.join(', ')}`);
    }

    return result.resolved.map(r => r.moduleId);
  }

  public async resolveTargetFilenames(
    filenamePatterns: string[], 
    targetModules?: string[], 
    direction: 'up' | 'down' = 'up'
  ): Promise<ResolvedFilename[]> {
    if (!this.patternResolver) {
      throw new Error('Migration engine not initialized.');
    }

    // Resolve module patterns first if provided
    const resolvedTargetModules = targetModules ? this.resolveTargetModules(targetModules) : undefined;

    const result = await this.patternResolver.resolveFilenames(filenamePatterns, resolvedTargetModules, direction);
    
    if (result.notFound.length > 0) {
      throw new Error(`Filename(s) not found: ${result.notFound.join(', ')}`);
    }

    return result.resolved;
  }

  public async resolveRollbackFilenames(
    filenamePatterns: string[],
    targetModules?: string[]
  ): Promise<{ resolved: ResolvedFilename[]; warnings: string[] }> {
    if (!this.patternResolver) {
      throw new Error('Migration engine not initialized.');
    }

    // Resolve module patterns first if provided
    const resolvedTargetModules = targetModules ? this.resolveTargetModules(targetModules) : undefined;

    const result = await this.patternResolver.resolveRollbackFilenames(filenamePatterns, resolvedTargetModules);
    
    if (result.notFound.length > 0) {
      throw new Error(`Rollback filename(s) not found: ${result.notFound.join(', ')}`);
    }

    return {
      resolved: result.resolved,
      warnings: result.dependencyWarnings
    };
  }

  private async findModuleMigrations(
    moduleId: string,
    direction: 'up' | 'down',
    basePath: string
  ): Promise<MigrationFile[]> {
    const modulePath = path.join(basePath, moduleId);
    
    try {
      const files = await fs.readdir(modulePath);
      const migrationFiles = MigrationFileProcessor.filterMigrationFiles(files, undefined, direction);
      
      const migrations: MigrationFile[] = [];
      
      for (const filename of migrationFiles) {
        const filePath = path.join(modulePath, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const checksum = crypto.createHash('sha256').update(content).digest('hex');
        
        const fileParts = filename.match(/^(\d+)_(.+)_(up|down)\.surql$/);
        if (!fileParts) continue;
        
        const [, number, name] = fileParts;
        
        migrations.push({
          number,
          name,
          direction,
          filename,
          filePath,
          moduleId,
          content,
          checksum
        });
      }
      
      return migrations.sort((a, b) => a.number.localeCompare(b.number));
    } catch (error) {
      // Module directory doesn't exist or is empty
      return [];
    }
  }

  private async executeSingleMigration(migrationFile: MigrationFile): Promise<MigrationFileResult> {
    if (!this.context) {
      throw new Error('Migration engine not initialized.');
    }

    const { client, repository, options } = this.context;
    const startTime = performance.now();

    try {
      // Check if migration can be applied (unless forcing)
      if (!options.force) {
        const { canApply, reason } = await repository.canApplyMigration(
          migrationFile.number,
          migrationFile.name,
          migrationFile.direction
        );

        if (!canApply) {
          return {
            file: migrationFile,
            success: true,
            executionTimeMs: Math.round(performance.now() - startTime),
            skipped: true,
            skipReason: reason
          };
        }
      }

      // Process migration content
      const processedContent = MigrationFileProcessor.processContent(migrationFile.content, {
        defaultNamespace: options.namespace,
        defaultDatabase: options.database,
        useTransactions: options.useTransactions
      });

      if (options.dryRun) {
        this.debug.log('🔍 [DRY-RUN] Would execute migration:');
        this.debug.log(`   File: ${migrationFile.moduleId}/${migrationFile.filename}`);
        this.debug.log(`   Direction: ${migrationFile.direction}`);
        this.debug.log(`   Content preview: ${processedContent.substring(0, 200)}${processedContent.length > 200 ? '...' : ''}`);
      }

      // Execute migration
      await client.query(processedContent);
      const executionTimeMs = Math.round(performance.now() - startTime);

      // Record migration
      await repository.addMigration(this.buildMigrationRecord(migrationFile, 'success', executionTimeMs));

      return {
        file: migrationFile,
        success: true,
        executionTimeMs
      };

    } catch (error) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      
      // Record failed migration
      await repository.addMigration(this.buildMigrationRecord(migrationFile, 'fail', executionTimeMs));

      return {
        file: migrationFile,
        success: false,
        executionTimeMs,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async getModuleStatusCounts(moduleId: string): Promise<{
    appliedCount: number;
    totalFileCount: number;
    lastApplied?: Date;
  }> {
    if (!this.context) return { appliedCount: 0, totalFileCount: 0 };
    
    // Get total migration files from filesystem
    const basePath = this.projectContext 
      ? resolveProjectPath(this.projectContext, this.context.options.initPath)
      : this.context.options.initPath;
    
    const allMigrationFiles = await this.findModuleMigrations(moduleId, 'up', basePath);
    
    return {
      appliedCount: 0, // This will be filled by caller from batch query
      totalFileCount: allMigrationFiles.length,
      lastApplied: undefined // This will be filled by caller from batch query
    };
  }

  private async getAppliedMigrations(moduleId: string): Promise<Array<{
    number: string;
    name: string;
    direction: 'up' | 'down';
    appliedAt: Date;
  }>> {
    if (!this.context) return [];
    
    this.debug.log(`Checking currently applied migrations for module ${moduleId}`);
    
    try {
      // Use findLastMigrations to get only migrations where the latest status is UP+SUCCESS
      const lastMigrations = await this.context.repository.findLastMigrations([moduleId]);
      this.debug.log(`Found ${lastMigrations.length} currently applied migrations for ${moduleId}`);
      
      return lastMigrations
        .map(migration => ({
          number: migration.number || '',
          name: migration.name || '',
          direction: 'up' as const,
          appliedAt: new Date(migration.applied_at || Date.now())
        }));
    } catch (error) {
      console.error(`Failed to get applied migrations for ${moduleId}:`, error);
      return [];
    }
  }

  getConfig() {
    return this.context?.resolver.getConfig() || null;
  }

  getAllModules(): string[] {
    return this.context?.resolver.getAllModules() || [];
  }
}
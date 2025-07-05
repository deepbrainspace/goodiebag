import { ExecutorContext, logger } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { MigrationFileProcessor } from '../../lib/filesystem/migration-file-processor';

export interface LintExecutorSchema {
  initPath: string;
  configPath?: string;
  fix?: boolean;
}

interface LintIssue {
  file: string;
  line?: number;
  severity: 'error' | 'warning';
  message: string;
  rule: string;
}

export default async function runExecutor(options: LintExecutorSchema, _context: ExecutorContext) {
  logger.info('🔍 Linting SurrealDB migration files...');

  const issues: LintIssue[] = [];

  try {
    // Get all migration files using the library function
    const migrationFiles = await MigrationFileProcessor.getAllMigrationFiles(options.initPath);

    logger.info(`📁 Found ${migrationFiles.length} migration files`);

    // Lint each file
    for (const file of migrationFiles) {
      const fullPath = path.join(options.initPath, file);
      const fileIssues = await lintFile(fullPath, options);
      issues.push(...fileIssues);
    }

    // Lint migration structure
    const structureIssues = await lintMigrationStructure(options.initPath, migrationFiles);
    issues.push(...structureIssues);

    // Lint config file if it exists
    const configIssues = await lintConfigFile(options.initPath, options.configPath);
    issues.push(...configIssues);

    // Report results
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    if (issues.length === 0) {
      logger.info('✅ No linting issues found');
      return { success: true };
    }

    // Display issues
    logger.info(`\n📋 Linting Results:`);
    logger.info(`   Errors: ${errors.length}`);
    logger.info(`   Warnings: ${warnings.length}\n`);

    for (const issue of issues) {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      const location = issue.line ? `:${issue.line}` : '';
      logger.info(`${icon} ${issue.file}${location}`);
      logger.info(`   ${issue.rule}: ${issue.message}\n`);
    }

    return { success: errors.length === 0 };
  } catch (error) {
    logger.error(`💥 Linting failed: ${error}`);
    return { success: false };
  }
}

async function lintFile(filePath: string, options: LintExecutorSchema): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileName = path.relative(options.initPath, filePath);

  // Check for basic SurrealDB syntax patterns
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('--') || trimmed === '') return;

    // Check for dangerous operations without safeguards
    if (trimmed.match(/^DROP\s+(TABLE|INDEX|FIELD)/i) && !trimmed.includes('IF EXISTS')) {
      issues.push({
        file: fileName,
        line: lineNum,
        severity: 'warning',
        message: 'Consider using IF EXISTS for DROP operations to avoid errors',
        rule: 'safe-drop',
      });
    }

    // Check for CREATE without IF NOT EXISTS
    if (
      trimmed.match(/^(DEFINE|CREATE)\s+(TABLE|INDEX|FIELD)/i) &&
      !trimmed.includes('IF NOT EXISTS')
    ) {
      issues.push({
        file: fileName,
        line: lineNum,
        severity: 'warning',
        message: 'Consider using IF NOT EXISTS for CREATE/DEFINE operations for idempotency',
        rule: 'idempotent-create',
      });
    }

    // Check for basic SQL injection patterns (though less relevant in migrations)
    if (trimmed.includes("' +") || trimmed.includes('" +')) {
      issues.push({
        file: fileName,
        line: lineNum,
        severity: 'warning',
        message: 'Potential string concatenation detected - ensure proper escaping',
        rule: 'safe-concatenation',
      });
    }
  });

  return issues;
}

async function lintMigrationStructure(initPath: string, allFiles: string[]): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  try {
    // Use the files already discovered
    const upFiles = allFiles.filter(f => f.endsWith('_up.surql'));
    const downFiles = allFiles.filter(f => f.endsWith('_down.surql'));

    // Check for missing down migrations
    for (const upFile of upFiles) {
      const downFile = upFile.replace('_up.surql', '_down.surql');
      if (!downFiles.includes(downFile)) {
        issues.push({
          file: upFile,
          severity: 'error',
          message: `Missing corresponding down migration: ${downFile}`,
          rule: 'migration-pairs',
        });
      }
    }

    // Check for orphaned down migrations
    for (const downFile of downFiles) {
      const upFile = downFile.replace('_down.surql', '_up.surql');
      if (!upFiles.includes(upFile)) {
        issues.push({
          file: downFile,
          severity: 'error',
          message: `Orphaned down migration - missing up migration: ${upFile}`,
          rule: 'migration-pairs',
        });
      }
    }

    // Check module naming convention
    const modulePattern = /^(\d{3})_([a-z][a-z0-9_]*)\//;

    for (const file of allFiles) {
      if (!modulePattern.test(file)) {
        issues.push({
          file: file,
          severity: 'error',
          message: 'Module must follow naming convention: XXX_name/ (e.g., 000_admin/, 010_auth/)',
          rule: 'module-naming',
        });
      }
    }
  } catch (error) {
    issues.push({
      file: 'structure',
      severity: 'error',
      message: `Failed to analyze migration structure: ${error}`,
      rule: 'structure-analysis',
    });
  }

  return issues;
}

async function lintConfigFile(initPath: string, configPath?: string): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];

  try {
    // Auto-detect config file if not specified
    const configFile = configPath || path.join(initPath, 'config.json');

    if (!fs.existsSync(configFile)) {
      issues.push({
        file: 'config.json',
        severity: 'warning',
        message: 'No config.json found - module dependencies cannot be validated',
        rule: 'config-missing',
      });
      return issues;
    }

    const configContent = fs.readFileSync(configFile, 'utf-8');
    const config = JSON.parse(configContent);

    // Validate config structure
    if (!config.modules || typeof config.modules !== 'object') {
      issues.push({
        file: 'config.json',
        severity: 'error',
        message: 'Config must have a "modules" object',
        rule: 'config-structure',
      });
      return issues;
    }

    // Check for circular dependencies
    const modules = Object.keys(config.modules);
    for (const moduleId of modules) {
      const visited = new Set<string>();
      if (hasCircularDependency(moduleId, config.modules, visited)) {
        issues.push({
          file: 'config.json',
          severity: 'error',
          message: `Circular dependency detected involving module: ${moduleId}`,
          rule: 'circular-dependency',
        });
      }
    }

    // Validate module IDs match directory structure
    const discoveredModules = await MigrationFileProcessor.discoverModules(initPath);
    const configModules = Object.keys(config.modules);

    for (const module of discoveredModules) {
      if (!configModules.includes(module.moduleId)) {
        issues.push({
          file: 'config.json',
          severity: 'warning',
          message: `Module directory "${module.moduleId}" not found in config.json`,
          rule: 'config-sync',
        });
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      issues.push({
        file: 'config.json',
        severity: 'error',
        message: 'Invalid JSON syntax in config file',
        rule: 'config-syntax',
      });
    } else {
      issues.push({
        file: 'config.json',
        severity: 'error',
        message: `Failed to lint config file: ${error}`,
        rule: 'config-analysis',
      });
    }
  }

  return issues;
}

function hasCircularDependency(
  moduleId: string,
  modules: Record<string, unknown>,
  visited: Set<string>,
  path: Set<string> = new Set()
): boolean {
  if (path.has(moduleId)) return true;
  if (visited.has(moduleId)) return false;

  visited.add(moduleId);
  path.add(moduleId);

  const module = modules[moduleId] as { dependencies?: string[] } | undefined;
  const dependencies = module?.dependencies || [];

  for (const dep of dependencies) {
    if (hasCircularDependency(dep, modules, visited, path)) {
      return true;
    }
  }

  path.delete(moduleId);
  return false;
}

import {
  Tree,
  logger,
} from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { TreeUtils } from '../../lib/filesystem/tree-utils';

export interface ImportModuleGeneratorSchema {
  module: string;
  packagePath: string;
  targetModule?: string;
  targetNumber?: number;
  initPath?: string;
  configPath?: string;
  overwrite?: boolean;
  skipDependencyCheck?: boolean;
  mergeConfig?: boolean;
}

export default async function (tree: Tree, options: ImportModuleGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  
  logger.info(`🚀 Importing module: ${normalizedOptions.module}`);
  logger.info(`📦 From package: ${normalizedOptions.packagePath}`);
  
  // Extract package if it's an archive
  const extractedPath = await extractPackage(normalizedOptions);
  
  // Validate package structure
  await validatePackage(extractedPath, normalizedOptions.module);
  
  // Determine target module name and path
  const targetModuleName = determineTargetModuleName(normalizedOptions, extractedPath);
  
  // Check if target module already exists
  await checkTargetModule(tree, normalizedOptions, targetModuleName);
  
  // Load and validate dependencies
  if (!normalizedOptions.skipDependencyCheck) {
    await validateDependencies(tree, normalizedOptions, extractedPath);
  }
  
  // Import migration files
  await importMigrationFiles(tree, normalizedOptions, extractedPath, targetModuleName);
  
  // Merge configuration
  if (normalizedOptions.mergeConfig) {
    await mergeModuleConfiguration(tree, normalizedOptions, extractedPath, targetModuleName);
  }
  
  // Skip formatFiles for this generator since it causes test timeouts
  
  logger.info(`✅ Module '${normalizedOptions.module}' imported successfully as '${targetModuleName}'!`);
  
  return () => {
    logger.info(`
🎉 Import completed!

Module: ${normalizedOptions.module} → ${targetModuleName}
Location: ${normalizedOptions.initPath}/${targetModuleName}

Next steps:
1. Review the imported migrations in ${normalizedOptions.initPath}/${targetModuleName}
2. Check configuration updates in ${normalizedOptions.initPath}/config.json
3. Verify dependencies are satisfied
4. Run: nx run your-project:migrate --module ${targetModuleName}
    `);
  };
}

function normalizeOptions(tree: Tree, options: ImportModuleGeneratorSchema) {
  return {
    ...options,
    targetModule: options.targetModule || '',
    targetNumber: options.targetNumber || 0,
    initPath: options.initPath || 'database',
    configPath: options.configPath || '',
    overwrite: options.overwrite ?? false,
    skipDependencyCheck: options.skipDependencyCheck ?? false,
    mergeConfig: options.mergeConfig ?? true,
  };
}

async function extractPackage(options: ReturnType<typeof normalizeOptions>): Promise<string> {
  const packagePath = path.resolve(options.packagePath);
  
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Package not found: ${packagePath}`);
  }
  
  const stat = fs.statSync(packagePath);
  
  if (stat.isDirectory()) {
    logger.info(`📁 Using directory package: ${packagePath}`);
    return packagePath;
  }
  
  // Extract archive to temporary directory
  const tempDir = path.join(process.cwd(), '.tmp', 'module-import', Date.now().toString());
  fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    if (packagePath.endsWith('.tar.gz') || packagePath.endsWith('.tgz')) {
      logger.info(`📦 Extracting tar archive...`);
      execSync(`tar -xzf "${packagePath}" -C "${tempDir}"`, { stdio: 'inherit' });
    } else if (packagePath.endsWith('.zip')) {
      logger.info(`📦 Extracting zip archive...`);
      execSync(`unzip -q "${packagePath}" -d "${tempDir}"`, { stdio: 'inherit' });
    } else {
      throw new Error(`Unsupported package format: ${packagePath}`);
    }
    
    // Find the extracted module directory
    const extracted = fs.readdirSync(tempDir);
    if (extracted.length === 0) {
      throw new Error('Archive appears to be empty');
    }
    
    return path.join(tempDir, extracted[0]);
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

async function validatePackage(extractedPath: string, _moduleName: string) {
  if (!fs.existsSync(extractedPath)) {
    throw new Error(`Extracted package path not found: ${extractedPath}`);
  }
  
  // Check for required files
  const requiredFiles = ['package.json', 'migrations'];
  for (const file of requiredFiles) {
    const filePath = path.join(extractedPath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Package is missing required file/directory: ${file}`);
    }
  }
  
  // Validate package.json
  const packageJsonPath = path.join(extractedPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  if (!packageJson.metadata?.moduleName) {
    throw new Error('Package.json is missing module metadata');
  }
  
  logger.info(`📋 Package validation passed`);
  logger.info(`   Module: ${packageJson.metadata.moduleName}`);
  logger.info(`   Version: ${packageJson.version}`);
  logger.info(`   Description: ${packageJson.description}`);
}

function determineTargetModuleName(
  options: ReturnType<typeof normalizeOptions>,
  extractedPath: string
): string {
  if (options.targetModule) {
    return options.targetModule;
  }
  
  if (options.targetNumber > 0) {
    const packageJsonPath = path.join(extractedPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const originalName = packageJson.metadata.moduleName;
    
    // Extract the name part (without number prefix)
    const namePart = originalName.replace(/^\d+_/, '');
    return `${String(options.targetNumber).padStart(3, '0')}_${namePart}`;
  }
  
  // Use original module name
  const packageJsonPath = path.join(extractedPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.metadata.moduleName;
}

async function checkTargetModule(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
  targetModuleName: string
) {
  const targetPath = path.join(options.initPath, targetModuleName);
  
  if (tree.exists(targetPath)) {
    if (!options.overwrite) {
      throw new Error(
        `Target module '${targetModuleName}' already exists. Use --overwrite to replace it.`
      );
    } else {
      logger.warn(`⚠️ Overwriting existing module: ${targetModuleName}`);
    }
  }
}

async function validateDependencies(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
  extractedPath: string
) {
  const moduleConfigPath = path.join(extractedPath, 'module.config.json');
  
  if (!fs.existsSync(moduleConfigPath)) {
    logger.warn(`⚠️ No module configuration found - skipping dependency validation`);
    return;
  }
  
  const moduleConfig = JSON.parse(fs.readFileSync(moduleConfigPath, 'utf-8'));
  const moduleName = Object.keys(moduleConfig)[0];
  const config = moduleConfig[moduleName];
  
  if (!config.depends || config.depends.length === 0) {
    logger.info(`✅ Module has no dependencies`);
    return;
  }
  
  // Check if dependencies exist in target project
  const targetConfigPath = options.configPath || path.join(options.initPath, 'config.json');
  
  const targetConfig = TreeUtils.readJsonFile(tree, targetConfigPath);
  if (targetConfig) {
    const missingDeps = config.dependencies.filter(dep => !(targetConfig as any).modules || !(targetConfig as any).modules[dep]);
    
    if (missingDeps.length > 0) {
      throw new Error(
        `Missing dependencies: ${missingDeps.join(', ')}. ` +
        `Install these modules first or use --skipDependencyCheck to override.`
      );
    }
  } else {
    logger.warn(`⚠️ No target configuration found - cannot validate dependencies`);
  }
  
  logger.info(`✅ All dependencies satisfied: ${config.depends.join(', ')}`);
}

async function importMigrationFiles(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
  extractedPath: string,
  targetModuleName: string
) {
  const sourceMigrationsPath = path.join(extractedPath, 'migrations');
  const targetMigrationsPath = path.join(options.initPath, targetModuleName);
  
  // Create target directory
  TreeUtils.ensureDirectory(tree, targetMigrationsPath);
  
  // Copy migration files
  const migrationFiles = fs.readdirSync(sourceMigrationsPath);
  
  for (const file of migrationFiles) {
    const sourceFilePath = path.join(sourceMigrationsPath, file);
    const targetFilePath = path.join(targetMigrationsPath, file);
    
    const stat = fs.statSync(sourceFilePath);
    if (stat.isFile() && file.endsWith('.surql')) {
      const content = fs.readFileSync(sourceFilePath, 'utf-8');
      tree.write(targetFilePath, content);
      logger.info(`📄 Imported: ${file}`);
    }
  }
  
  logger.info(`✅ Imported ${migrationFiles.length} migration files`);
}

async function mergeModuleConfiguration(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
  extractedPath: string,
  targetModuleName: string
) {
  const moduleConfigPath = path.join(extractedPath, 'module.config.json');
  
  if (!fs.existsSync(moduleConfigPath)) {
    logger.warn(`⚠️ No module configuration to merge`);
    return;
  }
  
  const moduleConfig = JSON.parse(fs.readFileSync(moduleConfigPath, 'utf-8'));
  const originalModuleName = Object.keys(moduleConfig)[0];
  const config = moduleConfig[originalModuleName];
  
  const targetConfigPath = options.configPath || path.join(options.initPath, 'config.json');
  
  let targetConfig: { modules: Record<string, unknown>; settings: { configFormat: string; useTransactions: boolean } } = {
    modules: {},
    settings: {
      configFormat: 'json',
      useTransactions: true
    }
  };
  
  // Load existing config if it exists in Tree
  const existingConfig = TreeUtils.readJsonFile(tree, targetConfigPath);
  if (existingConfig) {
    targetConfig = existingConfig as { modules: Record<string, unknown>; settings: { configFormat: string; useTransactions: boolean } };
  }
  
  // Add the new module configuration
  targetConfig.modules[targetModuleName] = {
    ...config,
    // Update any self-references in dependencies
    dependencies: config.dependencies?.map(dep => 
      dep === originalModuleName ? targetModuleName : dep
    ) || []
  };
  
  // Write updated configuration
  TreeUtils.writeJsonFile(tree, targetConfigPath, targetConfig);
  
  logger.info(`✅ Configuration merged for module: ${targetModuleName}`);
}
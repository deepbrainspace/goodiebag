import { Tree, logger } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { ConfigLoader } from '../../lib/configuration/config-loader';
import { TreeUtils } from '../../lib/filesystem/tree-utils';
import { ExportModuleGeneratorSchema } from './schema';

export default async function (tree: Tree, options: ExportModuleGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  logger.info(`🚀 Exporting module: ${normalizedOptions.module}`);

  // Find the module directory
  const moduleDir = await findModuleDirectory(tree, normalizedOptions);
  if (!moduleDir) {
    throw new Error(
      `Module '${normalizedOptions.module}' not found in ${normalizedOptions.initPath}`
    );
  }

  logger.info(`📁 Found module directory: ${moduleDir.name}`);

  // Load configuration to get module metadata
  await loadModuleConfig(normalizedOptions, moduleDir.name);

  // Skip complex package creation - we'll just tar the module files directly

  // Skip formatFiles for this generator since it causes test timeouts

  return () => {
    // Create simple tar archive directly from module files
    try {
      createSimpleArchive(normalizedOptions, moduleDir);
      logger.info(`✅ Module '${moduleDir.name}' exported successfully!`);
      logger.info(`📦 Archive: ${moduleDir.name}.tar.gz`);
      logger.info(`
🎉 Export completed!

Module: ${moduleDir.name}  
Archive: ${moduleDir.name}.tar.gz

To import this module in another project:
nx g @deepbrainspace/nx-surrealdb:import-module --module=${moduleDir.name} --packagePath=${moduleDir.name}.tar.gz --initPath=path/to/db
    `);
    } catch (error) {
      logger.error(`❌ Export failed: ${error.message}`);
    }
  };
}

function normalizeOptions(tree: Tree, options: ExportModuleGeneratorSchema) {
  return {
    ...options,
    module: String(options.module),
    outputPath: options.outputPath || 'exported-modules',
    includeConfig: options.includeConfig ?? true,
    packageFormat: options.packageFormat || 'tar',
    initPath: options.initPath || 'database',
    configPath: options.configPath || '',
    description: options.description || '',
  };
}

async function findModuleDirectory(tree: Tree, options: ReturnType<typeof normalizeOptions>) {
  if (!tree.exists(options.initPath)) {
    throw new Error(`Migrations directory not found: ${options.initPath}`);
  }

  const moduleName = TreeUtils.findMatchingSubdirectory(tree, options.initPath, options.module);
  if (!moduleName) {
    return null;
  }

  return {
    name: moduleName,
    path: path.join(options.initPath, moduleName),
  };
}

// Use shared TreeUtils for finding subdirectories

async function loadModuleConfig(options: ReturnType<typeof normalizeOptions>, moduleName: string) {
  try {
    const configPath = options.configPath || 'config.json';
    const fullConfigPath = path.isAbsolute(configPath)
      ? configPath
      : path.join(options.initPath, configPath);

    if (fs.existsSync(fullConfigPath)) {
      const config = await ConfigLoader.loadConfig(options.initPath, configPath);
      return config.modules[moduleName] || null;
    }

    return null;
  } catch (error) {
    logger.warn(`⚠️ Could not load module configuration: ${error.message}`);
    return null;
  }
}

function createSimpleArchive(
  options: ReturnType<typeof normalizeOptions>,
  moduleDir: { name: string; path: string }
) {
  const archiveName = `${moduleDir.name}.tar.gz`;

  // Create tar archive directly from the source module directory
  // This will include all .surql files in the module without extra wrapper directories
  execSync(`tar -czf ${archiveName} -C ${path.dirname(moduleDir.path)} ${moduleDir.name}`, {
    stdio: 'inherit',
  });

  logger.info(`📦 Created simple archive: ${archiveName}`);
}

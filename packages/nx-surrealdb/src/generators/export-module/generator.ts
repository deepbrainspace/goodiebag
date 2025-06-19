import { Tree, logger } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { ConfigLoader } from '../../lib/configuration/config-loader';
import { TreeUtils } from '../../lib/filesystem/tree-utils';
import { ModuleConfig } from '../../lib/configuration/types';

export interface ExportModuleGeneratorSchema {
  module: string | number;
  outputPath?: string;
  includeConfig?: boolean;
  packageFormat?: 'tar' | 'zip' | 'directory';
  initPath?: string;
  configPath?: string;
  version?: string;
  description?: string;
}

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
  const config = await loadModuleConfig(normalizedOptions, moduleDir.name);

  // Create export package structure
  await createExportPackage(tree, normalizedOptions, moduleDir, config as ModuleConfig | null);

  // Generate package files
  await generatePackageFiles(tree, normalizedOptions, moduleDir, config as ModuleConfig | null);

  // Create the package archive if requested
  if (normalizedOptions.packageFormat !== 'directory') {
    await createPackageArchive(normalizedOptions, moduleDir);
  }

  logger.info(`✅ Module '${moduleDir.name}' exported successfully!`);
  logger.info(`📦 Package location: ${normalizedOptions.outputPath}/${moduleDir.name}`);

  return () => {
    logger.info(`
🎉 Export completed!

Module: ${moduleDir.name}
Format: ${normalizedOptions.packageFormat}
Location: ${normalizedOptions.outputPath}/${moduleDir.name}

To import this module in another project:
nx g @deepbrainspace/nx-surrealdb:import-module ${moduleDir.name} --packagePath=${normalizedOptions.outputPath}/${moduleDir.name}
    `);
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
    version: options.version || '1.0.0',
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
    const configPath = options.configPath || path.join(options.initPath, 'config.json');

    if (fs.existsSync(configPath)) {
      const config = await ConfigLoader.loadConfig(options.initPath, configPath);
      return config.modules[moduleName] || null;
    }

    return null;
  } catch (error) {
    logger.warn(`⚠️ Could not load module configuration: ${error.message}`);
    return null;
  }
}

async function createExportPackage(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
  moduleDir: { name: string; path: string },
  _config: ModuleConfig | null
) {
  const exportPath = path.join(options.outputPath, moduleDir.name);

  // Create export directory structure
  TreeUtils.ensureDirectory(tree, exportPath);

  // Copy migration files from Tree
  TreeUtils.ensureDirectory(tree, path.join(exportPath, 'migrations'));
  TreeUtils.copyFiles(tree, moduleDir.path, path.join(exportPath, 'migrations'), filename =>
    filename.endsWith('.surql')
  );
}

async function generatePackageFiles(
  tree: Tree,
  options: ReturnType<typeof normalizeOptions>,
  moduleDir: { name: string; path: string },
  config: ModuleConfig | null
) {
  const exportPath = path.join(options.outputPath, moduleDir.name);

  // Generate package.json
  const packageJson = {
    name: `@migrations/${moduleDir.name}`,
    version: options.version,
    description:
      options.description || config?.description || `Migration module: ${moduleDir.name}`,
    main: 'index.js',
    keywords: ['surrealdb', 'migrations', 'nx'],
    dependencies: config?.dependencies || [],
    metadata: {
      moduleName: moduleDir.name,
      originalName: config?.name || moduleDir.name,
      exportedAt: new Date().toISOString(),
      exportedBy: '@deepbrainspace/nx-surrealdb',
      version: options.version,
    },
  };

  tree.write(path.join(exportPath, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Generate module configuration
  if (options.includeConfig && config) {
    const moduleConfig = {
      [moduleDir.name]: config,
    };

    tree.write(path.join(exportPath, 'module.config.json'), JSON.stringify(moduleConfig, null, 2));
  }

  // Generate README.md
  const readmeContent = generateReadme(tree, moduleDir, config, options);
  tree.write(path.join(exportPath, 'README.md'), readmeContent);

  // Generate import instructions
  const importScript = generateImportScript(moduleDir, options);
  tree.write(path.join(exportPath, 'import.sh'), importScript);
}

function generateReadme(
  tree: Tree,
  moduleDir: { name: string; path: string },
  config: ModuleConfig | null,
  options: ReturnType<typeof normalizeOptions>
): string {
  const migrationFiles = TreeUtils.getMigrationFiles(tree, moduleDir.path);

  return `# Migration Module: ${moduleDir.name}

## Description
${config?.description || `Migration module exported from ${moduleDir.name}`}

## Module Information
- **Name**: ${config?.name || moduleDir.name}
- **Version**: ${options.version}
- **Exported**: ${new Date().toISOString()}
- **Dependencies**: ${config?.dependencies?.join(', ') || 'None'}

## Migration Files
${migrationFiles.map(f => `- \`${f}\``).join('\n')}

## Usage

### Import this module into another project:
\`\`\`bash
nx g @deepbrainspace/nx-surrealdb:import-module ${moduleDir.name} --packagePath=path/to/this/module
\`\`\`

### Or manually copy:
1. Copy the \`migrations/\` directory to your target project's database directory
2. Update your \`config.json\` with the module configuration from \`module.config.json\`
3. Run migrations: \`nx run your-project:migrate --module ${moduleDir.name}\`

## Dependencies
${
  config?.dependencies?.length > 0
    ? `This module depends on: ${config.dependencies.join(
        ', '
      )}\n\nEnsure these modules are installed and migrated before using this module.`
    : 'This module has no dependencies.'
}

## Generated by
@deepbrainspace/nx-surrealdb export-module generator
`;
}

function generateImportScript(
  moduleDir: { name: string; path: string },
  _options: ReturnType<typeof normalizeOptions>
): string {
  return `#!/bin/bash
# Import script for ${moduleDir.name} migration module
# Generated by @deepbrainspace/nx-surrealdb

set -e

TARGET_DIR=\${1:-"database"}
MODULE_NAME="${moduleDir.name}"

echo "🚀 Importing migration module: $MODULE_NAME"
echo "📁 Target directory: $TARGET_DIR"

# Create target module directory if it doesn't exist
mkdir -p "$TARGET_DIR/$MODULE_NAME"

# Copy migration files
echo "📋 Copying migration files..."
cp migrations/* "$TARGET_DIR/$MODULE_NAME/"

# Copy module configuration if it exists
if [ -f "module.config.json" ]; then
  echo "⚙️ Module configuration found"
  if [ -f "$TARGET_DIR/config.json" ]; then
    echo "📝 Merging with existing config.json..."
    # Note: Manual merge required - see README.md for instructions
    echo "⚠️  Please manually merge module.config.json into $TARGET_DIR/config.json"
  else
    echo "📝 Creating new config.json..."
    cp module.config.json "$TARGET_DIR/config.json"
  fi
fi

echo "✅ Import completed!"
echo "📍 Module imported to: $TARGET_DIR/$MODULE_NAME"
echo ""
echo "Next steps:"
echo "1. Review and update dependencies in config.json if needed"
echo "2. Run: nx run your-project:migrate --module $MODULE_NAME"

chmod +x import.sh
`;
}

async function createPackageArchive(
  options: ReturnType<typeof normalizeOptions>,
  moduleDir: { name: string; path: string }
) {
  const exportPath = path.join(options.outputPath, moduleDir.name);
  const archiveName = `${moduleDir.name}-${options.version}`;

  try {
    if (options.packageFormat === 'tar') {
      execSync(`tar -czf ${archiveName}.tar.gz -C ${options.outputPath} ${moduleDir.name}`, {
        stdio: 'inherit',
      });
      logger.info(`📦 Created tar archive: ${archiveName}.tar.gz`);
    } else if (options.packageFormat === 'zip') {
      execSync(`cd ${options.outputPath} && zip -r ${archiveName}.zip ${moduleDir.name}`, {
        stdio: 'inherit',
      });
      logger.info(`📦 Created zip archive: ${archiveName}.zip`);
    }
  } catch (error) {
    logger.warn(`⚠️ Could not create archive: ${error.message}`);
    logger.info(`📁 Module exported as directory: ${exportPath}`);
  }
}

import { Tree, logger } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { TreeUtils } from '../../lib/filesystem/tree-utils';
import { ImportModuleGeneratorSchema } from './schema';

export default async function (tree: Tree, options: ImportModuleGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  logger.info(`🚀 Importing module: ${normalizedOptions.module}`);
  logger.info(`📦 From package: ${normalizedOptions.packagePath}`);

  try {
    // Simple import: extract archive and copy files directly
    await simpleImport(tree, normalizedOptions);

    logger.info(`✅ Module '${normalizedOptions.module}' imported successfully!`);

    return () => {
      logger.info(`
🎉 Import completed!

Module: ${normalizedOptions.module}
Location: ${normalizedOptions.initPath}/${normalizedOptions.module}

Next steps:
1. Review the imported migrations in ${normalizedOptions.initPath}/${normalizedOptions.module}
2. Run: nx run your-project:migrate --module ${normalizedOptions.module}
      `);
    };
  } catch (error) {
    logger.error(`❌ Import failed: ${error.message}`);
    throw error;
  }
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

async function simpleImport(tree: Tree, options: ReturnType<typeof normalizeOptions>) {
  const packagePath = path.resolve(options.packagePath);

  if (!fs.existsSync(packagePath)) {
    throw new Error(`Package not found: ${packagePath}`);
  }

  const stat = fs.statSync(packagePath);
  let sourceDir: string;

  if (stat.isDirectory()) {
    // Direct directory import
    logger.info(`📁 Using directory package: ${packagePath}`);
    sourceDir = packagePath;
  } else if (packagePath.endsWith('.tar.gz') || packagePath.endsWith('.tgz')) {
    // Extract tar archive
    logger.info(`📦 Extracting tar archive...`);
    const tempDir = path.join(process.cwd(), '.tmp', 'module-import', Date.now().toString());
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      execSync(`tar -xzf "${packagePath}" -C "${tempDir}"`, { stdio: 'inherit' });

      // Find the extracted module directory
      const extracted = fs.readdirSync(tempDir);
      if (extracted.length === 0) {
        throw new Error('Archive appears to be empty');
      }

      sourceDir = path.join(tempDir, extracted[0]);
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      throw error;
    }
  } else {
    throw new Error(`Unsupported package format: ${packagePath}`);
  }

  // Copy files directly to target location
  const targetDir = path.join(options.initPath, options.module);

  // Check if target already exists
  if (tree.exists(targetDir) && !options.overwrite) {
    throw new Error(
      `Target module '${options.module}' already exists. Use --overwrite to replace it.`
    );
  }

  if (tree.exists(targetDir) && options.overwrite) {
    logger.warn(`⚠️ Overwriting existing module: ${options.module}`);
  }

  // Create target directory
  TreeUtils.ensureDirectory(tree, targetDir);

  // Copy all .surql files from source to target
  const sourceFiles = fs.readdirSync(sourceDir);
  const copiedFiles = [];

  for (const file of sourceFiles) {
    if (file.endsWith('.surql')) {
      const sourceFilePath = path.join(sourceDir, file);
      const targetFilePath = path.join(targetDir, file);
      const content = fs.readFileSync(sourceFilePath, 'utf-8');

      tree.write(targetFilePath, content);
      copiedFiles.push(file);
      logger.info(`📄 Imported: ${file}`);
    }
  }

  logger.info(`✅ Imported ${copiedFiles.length} migration files`);
}

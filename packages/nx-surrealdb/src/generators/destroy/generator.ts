import { Tree, logger, getProjects, removeProjectConfiguration } from '@nx/devkit';
import { DestroyGeneratorSchema } from './schema';

export default async function (tree: Tree, options: DestroyGeneratorSchema) {
  const normalizedOptions = normalizeOptions(options);

  logger.info(`🗑️ Destroying database project: ${normalizedOptions.projectName}`);

  // Get all projects to find the target
  const projects = getProjects(tree);
  const project = projects.get(normalizedOptions.projectName);

  if (!project) {
    throw new Error(`Project '${normalizedOptions.projectName}' not found in workspace`);
  }

  logger.info(`📁 Found project at: ${project.root}`);

  // Check if user confirmed destruction (either via --force or interactive prompt)
  if (!normalizedOptions.force && !normalizedOptions.confirmed) {
    logger.warn(`⚠️ This will permanently delete the project '${normalizedOptions.projectName}' and all its files.`);
    logger.warn(`📂 Location: ${project.root}`);
    logger.warn(`💡 Use --force to bypass this confirmation`);
    
    throw new Error(`Destruction cancelled. Use --force flag to proceed with deletion.`);
  }

  // 1. Remove NX project configuration
  logger.info(`📝 Removing project configuration from workspace...`);
  removeProjectConfiguration(tree, normalizedOptions.projectName);

  // 2. Remove all project files and directories
  logger.info(`🗂️ Removing project files: ${project.root}`);
  if (tree.exists(project.root)) {
    tree.delete(project.root);
  }

  // 3. Clean up any potential dependencies in package.json
  // Note: Most NX projects don't add deps to root package.json, but we'll check
  if (tree.exists('package.json')) {
    const packageJson = JSON.parse(tree.read('package.json', 'utf-8'));
    let modified = false;

    // Remove any surrealdb-related dependencies that might have been added
    const depsToCheck = ['dependencies', 'devDependencies', 'peerDependencies'];
    for (const depType of depsToCheck) {
      if (packageJson[depType] && packageJson[depType]['surrealdb']) {
        delete packageJson[depType]['surrealdb'];
        modified = true;
        logger.info(`🧹 Removed surrealdb dependency from ${depType}`);
      }
    }

    if (modified) {
      tree.write('package.json', JSON.stringify(packageJson, null, 2));
    }
  }

  logger.info(`✅ Project '${normalizedOptions.projectName}' destroyed successfully!`);
  logger.info(`🎯 You can now safely run: nx g @deepbrainspace/nx-surrealdb:init ${normalizedOptions.projectName}`);

  return () => {
    logger.info(`
🎉 Destruction completed!

Project: ${normalizedOptions.projectName}
Status: Completely removed from workspace

Next steps:
1. Verify with: nx show projects
2. Re-create with: nx g @deepbrainspace/nx-surrealdb:init ${normalizedOptions.projectName}
    `);
  };
}

function normalizeOptions(options: DestroyGeneratorSchema) {
  return {
    ...options,
    force: options.force ?? false,
    confirmed: options.confirmed ?? false,
  };
}
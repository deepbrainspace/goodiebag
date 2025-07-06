import { Tree, formatFiles, generateFiles, installPackagesTask, workspaceRoot } from '@nx/devkit';
import { MigrationsConfig } from '../../lib/configuration/config-loader';
import { InitGeneratorSchema } from './schema';
import * as path from 'path';

export default async function (tree: Tree, options: InitGeneratorSchema) {
  const { name } = options;

  // Calculate installation path
  const basePath = options.path || '.';
  const dbPath = options.dbPath || options['db-path'] || '';
  const projectPath = dbPath ? path.join(basePath, name, dbPath) : path.join(basePath, name);

  // Extract clean project name (remove any base path prefix if present)
  const projectName =
    basePath !== '.' && name.startsWith(basePath + '/')
      ? name.substring(basePath.length + 1)
      : name;

  // Auto-install required dependencies
  const packageJson = tree.read('package.json');
  if (packageJson) {
    const pkg = JSON.parse(packageJson.toString());
    const requiredDeps = {
      surrealdb: '^1.3.2',
      dotenv: '^16.5.0',
      picocolors: '^1.1.1',
    };

    let depsToAdd = false;
    pkg.dependencies = pkg.dependencies || {};

    for (const [dep, version] of Object.entries(requiredDeps)) {
      if (!pkg.dependencies[dep]) {
        pkg.dependencies[dep] = version;
        depsToAdd = true;
      }
    }

    if (depsToAdd) {
      tree.write('package.json', JSON.stringify(pkg, null, 2));
      console.log(`
📦 Installing required dependencies:
   - surrealdb
   - dotenv
   - picocolors
`);
    }
  }

  // Derive namespace from project name if not provided
  // Strip component suffix (e.g., "exponentials.tv/db" -> "exponentials.tv")
  const derivedNamespace = projectName.includes('/') ? projectName.split('/')[0] : projectName;

  // Parse environments from comma-separated string
  const environmentsString = options.environments || 'development,staging,production';
  const environments = environmentsString.split(',').map(env => env.trim());

  // Set defaults using the same pattern as the library
  const config = {
    name: projectName,
    url: options.url || 'ws://localhost:8000/rpc',
    namespace: options.namespace || derivedNamespace,
    environments,
    database: options.database || environments[0], // Use first environment as default
    user: options.user || 'root',
    pass: options.pass || 'root',
  };

  // Create the initial module configuration and write it to config.json
  const moduleConfig: MigrationsConfig = {
    modules: {
      '000_admin': {
        name: 'System Administration',
        description: 'Core database setup and administrative functions',
        dependencies: [],
        locked: true,
        lockReason: 'Critical system module - contains core admin setup and permissions',
      },
      '010_auth': {
        name: 'Authentication & Users',
        description: 'User authentication and authorization system',
        dependencies: ['000_admin'],
      },
      '020_schema': {
        name: 'Application Schema',
        description: 'Core application data models and relationships',
        dependencies: ['010_auth'],
      },
    },
    environments: config.environments,
    settings: {
      configFormat: 'json',
      useTransactions: true,
      defaultNamespace: config.namespace,
      defaultDatabase: config.database,
    },
  };

  // Calculate the relative path for the schema
  const schemaPath = path.relative(
    projectPath,
    path.join(workspaceRoot, 'node_modules/nx/schemas/project-schema.json')
  );

  // Generate the database project structure including project.json from template
  generateFiles(tree, path.join(__dirname, 'files'), projectPath, {
    ...config,
    template: '',
    moduleConfig: JSON.stringify(moduleConfig, null, 2),
    name: projectName,
    initPath: projectPath,
    schemaPath,
  });

  await formatFiles(tree);

  // Log helpful next steps
  console.log(`
✅ Database project '${projectName}' created successfully!

📋 Next steps:
1. Set up your environment variables in .env:
   - SURREALDB_URL=ws://localhost:8000/rpc
   - SURREALDB_ROOT_USER=root
   - SURREALDB_ROOT_PASS=root
   - SURREALDB_NAMESPACE=${config.namespace}
   - SURREALDB_DATABASE=${config.database}

2. Review and customize the starter migrations:
   - ${projectPath}/000_admin/0001_setup_*.surql (System setup)
   - ${projectPath}/010_auth/0001_users_*.surql (User authentication)
   - ${projectPath}/020_schema/0001_tables_*.surql (Application schema)

3. Uncomment and customize the migration code, then run:
   nx run ${projectName}:migrate

For more info, see ${projectPath}/README.md
  `);

  // Auto-install packages
  return installPackagesTask(tree);
}

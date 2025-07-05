import {
  Tree,
  formatFiles,
  generateFiles,
  addProjectConfiguration,
  ProjectConfiguration,
  installPackagesTask,
} from '@nx/devkit';
import { MigrationsConfig } from '../../lib/configuration/config-loader';
import * as path from 'path';

export interface InitGeneratorSchema {
  name: string;
  path?: string;
  'db-path'?: string;
  dbPath?: string;
  url?: string;
  namespace?: string;
  environments?: string;
  database?: string;
  user?: string;
  pass?: string;
}

export default async function (tree: Tree, options: InitGeneratorSchema) {
  const { name } = options;
  
  // Calculate installation path
  const basePath = options.path || '.';
  const dbPath = options.dbPath || options['db-path'] || 'db';
  const projectPath = path.join(basePath, name, dbPath);

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
  const derivedNamespace = name; // e.g., "myproject"
  
  // Parse environments from comma-separated string
  const environmentsString = options.environments || 'development,staging,production';
  const environments = environmentsString.split(',').map(env => env.trim());
  
  // Set defaults using the same pattern as the library
  const config = {
    name,
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

  // Generate the database project structure
  generateFiles(tree, path.join(__dirname, 'files'), projectPath, {
    ...config,
    template: '',
    moduleConfig: JSON.stringify(moduleConfig, null, 2),
  });

  // Add NX project configuration
  const projectConfig: ProjectConfiguration = {
    name,
    root: projectPath,
    targets: {
      migrate: {
        executor: '@deepbrainspace/nx-surrealdb:migrate',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}',
          initPath: projectPath,
        },
      },
      rollback: {
        executor: '@deepbrainspace/nx-surrealdb:rollback',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}',
          initPath: projectPath,
        },
      },
      status: {
        executor: '@deepbrainspace/nx-surrealdb:status',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}',
          initPath: projectPath,
        },
      },
      reset: {
        executor: '@deepbrainspace/nx-surrealdb:reset',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}',
        },
      },
    },
  };

  addProjectConfiguration(tree, name, projectConfig);

  await formatFiles(tree);

  // Log helpful next steps
  console.log(`
✅ Database project '${name}' created successfully!

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
   nx run ${name}:migrate

For more info, see ${projectPath}/README.md
  `);

  // Auto-install packages
  return installPackagesTask(tree);
}

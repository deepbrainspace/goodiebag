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
  url?: string;
  namespace?: string;
  database?: string;
  user?: string;
  pass?: string;
}

export default async function (tree: Tree, options: InitGeneratorSchema) {
  const { name } = options;

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

  // Set defaults using the same pattern as the library
  const config = {
    name,
    url: options.url || 'ws://localhost:8000/rpc',
    namespace: options.namespace || 'development',
    database: options.database || 'main',
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
    settings: {
      configFormat: 'json',
      useTransactions: true,
      defaultNamespace: config.namespace,
      defaultDatabase: config.database,
    },
  };

  // Generate the database project structure
  generateFiles(tree, path.join(__dirname, 'files'), name, {
    ...config,
    template: '',
    moduleConfig: JSON.stringify(moduleConfig, null, 2),
  });

  // Add NX project configuration
  const projectConfig: ProjectConfiguration = {
    name,
    root: name,
    targets: {
      migrate: {
        executor: '@deepbrainspace/nx-surrealdb:migrate',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}',
          initPath: name,
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
          initPath: name,
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
          initPath: name,
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
   - ${name}/000_admin/0001_setup_*.surql (System setup)
   - ${name}/010_auth/0001_users_*.surql (User authentication)
   - ${name}/020_schema/0001_tables_*.surql (Application schema)

3. Uncomment and customize the migration code, then run:
   nx run ${name}:migrate

For more info, see ${name}/README.md
  `);

  // Auto-install packages
  return installPackagesTask(tree);
}

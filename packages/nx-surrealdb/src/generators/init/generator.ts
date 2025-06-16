import { Tree, formatFiles, generateFiles, addProjectConfiguration, ProjectConfiguration } from '@nx/devkit';
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
  
  // Set defaults using the same pattern as the library
  const config = {
    name,
    url: options.url || 'ws://localhost:8000/rpc',
    namespace: options.namespace || 'development',
    database: options.database || 'main',
    user: options.user || 'root',
    pass: options.pass || 'root'
  };

<<<<<<< HEAD
  // Create the initial module configuration and write it to config.json
=======
  // Create the initial module configuration
>>>>>>> 5c54b5b (feat: implement self-contained nx-surrealdb package with init generator)
  const moduleConfig: MigrationsConfig = {
    modules: {
      '000_admin': {
        name: 'System Administration',
        description: 'Core database setup and administrative functions',
<<<<<<< HEAD
        dependencies: [],
=======
        depends: [],
>>>>>>> 5c54b5b (feat: implement self-contained nx-surrealdb package with init generator)
        locked: true,
        lockReason: 'Critical system module - contains core admin setup and permissions'
      },
      '010_auth': {
        name: 'Authentication & Users',
        description: 'User authentication and authorization system',
<<<<<<< HEAD
        dependencies: ['000_admin']
=======
        depends: ['000_admin']
>>>>>>> 5c54b5b (feat: implement self-contained nx-surrealdb package with init generator)
      },
      '020_schema': {
        name: 'Application Schema',
        description: 'Core application data models and relationships',
<<<<<<< HEAD
        dependencies: ['010_auth']
=======
        depends: ['010_auth']
>>>>>>> 5c54b5b (feat: implement self-contained nx-surrealdb package with init generator)
      }
    },
    settings: {
      configFormat: 'json',
      useTransactions: true,
      defaultNamespace: config.namespace,
      defaultDatabase: config.database
    }
  };

  // Generate the database project structure
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    name,
    {
      ...config,
      template: '',
      moduleConfig: JSON.stringify(moduleConfig, null, 2)
    }
  );

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
          initPath: name
        }
      },
      rollback: {
        executor: '@deepbrainspace/nx-surrealdb:rollback',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}',
          initPath: name
        }
      },
      status: {
        executor: '@deepbrainspace/nx-surrealdb:status',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}',
          initPath: name
        }
      },
      reset: {
        executor: '@deepbrainspace/nx-surrealdb:reset',
        options: {
          url: '${SURREALDB_URL}',
          user: '${SURREALDB_ROOT_USER}',
          pass: '${SURREALDB_ROOT_PASS}',
          namespace: '${SURREALDB_NAMESPACE}',
          database: '${SURREALDB_DATABASE}'
        }
      }
    }
  };

  addProjectConfiguration(tree, name, projectConfig);

  await formatFiles(tree);
}
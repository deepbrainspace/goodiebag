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

  // Create the initial module configuration
  const moduleConfig: MigrationsConfig = {
    modules: {
      '000_admin': {
        name: 'System Administration',
        description: 'Core database setup and administrative functions',
        depends: [],
        locked: true,
        lockReason: 'Critical system module - contains core admin setup and permissions'
      },
      '010_auth': {
        name: 'Authentication & Users',
        description: 'User authentication and authorization system',
        depends: ['000_admin']
      },
      '020_schema': {
        name: 'Application Schema',
        description: 'Core application data models and relationships',
        depends: ['010_auth']
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
      template: ''
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
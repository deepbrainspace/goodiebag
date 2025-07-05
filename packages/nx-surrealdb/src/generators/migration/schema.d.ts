export interface MigrationGeneratorSchema {
  name: string;
  project: string;
  module?: string | number;
  migrationsDir?: string;
  createModule?: boolean;
  positionalArgs?: string[];
}

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

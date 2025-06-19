export interface CargoToml {
  // Workspace is only applicable to the root Cargo.toml
  workspace?: { members: string[] };
  package: { name: string; version: string; [key: string]: unknown };
  dependencies?: Record<
    string,
    string | { version: string; features?: string[]; optional?: boolean }
  >;
  'dev-dependencies'?: Record<string, string | { version: string; features: string[] }>;
  [key: string]: unknown;
}

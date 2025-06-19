export interface FmtExecutorSchema {
  check?: boolean;
  toolchain?: 'stable' | 'beta' | 'nightly';
  all?: boolean;
  args?: string | string[];
}

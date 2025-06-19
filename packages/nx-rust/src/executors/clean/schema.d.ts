export interface CleanExecutorSchema {
  'target-dir'?: string;
  toolchain?: 'stable' | 'beta' | 'nightly';
  release?: boolean;
  doc?: boolean;
  args?: string | string[];
}

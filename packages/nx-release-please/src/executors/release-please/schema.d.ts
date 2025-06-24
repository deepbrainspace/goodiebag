export interface ReleaseExecutorSchema {
  specifier?: 'major' | 'minor' | 'patch';
  dryRun?: boolean;
  verbose?: boolean;
  skipPr?: boolean;
  createReleaseBranch?: boolean;
  baseBranch?: string;
  firstRelease?: boolean;
  skipPublish?: boolean;
  affected?: boolean;
  base?: string;
  head?: string;
  ensureCleanBase?: boolean;
  yes?: boolean;
  groups?: string[];
  projects?: string[];
  preid?: string;
  gitRemote?: string;
  gitCommitMessage?: string;
  gitTagMessage?: string;
  stageChanges?: boolean;
}

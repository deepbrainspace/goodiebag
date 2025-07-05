export interface ImportModuleGeneratorSchema {
  module: string;
  packagePath: string;
  targetModule?: string;
  targetNumber?: number;
  initPath?: string;
  configPath?: string;
  overwrite?: boolean;
  skipDependencyCheck?: boolean;
  mergeConfig?: boolean;
}

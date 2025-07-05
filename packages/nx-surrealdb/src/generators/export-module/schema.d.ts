export interface ExportModuleGeneratorSchema {
  module: string | number;
  outputPath?: string;
  includeConfig?: boolean;
  packageFormat?: 'tar' | 'zip' | 'directory';
  initPath?: string;
  configPath?: string;
  description?: string;
}

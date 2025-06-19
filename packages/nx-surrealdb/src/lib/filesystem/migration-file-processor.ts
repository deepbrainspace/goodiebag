import * as fs from 'fs/promises';
import * as path from 'path';
import { replaceEnvVars } from '../infrastructure/env';

export interface MigrationFile {
  number: string;
  name: string;
  direction: 'up' | 'down';
  filename: string;
  filePath: string;
  moduleId: string;
  content: string;
  checksum: string;
}

export interface MigrationContext {
  defaultNamespace?: string;
  defaultDatabase?: string;
  useTransactions?: boolean;
}

export class MigrationFileProcessor {
  private static readonly MIGRATION_PATTERN = /^(\d{4})_(.+?)_(up|down)\.surql$/;
  private static readonly SUBDIR_PATTERN = /^(\d{1,4})_(.+)$/;
  private static readonly NAMESPACE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+NAMESPACE/i;
  private static readonly DATABASE_OPERATIONS = /(?:DEFINE|USE|REMOVE)\s+DATABASE/i;
  private static readonly DDL_OPERATIONS =
    /^\s*(DEFINE|REMOVE)\s+(NAMESPACE|DATABASE|TABLE|FIELD|INDEX|FUNCTION)/im;
  private static readonly TRANSACTION_BEGIN = /BEGIN\s+TRANSACTION/i;
  private static readonly TRANSACTION_COMMIT = /COMMIT\s+TRANSACTION/i;

  static async findMatchingSubdirectory(basePath: string, pattern: string): Promise<string | null> {
    try {
      const subDirs = await fs.readdir(basePath, { withFileTypes: true });
      const directories = subDirs.filter(d => d.isDirectory()).map(d => d.name);

      const normalizedPattern = pattern.trim().toLowerCase();
      const patternAsNumber = parseInt(normalizedPattern, 10);
      const normalizedPatternNumber = isNaN(patternAsNumber) ? null : patternAsNumber.toString();

      for (const dirName of directories) {
        const normalizedDirName = dirName.toLowerCase();
        const match = normalizedDirName.match(this.SUBDIR_PATTERN);
        if (!match) continue;

        const [, number, name] = match;
        const normalizedNumber = parseInt(number, 10).toString();

        if (
          normalizedDirName === normalizedPattern ||
          (normalizedPatternNumber !== null && normalizedPatternNumber === normalizedNumber) ||
          normalizedPattern === name.toLowerCase() ||
          normalizedPattern === `${normalizedNumber}_${name.toLowerCase()}` ||
          normalizedPattern === `${number}_${name.toLowerCase()}`
        ) {
          return dirName;
        }
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to read subdirectories in ${basePath}: ${error.message}`);
    }
  }

  static async discoverModules(
    basePath: string
  ): Promise<Array<{ moduleId: string; modulePath: string }>> {
    try {
      const subDirs = await fs.readdir(basePath, { withFileTypes: true });
      const modules: Array<{ moduleId: string; modulePath: string }> = [];

      for (const dirent of subDirs) {
        if (dirent.isDirectory() && this.SUBDIR_PATTERN.test(dirent.name)) {
          modules.push({
            moduleId: dirent.name,
            modulePath: path.join(basePath, dirent.name),
          });
        }
      }

      // Sort by module number
      return modules.sort((a, b) => {
        const aMatch = a.moduleId.match(this.SUBDIR_PATTERN);
        const bMatch = b.moduleId.match(this.SUBDIR_PATTERN);
        if (!aMatch || !bMatch) return 0;
        return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to discover modules in ${basePath}: ${error.message}`);
    }
  }

  static async getNextMigrationNumber(modulePath: string): Promise<string> {
    try {
      const files = await fs.readdir(modulePath);
      const migrationFiles = files.filter(f => this.MIGRATION_PATTERN.test(f));

      if (migrationFiles.length === 0) {
        return '0001';
      }

      // Find the highest migration number
      let maxNumber = 0;
      for (const file of migrationFiles) {
        const match = file.match(this.MIGRATION_PATTERN);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      }

      return String(maxNumber + 1).padStart(4, '0');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return '0001';
      }
      throw new Error(`Failed to get next migration number for ${modulePath}: ${error.message}`);
    }
  }

  static generateModuleId(name: string, existingModules: Array<{ moduleId: string }>): string {
    // Find the next available module number with gapped numbering
    const existingNumbers = existingModules
      .map(m => {
        const match = m.moduleId.match(this.SUBDIR_PATTERN);
        return match ? parseInt(match[1], 10) : -1;
      })
      .filter(n => n >= 0)
      .sort((a, b) => a - b);

    // Use gapped numbering: 000, 010, 020, 030, etc.
    // Find the next number after the highest existing number
    let nextNumber = 0;
    if (existingNumbers.length > 0) {
      const highestNumber = existingNumbers[existingNumbers.length - 1];
      nextNumber = highestNumber + 10;
    }

    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${String(nextNumber).padStart(3, '0')}_${normalizedName}`;
  }

  static parseMigrationFile(
    filename: string,
    basePath?: string,
    moduleId?: string
  ): MigrationFile | null {
    const match = filename.match(this.MIGRATION_PATTERN);
    if (!match) return null;

    const [, number, name, direction] = match;
    const filePath = basePath ? path.join(basePath, filename) : filename;

    return {
      number,
      name,
      direction: direction as 'up' | 'down',
      filename,
      filePath,
      moduleId: moduleId || '',
      content: '',
      checksum: '',
    };
  }

  static matchesMigrationPattern(filename: string, pattern: string): boolean {
    const migration = this.parseMigrationFile(filename);
    if (!migration) return false;

    const normalizedPattern = pattern.trim().toLowerCase().replace(/^0+/, '');
    const normalizedNumber = parseInt(migration.number, 10).toString();

    return (
      filename.toLowerCase() === pattern.toLowerCase() ||
      filename.toLowerCase() === `${pattern.toLowerCase()}.surql` ||
      normalizedPattern === normalizedNumber ||
      normalizedPattern === migration.name.toLowerCase() ||
      normalizedPattern === `${normalizedNumber}_${migration.name.toLowerCase()}` ||
      normalizedPattern === `${migration.number}_${migration.name.toLowerCase()}`
    );
  }

  static filterMigrationFiles(
    files: string[],
    filePattern?: string,
    direction: 'up' | 'down' = 'up'
  ): string[] {
    let filtered = files.filter(f => f.endsWith(`_${direction}.surql`));

    if (filePattern) {
      filtered = filtered.filter(f => this.matchesMigrationPattern(f, filePattern));
    }

    return direction === 'down' ? filtered.reverse() : filtered.sort();
  }

  static processContent(content: string, context: MigrationContext): string {
    const processed = replaceEnvVars(content);
    const statements: string[] = [];

    const hasNamespaceOperation = this.NAMESPACE_OPERATIONS.test(processed);
    const hasDatabaseOperation = this.DATABASE_OPERATIONS.test(processed);
    const hasDDLOperation = this.DDL_OPERATIONS.test(processed);
    const hasBeginTransaction = this.TRANSACTION_BEGIN.test(processed);
    const hasCommitTransaction = this.TRANSACTION_COMMIT.test(processed);

    if (!hasNamespaceOperation && context.defaultNamespace) {
      statements.push(`USE NAMESPACE ${context.defaultNamespace};`);
    }
    if (!hasDatabaseOperation && context.defaultDatabase) {
      statements.push(`USE DATABASE ${context.defaultDatabase};`);
    }

    if (
      hasDDLOperation ||
      !context.useTransactions ||
      hasBeginTransaction ||
      hasCommitTransaction
    ) {
      statements.push(processed);
    } else {
      statements.push('BEGIN TRANSACTION;');
      statements.push(processed);
      statements.push('COMMIT TRANSACTION;');
    }

    return statements.join('\n\n');
  }
}

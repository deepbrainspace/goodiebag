import { Tree } from '@nx/devkit';
import * as path from 'path';

/**
 * Shared utilities for working with NX Tree API across generators
 */
export class TreeUtils {
  
  /**
   * Find a matching subdirectory based on a pattern (number, name, or full identifier)
   * Supports patterns like: "010", "auth", "010_auth", etc.
   */
  static findMatchingSubdirectory(tree: Tree, basePath: string, pattern: string): string | null {
    if (!tree.exists(basePath)) {
      return null;
    }

    const children = tree.children(basePath);
    const directories = children.filter(child => {
      const fullPath = path.join(basePath, child);
      return !tree.isFile(fullPath);
    });

    const normalizedPattern = pattern.toString().trim().toLowerCase();
    const patternAsNumber = parseInt(normalizedPattern, 10);
    const normalizedPatternNumber = isNaN(patternAsNumber) ? null : patternAsNumber.toString();

    const SUBDIR_PATTERN = /^(\d{1,4})_(.+)$/;

    for (const dirName of directories) {
      const normalizedDirName = dirName.toLowerCase();
      const match = normalizedDirName.match(SUBDIR_PATTERN);
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
  }

  /**
   * Get the next migration number for a module using Tree API
   */
  static getNextMigrationNumber(tree: Tree, modulePath: string): string {
    const MIGRATION_PATTERN = /^(\d{4})_(.+)_(up|down)\.surql$/;
    
    if (!tree.exists(modulePath)) {
      return '0001';
    }
    
    const files = tree.children(modulePath);
    const migrationFiles = files.filter(f => MIGRATION_PATTERN.test(f));
    
    if (migrationFiles.length === 0) {
      return '0001';
    }
    
    // Extract numbers and find the highest
    const numbers = migrationFiles
      .map(f => {
        const match = f.match(MIGRATION_PATTERN);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    
    if (numbers.length === 0) {
      return '0001';
    }
    
    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;
    
    return nextNumber.toString().padStart(4, '0');
  }

  /**
   * Get all migration files from a module directory using Tree API
   */
  static getMigrationFiles(tree: Tree, modulePath: string): string[] {
    if (!tree.exists(modulePath)) {
      return [];
    }
    
    return tree.children(modulePath)
      .filter(file => file.endsWith('.surql'))
      .sort();
  }

  /**
   * Check if a path exists and is a directory using Tree API
   */
  static isDirectory(tree: Tree, dirPath: string): boolean {
    return tree.exists(dirPath) && !tree.isFile(dirPath);
  }

  /**
   * Ensure a directory exists in the Tree (creates if needed)
   */
  static ensureDirectory(tree: Tree, dirPath: string): void {
    if (!tree.exists(dirPath)) {
      tree.write(path.join(dirPath, '.gitkeep'), '');
    }
  }

  /**
   * Copy files from source to destination using Tree API
   */
  static copyFiles(tree: Tree, sourcePath: string, destPath: string, fileFilter?: (filename: string) => boolean): void {
    if (!tree.exists(sourcePath)) {
      return;
    }

    const files = tree.children(sourcePath);
    
    for (const file of files) {
      const sourceFilePath = path.join(sourcePath, file);
      
      if (tree.isFile(sourceFilePath)) {
        if (!fileFilter || fileFilter(file)) {
          const content = tree.read(sourceFilePath, 'utf-8');
          tree.write(path.join(destPath, file), content);
        }
      }
    }
  }

  /**
   * Get all subdirectories matching a pattern using Tree API
   */
  static getMatchingDirectories(tree: Tree, basePath: string, pattern: RegExp): string[] {
    if (!tree.exists(basePath)) {
      return [];
    }

    const children = tree.children(basePath);
    return children.filter(child => {
      const fullPath = path.join(basePath, child);
      return !tree.isFile(fullPath) && pattern.test(child);
    });
  }

  /**
   * Read and parse JSON file using Tree API
   */
  static readJsonFile<T = any>(tree: Tree, filePath: string): T | null {
    if (!tree.exists(filePath)) {
      return null;
    }

    try {
      const content = tree.read(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * Write JSON file using Tree API
   */
  static writeJsonFile(tree: Tree, filePath: string, data: any): void {
    tree.write(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Find all module directories in a migrations path
   */
  static findModuleDirectories(tree: Tree, migrationsPath: string): Array<{ name: string; path: string }> {
    const MODULE_PATTERN = /^(\d{1,4})_(.+)$/;
    
    if (!tree.exists(migrationsPath)) {
      return [];
    }

    const children = tree.children(migrationsPath);
    
    return children
      .filter(child => {
        const fullPath = path.join(migrationsPath, child);
        return !tree.isFile(fullPath) && MODULE_PATTERN.test(child);
      })
      .map(child => ({
        name: child,
        path: path.join(migrationsPath, child)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
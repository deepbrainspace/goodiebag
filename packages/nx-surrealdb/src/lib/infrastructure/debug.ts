/**
 * Centralized debug utility for nx-surrealdb-migrations
 * Provides consistent debug logging across all generators and executors
 */

export class Debug {
  private static isEnabled = false;

  /**
   * Enable debug mode
   */
  static enable(): void {
    Debug.isEnabled = true;
  }

  /**
   * Disable debug mode
   */
  static disable(): void {
    Debug.isEnabled = false;
  }

  /**
   * Check if debug mode is enabled
   */
  static get enabled(): boolean {
    return Debug.isEnabled;
  }

  /**
   * Set debug mode based on boolean value
   */
  static setEnabled(enabled: boolean): void {
    Debug.isEnabled = enabled;
  }

  /**
   * Log debug message with 🔍 prefix
   */
  static log(message: string, ...args: unknown[]): void {
    if (Debug.isEnabled) {
      console.log(`🔍 DEBUG: ${message}`, ...args);
    }
  }

  /**
   * Log debug error with ❌ prefix
   */
  static error(message: string, error?: unknown): void {
    if (Debug.isEnabled) {
      console.error(`🔍 DEBUG ERROR: ${message}`, error);
    }
  }

  /**
   * Log debug warning with ⚠️ prefix
   */
  static warn(message: string, ...args: unknown[]): void {
    if (Debug.isEnabled) {
      console.warn(`🔍 DEBUG WARNING: ${message}`, ...args);
    }
  }

  /**
   * Log debug info with ℹ️ prefix
   */
  static info(message: string, ...args: unknown[]): void {
    if (Debug.isEnabled) {
      console.info(`🔍 DEBUG INFO: ${message}`, ...args);
    }
  }

  /**
   * Log debug object/data with proper formatting
   */
  static data(label: string, data: unknown): void {
    if (Debug.isEnabled) {
      console.log(`🔍 DEBUG DATA [${label}]:`, JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log debug table for array data
   */
  static table(label: string, data: unknown[]): void {
    if (Debug.isEnabled) {
      console.log(`🔍 DEBUG TABLE [${label}]:`);
      console.table(data);
    }
  }

  /**
   * Time a function execution
   */
  static time<T>(label: string, fn: () => T): T;
  static time<T>(label: string, fn: () => Promise<T>): Promise<T>;
  static time<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    if (!Debug.isEnabled) {
      return fn();
    }

    const start = Date.now();
    console.log(`🔍 DEBUG TIMER: Starting ${label}`);

    const result = fn();

    if (result instanceof Promise) {
      return result
        .then(value => {
          const duration = Date.now() - start;
          console.log(`🔍 DEBUG TIMER: ${label} completed in ${duration}ms`);
          return value;
        })
        .catch(error => {
          const duration = Date.now() - start;
          console.log(`🔍 DEBUG TIMER: ${label} failed after ${duration}ms`);
          throw error;
        });
    } else {
      const duration = Date.now() - start;
      console.log(`🔍 DEBUG TIMER: ${label} completed in ${duration}ms`);
      return result;
    }
  }

  /**
   * Create a scoped debug instance for a specific module
   */
  static scope(moduleName: string) {
    return {
      log: (message: string, ...args: unknown[]) =>
        Debug.log(`[${moduleName}] ${message}`, ...args),
      error: (message: string, error?: unknown) => Debug.error(`[${moduleName}] ${message}`, error),
      warn: (message: string, ...args: unknown[]) =>
        Debug.warn(`[${moduleName}] ${message}`, ...args),
      info: (message: string, ...args: unknown[]) =>
        Debug.info(`[${moduleName}] ${message}`, ...args),
      data: (label: string, data: unknown) => Debug.data(`${moduleName}:${label}`, data),
      table: (label: string, data: unknown[]) => Debug.table(`${moduleName}:${label}`, data),
      time: <T>(label: string, fn: () => T | Promise<T>) =>
        Debug.time(`${moduleName}:${label}`, fn),
    };
  }
}

import { MigrationsConfig } from '../configuration/config-loader';

export interface ModuleLockValidation {
  isLocked: boolean;
  reason?: string;
  lockIcon: string;
}

export class ModuleLockManager {
  constructor(private config: MigrationsConfig | null) {}

  isModuleLocked(moduleId: string): boolean {
    if (!this.config?.modules[moduleId]) {
      return false;
    }
    return this.config.modules[moduleId].locked === true;
  }

  getModuleLockReason(moduleId: string): string | undefined {
    if (!this.config?.modules[moduleId]) {
      return undefined;
    }
    return this.config.modules[moduleId].lockReason;
  }

  validateModuleLock(moduleId: string): ModuleLockValidation {
    const isLocked = this.isModuleLocked(moduleId);
    const reason = this.getModuleLockReason(moduleId);

    return {
      isLocked,
      reason,
      lockIcon: isLocked ? '🔒' : '',
    };
  }

  validateRollbackLock(moduleIds: string[]): {
    blockedModules: string[];
    lockReasons: Record<string, string>;
  } {
    const blockedModules: string[] = [];
    const lockReasons: Record<string, string> = {};

    for (const moduleId of moduleIds) {
      if (this.isModuleLocked(moduleId)) {
        blockedModules.push(moduleId);
        const reason = this.getModuleLockReason(moduleId);
        lockReasons[moduleId] = reason || 'Module is locked for safety';
      }
    }

    return { blockedModules, lockReasons };
  }

  getLockedModules(): string[] {
    if (!this.config) return [];

    return Object.entries(this.config.modules)
      .filter(([_, config]) => config.locked === true)
      .map(([moduleId, _]) => moduleId);
  }

  validateMigrationLock(moduleIds: string[]): {
    canMigrate: boolean;
    blockedModules: string[];
    lockReasons: Record<string, string>;
  } {
    const blockedModules: string[] = [];
    const lockReasons: Record<string, string> = {};

    for (const moduleId of moduleIds) {
      if (this.isModuleLocked(moduleId)) {
        blockedModules.push(moduleId);
        const reason = this.getModuleLockReason(moduleId);
        lockReasons[moduleId] = reason || 'Module is locked for safety';
      }
    }

    return {
      canMigrate: blockedModules.length === 0,
      blockedModules,
      lockReasons,
    };
  }

  static createLockManager(config: MigrationsConfig | null): ModuleLockManager {
    return new ModuleLockManager(config);
  }
}

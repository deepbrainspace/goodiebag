import * as dotenv from 'dotenv';
import * as path from 'path';
import { ExecutorContext } from '@nx/devkit';

export function loadEnvFile(context: ExecutorContext, envFile?: string): void {
  const envPath = path.join(context.root, envFile || '.env');
  dotenv.config({ path: envPath });
}

export function replaceEnvVars(content: string): string {
  return content.replace(/\${([^}]+)}/g, (match, key) => {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  });
}
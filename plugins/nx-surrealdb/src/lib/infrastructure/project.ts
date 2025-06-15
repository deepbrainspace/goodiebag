import * as path from 'path';
import { ExecutorContext } from '@nx/devkit';

export function getProjectRoot(context: ExecutorContext): string {
  const projectRoot = context.projectGraph?.nodes[context.projectName]?.data.root;
  if (!projectRoot) {
    throw new Error(`Project ${context.projectName} not found in project graph`);
  }
  return projectRoot;
}

export function resolveProjectPath(context: ExecutorContext, relativePath?: string): string {
  const basePath = context.root; // Use workspace root
  const resolved = relativePath ? path.join(basePath, relativePath) : basePath;
  return resolved;
}
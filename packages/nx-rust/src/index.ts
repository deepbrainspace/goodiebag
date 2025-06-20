import { NxPlugin } from '@nx/devkit';
import { createDependencies, createNodes, createNodesV2 } from './graph';

const nxPlugin: NxPlugin = {
  name: '@goodiebag/nx-rust',
  createDependencies,
  createNodes,
  createNodesV2,
};

// Default export for NX plugin
export default nxPlugin;

// Export release functionality for NX Release system
export * from './release';

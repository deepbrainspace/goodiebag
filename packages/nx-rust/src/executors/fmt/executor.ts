import { ExecutorContext, workspaceRoot } from '@nx/devkit';
import { join } from 'path';
import { buildCommand } from '../../utils/build-command';
import { cargoCommand } from '../../utils/cargo';
import { FmtExecutorSchema } from './schema';

export default async function* runExecutor(options: FmtExecutorSchema, context: ExecutorContext) {
  const command = buildCommand('fmt', options, context);

  // Get the project root directory
  const projectRoot = join(
    workspaceRoot,
    context.projectsConfigurations.projects[context.projectName].root
  );

  // Debug output if verbose is enabled
  const isVerbose = process.env.NX_VERBOSE_LOGGING === 'true' || process.argv.includes('--verbose');
  if (isVerbose) {
    console.log(`[DEBUG] Project root: ${projectRoot}`);
    console.log(`[DEBUG] Command: ${command.join(' ')}`);
  }

  const { success } = await cargoCommand(projectRoot, ...command);
  yield {
    success,
  };
}

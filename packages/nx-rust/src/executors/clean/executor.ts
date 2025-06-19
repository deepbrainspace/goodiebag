import { ExecutorContext, workspaceRoot } from '@nx/devkit';
import { join } from 'path';
import { buildCommand } from '../../utils/build-command';
import { cargoCommand } from '../../utils/cargo';
import { CleanExecutorSchema } from './schema';

export default async function* runExecutor(options: CleanExecutorSchema, context: ExecutorContext) {
  const command = buildCommand('clean', options, context);

  // Get the project root directory
  const projectRoot = join(
    workspaceRoot,
    context.projectsConfigurations.projects[context.projectName].root
  );

  const { success } = await cargoCommand(projectRoot, ...command);
  yield {
    success,
  };
}

import { ExecutorContext } from '@nx/devkit';
import { buildCommand } from '../../utils/build-command';
import { cargoCommand } from '../../utils/cargo';
import { CleanExecutorSchema } from './schema';

export default async function* runExecutor(options: CleanExecutorSchema, context: ExecutorContext) {
  const command = buildCommand('clean', options, context);

  const { success } = await cargoCommand(...command);
  yield {
    success,
  };
}

import { ExecutorContext } from '@nx/devkit';
import { buildCommand } from '../../utils/build-command';
import { cargoCommand } from '../../utils/cargo';
import { FmtExecutorSchema } from './schema';

export default async function* runExecutor(options: FmtExecutorSchema, context: ExecutorContext) {
  const command = buildCommand('fmt', options, context);

  const { success } = await cargoCommand(...command);
  yield {
    success,
  };
}

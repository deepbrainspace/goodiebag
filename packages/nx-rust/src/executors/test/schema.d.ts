import { BaseOptions } from '../../models/base-options';

export interface TestExecutorSchema extends BaseOptions {
  'no-run'?: boolean;
  'no-fail-fast'?: boolean;
}

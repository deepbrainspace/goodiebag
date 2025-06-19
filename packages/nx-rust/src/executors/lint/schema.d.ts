import { BaseOptions } from '../../models/base-options';

export interface LintExecutorSchema extends BaseOptions {
  fix?: boolean;
}

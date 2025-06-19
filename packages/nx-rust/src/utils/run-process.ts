import { execSync } from 'child_process';
import { cargoMetadata } from './cargo';

interface RunProcessOptions {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

function runProcessImpl(
  processCmd: string,
  ...argsOrOptions: (string | string[] | RunProcessOptions)[]
): { success: boolean } | PromiseLike<{ success: boolean }> {
  let args: string[];
  let env = process.env;
  let cwd = process.cwd();

  // Check if last argument is options object
  if (
    argsOrOptions.length > 0 &&
    typeof argsOrOptions[argsOrOptions.length - 1] === 'object' &&
    !Array.isArray(argsOrOptions[argsOrOptions.length - 1])
  ) {
    const options = argsOrOptions.pop() as RunProcessOptions;
    if (options.env) env = options.env;
    if (options.cwd) cwd = options.cwd;
    args = argsOrOptions.flat() as string[];
  } else {
    args = argsOrOptions.flat() as string[];
  }

  // Get cargo metadata from the working directory
  let metadata = null;
  try {
    metadata = cargoMetadata(cwd);
  } catch {
    // If metadata fails, we'll use fallback
  }

  // Use metadata target directory, or fall back to 'target' in current directory
  const defaultTargetDir = metadata?.target_directory ?? 'target';

  return new Promise(resolve => {
    if (process.env.VERCEL) {
      // Vercel doesnt have support for cargo atm, so auto success builds
      return resolve({ success: true });
    }

    execSync(processCmd + ' ' + args.join(' '), {
      cwd,
      env: {
        ...env,
        RUSTC_WRAPPER: '',
        CARGO_TARGET_DIR: env.CARGO_TARGET_DIR || defaultTargetDir,
        CARGO_BUILD_TARGET_DIR: env.CARGO_TARGET_DIR || defaultTargetDir,
      },
      windowsHide: true,
      stdio: ['inherit', 'inherit', 'inherit'],
    });
    resolve({ success: true });
  });
}

export function runProcess(
  processCmd: string,
  ...argsOrOptions: (string | string[] | RunProcessOptions)[]
): { success: boolean } | PromiseLike<{ success: boolean }> {
  return runProcessImpl(processCmd, ...argsOrOptions);
}

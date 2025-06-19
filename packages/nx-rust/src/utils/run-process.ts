import { execSync } from 'child_process';
import { cargoMetadata } from './cargo';

interface RunProcessOptions {
  env?: NodeJS.ProcessEnv;
}

function runProcessImpl(
  processCmd: string,
  ...argsOrOptions: (string | string[] | RunProcessOptions)[]
): { success: boolean } | PromiseLike<{ success: boolean }> {
  let args: string[];
  let env = process.env;

  // Check if last argument is options object
  if (
    argsOrOptions.length > 0 &&
    typeof argsOrOptions[argsOrOptions.length - 1] === 'object' &&
    !Array.isArray(argsOrOptions[argsOrOptions.length - 1]) &&
    (argsOrOptions[argsOrOptions.length - 1] as RunProcessOptions).env
  ) {
    const options = argsOrOptions.pop() as RunProcessOptions;
    env = options.env;
    args = argsOrOptions.flat() as string[];
  } else {
    args = argsOrOptions.flat() as string[];
  }

  const metadata = cargoMetadata();
  // Use metadata target directory, or fall back to 'target' in current directory
  const defaultTargetDir = metadata?.target_directory ?? 'target';

  return new Promise(resolve => {
    if (process.env.VERCEL) {
      // Vercel doesnt have support for cargo atm, so auto success builds
      return resolve({ success: true });
    }

    execSync(processCmd + ' ' + args.join(' '), {
      cwd: process.cwd(),
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

import * as pc from 'picocolors';
import { relative } from 'path';
import { ChildProcess, execSync, spawn, StdioOptions } from 'child_process';
import { runProcess } from './run-process';
import { CargoMetadata, Dependency, Package } from '../models/cargo-metadata';

interface CargoRun {
  success: boolean;
  output: string;
}

interface RunCargoOptions {
  stdio: StdioOptions;
  env: NodeJS.ProcessEnv | undefined;
}

export let childProcess: ChildProcess | null;

export async function cargoCommand(
  ...allArgs: (string | undefined)[]
): Promise<{ success: boolean }> {
  let cwd: string | undefined;
  let args: string[];

  // Check if first argument is a directory path (contains path separators)
  if (
    allArgs.length > 0 &&
    typeof allArgs[0] === 'string' &&
    (allArgs[0].includes('/') || allArgs[0].includes('\\'))
  ) {
    cwd = allArgs[0];
    args = allArgs.slice(1) as string[];
  } else {
    args = allArgs as string[];
  }

  // Extract target-dir from args and set as environment variable
  const targetDirIndex = args.findIndex(arg => arg === '--target-dir');
  let env = process.env;

  if (targetDirIndex !== -1 && targetDirIndex + 1 < args.length) {
    const targetDir = args[targetDirIndex + 1];
    env = { ...process.env, CARGO_TARGET_DIR: targetDir };
    // Remove --target-dir and its value from args
    args.splice(targetDirIndex, 2);
  }

  // Debug output if verbose is enabled
  const isVerbose = process.env.NX_VERBOSE_LOGGING === 'true' || process.argv.includes('--verbose');
  if (isVerbose) {
    console.log(pc.dim(`[DEBUG cargoCommand] cwd: ${cwd || 'undefined'}`));
    console.log(pc.dim(`> cargo ${args.join(' ')}`));
  }

  return runProcess('cargo', ...['--color', 'always', ...args], { env, cwd });
}

export function cargoRunCommand(...args: string[]): Promise<{ success: boolean }> {
  console.log(pc.dim(`> cargo ${args.join(' ')}`));
  return new Promise((resolve, reject) => {
    childProcess = spawn('cargo', ['--color', 'always', ...args], {
      cwd: process.cwd(),
      windowsHide: true,
      detached: false,
      shell: false,
      stdio: ['inherit', 'inherit', 'inherit'],
    });

    // Ensure the child process is killed when the parent exits
    process.on('exit', () => childProcess?.kill());
    process.on('SIGTERM', () => childProcess?.kill());
    process.on('SIGINT', () => childProcess?.kill());

    childProcess.on('error', error => {
      console.error(`[nx-rust] Cargo process error: ${error.message}`);
      reject({ success: false, error: error.message });
    });

    childProcess.on('exit', code => {
      childProcess = null;
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject({ success: false });
      }
    });
  });
}

export function cargoCommandSync(
  args = '',
  options?: Partial<RunCargoOptions & { cwd?: string }>
): CargoRun {
  const normalizedOptions: RunCargoOptions = {
    stdio: options?.stdio ?? 'inherit',
    env: {
      ...process.env,
      ...options?.env,
    },
  };

  try {
    return {
      output: execSync(`cargo ${args}`, {
        encoding: 'utf8',
        windowsHide: true,
        stdio: normalizedOptions.stdio,
        env: normalizedOptions.env,
        cwd: options?.cwd,
        maxBuffer: 1024 * 1024 * 10,
      }),
      success: true,
    };
  } catch (e) {
    return {
      output: e as string,
      success: false,
    };
  }
}

export function cargoMetadata(cwd?: string): CargoMetadata | null {
  const output = cargoCommandSync('metadata --format-version=1', {
    stdio: 'pipe',
    cwd,
  });

  if (!output.success) {
    return null;
  }

  return JSON.parse(output.output) as CargoMetadata;
}

export function isExternal(packageOrDep: Package | Dependency, workspaceRoot: string) {
  const isRegistry = packageOrDep.source?.startsWith('registry+') ?? false;
  const isGit = packageOrDep.source?.startsWith('git+') ?? false;
  const isOutsideWorkspace =
    'path' in packageOrDep && relative(workspaceRoot, packageOrDep.path).startsWith('..');

  return isRegistry || isGit || isOutsideWorkspace;
}

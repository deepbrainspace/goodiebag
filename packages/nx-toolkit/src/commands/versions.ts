import { logger } from '@nx/devkit';
import { execSync } from 'child_process';
import { CommandModule } from 'yargs';

interface VersionsOptions {
  verbose?: boolean;
}

async function versionsHandler(options: VersionsOptions) {
  const { verbose = false } = options;

  try {
    logger.info('📦 Current Package Versions:');
    logger.info('==========================');

    // Run nx release dry-run to get version information
    const output = execSync('nx release --dry-run --verbose', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Parse the output to extract project names and versions
    const lines = output.split('\n');
    const versions: { [project: string]: string } = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for project lines
      const projectMatch = line.match(/Running release version for project: (.+)/);
      if (projectMatch) {
        const project = projectMatch[1];
        
        // Look ahead for version information
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          
          // Check for resolved version from git tag
          const gitVersionMatch = nextLine.match(/Resolved the current version as ([0-9.]+) from git tag/);
          if (gitVersionMatch) {
            versions[project] = gitVersionMatch[1];
            break;
          }
          
          // Check for fallback version from manifest
          const manifestVersionMatch = nextLine.match(/Falling back to the version ([0-9.]+) in manifest/);
          if (manifestVersionMatch) {
            versions[project] = manifestVersionMatch[1];
            break;
          }
        }
      }
    }

    // Display the versions in a clean format
    const maxProjectLength = Math.max(...Object.keys(versions).map(p => p.length));
    
    for (const [project, version] of Object.entries(versions)) {
      logger.info(`${project.padEnd(maxProjectLength + 2)} ${version}`);
    }

    if (verbose) {
      logger.info('');
      logger.info('💡 Run "nx release --dry-run --verbose" to see full details');
    }

  } catch (error) {
    logger.error('❌ Failed to get version information:');
    logger.error((error as Error).message);
    process.exit(1);
  }
}

export const versionsCommand: CommandModule<{}, VersionsOptions> = {
  command: 'versions',
  describe: 'Display current versions of all packages in the workspace',
  builder: (yargs) => {
    return yargs.option('verbose', {
      type: 'boolean',
      description: 'Show additional information and help text',
      default: false
    });
  },
  handler: versionsHandler
};

export default versionsCommand;
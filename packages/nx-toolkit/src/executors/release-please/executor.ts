import { ExecutorContext, PromiseExecutor, logger } from '@nx/devkit';
import { execSync } from 'child_process';
import { ReleaseExecutorSchema } from './schema.d';

const runExecutor: PromiseExecutor<ReleaseExecutorSchema> = async (
  options,
  context: ExecutorContext
) => {
  const projectName = context.projectName;

  if (!projectName) {
    logger.error('No project name found in context');
    return { success: false };
  }

  const {
    specifier = 'minor',
    dryRun = false,
    verbose = false,
    skipPr = false,
    createReleaseBranch = true,
    baseBranch = 'main',
    firstRelease = false,
    skipPublish = false,
    affected = false,
    ensureCleanBase = true,
    yes = false,
    groups,
    projects,
    preid,
  } = options;

  try {
    const logPrefix = dryRun ? '[DRY RUN] ' : '';

    // Step 0: Ensure we start from clean base branch
    if (ensureCleanBase) {
      logger.info(`${logPrefix}🔄 Ensuring clean base branch (${baseBranch})...`);

      try {
        // Check current branch
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
          encoding: 'utf8',
        }).trim();

        if (currentBranch !== baseBranch) {
          logger.info(`${logPrefix}Switching from ${currentBranch} to ${baseBranch}`);
          if (!dryRun) {
            execSync(`git checkout ${baseBranch}`, { stdio: 'inherit' });
          }
        }

        // Pull latest changes
        logger.info(`${logPrefix}Pulling latest changes from origin/${baseBranch}`);
        if (!dryRun) {
          execSync(`git pull origin ${baseBranch}`, { stdio: 'inherit' });
        } else {
          logger.info(`${logPrefix}Would run: git pull origin ${baseBranch}`);
        }

        if (verbose) {
          const latestCommit = !dryRun
            ? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
            : 'HEAD';
          logger.info(`${logPrefix}Starting from commit: ${latestCommit}`);
        }
      } catch (error) {
        logger.error(`Failed to ensure clean base branch: ${(error as Error).message}`);
        return { success: false };
      }
    }

    logger.info(
      `${logPrefix}🚀 Starting release workflow for ${
        projectName || 'affected projects'
      } (${specifier})`
    );

    // Step 1: Create and push release branch
    if (createReleaseBranch) {
      logger.info(`${logPrefix}📦 Creating release branch...`);

      // Determine branch name based on what's being released
      let releaseBranchName;
      if (groups && groups.length > 0) {
        releaseBranchName =
          groups.length === 1 ? `release/group-${groups[0]}` : `release/groups-${Date.now()}`;
      } else if (projects && projects.length > 0) {
        releaseBranchName =
          projects.length === 1 ? `release/${projects[0]}` : `release/projects-${Date.now()}`;
      } else if (projectName) {
        releaseBranchName = `release/${projectName}`;
      } else {
        releaseBranchName = `release/affected-${Date.now()}`;
      }

      if (verbose) {
        logger.info(`Creating branch: ${releaseBranchName}`);
      }

      if (!dryRun) {
        execSync(`git checkout -b ${releaseBranchName}`, { stdio: 'inherit' });
        execSync(`git push --set-upstream origin ${releaseBranchName}`, { stdio: 'inherit' });
      } else {
        logger.info(`Would create and push branch: ${releaseBranchName}`);
      }
    }

    // Step 2: Run NX release
    logger.info(`${logPrefix}🔖 Running NX release...`);

    let releaseCommand;

    if (affected) {
      // For affected mode, we run the built-in nx release with affected projects
      logger.info(`${logPrefix}🔍 Using NX affected to find and release projects...`);
      releaseCommand = [
        'release',
        specifier,
        // Note: nx release doesn't support --affected flag directly, so we need to determine affected projects first
        dryRun ? '--dry-run' : '',
        verbose ? '--verbose' : '',
        firstRelease ? '--first-release' : '',
        skipPublish ? '--skip-publish' : '',
        yes ? '--yes' : '',
      ].filter(Boolean);

      // TODO: We need to get affected projects first and pass them to --projects
      logger.warn(
        'Note: nx release does not natively support --affected. Consider using specific project names.'
      );
    } else {
      // Standard release with specific project or groups
      const projectsToUse = projects || (projectName ? [projectName] : []);
      const groupsToUse = groups || [];

      releaseCommand = [
        'release',
        specifier,
        projectsToUse.length > 0 ? `--projects=${projectsToUse.join(',')}` : '',
        groupsToUse.length > 0 ? `--groups=${groupsToUse.join(',')}` : '',
        dryRun ? '--dry-run' : '',
        verbose ? '--verbose' : '',
        firstRelease ? '--first-release' : '',
        skipPublish ? '--skip-publish' : '',
        yes ? '--yes' : '',
        preid ? `--preid=${preid}` : '',
      ].filter(Boolean);
    }

    if (verbose) {
      logger.info(`Running: nx ${releaseCommand.join(' ')}`);
    }

    if (!dryRun) {
      execSync(`nx ${releaseCommand.join(' ')}`, { stdio: 'inherit' });
    } else {
      logger.info(`Would run: nx ${releaseCommand.join(' ')}`);
    }

    // Step 3: The nx release command will handle git operations automatically
    // When using release branches, we'll push the branch manually in step 4

    // Step 4: Create PR
    if (!skipPr && createReleaseBranch && !dryRun) {
      logger.info(`${logPrefix}🔀 Creating PR...`);

      const releaseBranchName = projectName
        ? `release/${projectName}`
        : `release/affected-${Date.now()}`;

      const prTitle = projectName ? `release: ${projectName}` : 'release: affected projects';
      const prArgs = [
        'pr',
        'create',
        `--title="${prTitle}"`,
        `--base=${baseBranch}`,
        `--head=${releaseBranchName}`,
        '--body="Automated release created by release-please"',
      ];

      if (verbose) {
        logger.info(`Running: gh ${prArgs.join(' ')}`);
      }

      try {
        execSync(`gh ${prArgs.join(' ')}`, { stdio: 'inherit' });
        logger.info('✅ PR created successfully!');
      } catch {
        logger.warn(
          '⚠️ Failed to create PR. You may need to install GitHub CLI or check authentication.'
        );
        logger.info(`Manual PR creation: Create PR from release/${projectName} to ${baseBranch}`);
      }
    } else if (dryRun && !skipPr && createReleaseBranch) {
      logger.info(`${logPrefix}Would create PR: release/${projectName} → ${baseBranch}`);
    }

    if (dryRun) {
      logger.warn('NOTE: The "dry-run" flag means no changes were made.');
    } else {
      logger.info('✅ Release workflow completed successfully!');
    }

    return { success: true };
  } catch (error) {
    logger.error('❌ Release workflow failed:');
    logger.error((error as Error).message);
    return { success: false };
  }
};

export default runExecutor;

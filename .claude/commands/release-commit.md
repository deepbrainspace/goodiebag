# Release Commit Command

Create a changelog-rc.md for affected packages and the root project, then commit changes for release preparation.

## Steps:

1. **Detect affected components**:
   - Run `nx show projects --affected` to find changed packages with publish targets
   - Check for root project changes (CI/CD, docs, nx config, release process)
   - Focus on packages in `packages/` directory and root project changes

2. **For the root project (goodiebag)**:
   - Detect changes to infrastructure files:
     - `.github/workflows/*` (CI/CD updates)
     - `docs/*`, `README.md` (documentation)
     - `nx.json`, `package.json`, `tsconfig.json` (build config)
     - `.claude/commands/*` (release process)
     - Root-level scripts, tools, configuration
   - Generate version format: `1.y.z-rc.{timestamp}` (use current Unix timestamp)
   - Create `changelog-rc.md` in root directory with tag pattern: `goodiebag-v{version}`

3. **For each affected package**:
   - Analyze git commits since last release tag using conventional commits
   - Calculate next version (patch/minor/major) based on:
     - `fix:` → patch increment
     - `feat:` → minor increment  
     - `feat!:` or `BREAKING CHANGE:` → major increment
   - Generate version format: `x.y.z-rc.{timestamp}` (use current Unix timestamp)

3. **Generate changelog-rc.md**:
   - Create `packages/{package-name}/changelog-rc.md`
   - Include:
     - Version: `x.y.z-rc.{timestamp}`
     - Release date placeholder
     - Categorized changes (Features, Bug Fixes, Breaking Changes)
     - Commit references with short hashes
   - Use clear, professional formatting

4. **Git operations**:
   - Run `git add -A`
   - Ensure no secrets are exposed (check git-crypt status if applicable)
   - Create commit message: `chore: prepare release candidates for {package-list}`
   - Push to remote branch

## Example changelog-rc.md formats:

**For packages:**
```markdown
# @deepbrainspace/package-name v1.2.3-rc.1703123456

## Features
- Add new migration feature ([abc1234](commit-url))
- Improve error handling ([def5678](commit-url))

## Bug Fixes
- Fix connection timeout issue ([ghi9012](commit-url))
```

**For root project:**
```markdown
# goodiebag v1.1.0-rc.1703123456

## Infrastructure
- Update CI/CD pipeline with parallel builds ([abc1234](commit-url))
- Add Claude command-based release system ([def5678](commit-url))

## Documentation
- Update RELEASE-PROCESS.md with new workflow ([ghi9012](commit-url))

## Configuration
- Add root project to nx release configuration ([jkl3456](commit-url))
```

**Note**: Only process packages and root project that have actual changes.
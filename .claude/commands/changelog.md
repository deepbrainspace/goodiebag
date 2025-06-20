# Changelog Command

Generate changelog-rc.md files for affected packages and root project without committing.

## Steps:

1. **Detect affected components**:
   - Run `nx show projects --affected` to find changed packages
   - Check for root project (goodiebag) infrastructure changes
   - Focus on packages with publish targets in `packages/` directory

2. **For the root project (goodiebag)**:
   - Check for changes to CI/CD, docs, nx config, release process files
   - Generate RC version: `1.y.z-rc.{timestamp}` with tag pattern `goodiebag-v{version}`
   - Create `changelog-rc.md` in root directory

3. **For each affected package**:
   - Analyze conventional commits since last release tag
   - Calculate semantic version increment:
     - `fix:`, `chore:`, `docs:` → patch
     - `feat:` → minor
     - `feat!:`, `BREAKING CHANGE:` → major
   - Generate RC version: `x.y.z-rc.{timestamp}`

4. **Create changelog-rc.md files**:
   - Path: `packages/{package-name}/changelog-rc.md` (for packages)
   - Path: `changelog-rc.md` (for root project)
   - Professional changelog format with categorized changes
   - Include commit hashes and descriptions
   - Add version and date information

5. **Output summary**:
   - List packages and root project processed
   - Show generated versions (including goodiebag-v{version})
   - Indicate files created

**Use this command when**:
- You want to preview changelog before committing
- Working on multiple changes across commits
- Need to review version calculations

**Follow up with**: `claude release-commit` to commit the generated changelogs.
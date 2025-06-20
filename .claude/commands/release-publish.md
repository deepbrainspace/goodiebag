# Release Publish Command

Publish packages that have changelog-rc.md files to npm and create GitHub releases. Also handle root project releases.

## Steps:

1. **Detect components ready for release**:
   - Find all `packages/*/changelog-rc.md` files
   - Check for root `changelog-rc.md` file (goodiebag project)
   - List packages and root project that will be released

2. **For root project (goodiebag) with changelog-rc.md**:

   **a. Process changelog**:
   - Read `changelog-rc.md` to extract RC version
   - Strip `-rc.{timestamp}` to get final version (e.g., `1.1.0-rc.1703123456` → `1.1.0`)
   - Merge content into main `CHANGELOG.md` (create if doesn't exist)
   - Update root `package.json` version field

   **b. Git operations**:
   - Create release commit: `chore(release): goodiebag@{version} [skip-changelog]`
   - Create git tag: `goodiebag-v{version}`
   - Create GitHub release (no npm publish since root is private)

   **c. Cleanup**:
   - Delete root `changelog-rc.md` file

3. **For each package with changelog-rc.md**:

   **a. Process changelog**:
   - Read `changelog-rc.md` to extract RC version
   - Strip `-rc.{timestamp}` to get final version (e.g., `1.2.3-rc.1703123456` → `1.2.3`)
   - Merge content into main `CHANGELOG.md` (create if doesn't exist)
   - Update `package.json` version field

   **b. Build and publish**:
   - Ensure package is built: `nx build {package-name}`
   - Publish to npm: `pnpm publish --access public` (from package directory)
   - Verify publication successful

   **c. Git operations**:
   - Create release commit: `chore(release): {package-name}@{version} [skip-changelog]`
   - Create git tag: `{package-name}-v{version}`
   - Create GitHub release using `gh release create`

   **d. Cleanup**:
   - Delete `changelog-rc.md` file
   - Add deletion to git staging

3. **Finalize**:
   - Commit all changes (version updates, changelog merges, RC file deletions)
   - Push commits and tags: `git push --follow-tags`
   - Display summary of published packages

## Safety checks:

- Verify npm authentication: `pnpm whoami`
- Check build artifacts exist before publishing
- Confirm package.json version matches changelog version
- Validate no uncommitted changes before starting

**Use this command after**:
- PR with changelog-rc.md files has been merged to main
- All CI checks have passed
- You're ready to release to production

**Example output**:
```
✅ Released goodiebag@1.1.0
✅ Created tag: goodiebag-v1.1.0
✅ GitHub release: https://github.com/org/repo/releases/tag/goodiebag-v1.1.0

✅ Published @deepbrainspace/nx-surrealdb@0.2.1
✅ Created tag: nx-surrealdb-v0.2.1  
✅ GitHub release: https://github.com/org/repo/releases/tag/nx-surrealdb-v0.2.1
```
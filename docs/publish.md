# Publishing Packages

This document outlines the manual release process for packages in the goodiebag monorepo.

## Release Process

### Step 1: Create Release Branch
```bash
git checkout -b release/<package-name>
git push --set-upstream origin release/<package-name>
```

### Step 2: Test the Release (Dry Run)
```bash
nx release --dry-run --yes --projects=<package-name>
```

This will show you exactly what changes will be made without actually applying them. Review the output carefully to ensure:
- Version bump is correct
- Changelog entries are accurate
- No unexpected changes

### Step 3: Build, Execute the Release
If the dry run looks good, run the actual release:
```bash
nx release --projects=nx-rust  --yes
nx build <package-name>
nx release publish --projects=<package-name>

```

This will:
- Update version numbers
- Generate/update changelog
- Create git commits and tags
- Publish to npm registry

### Step 4: Push Release Branch
```bash
git push origin release/<package-name>
```

### Step 5: Create Pull Request
```bash
gh pr create --title "release: <package-name>" --body "Release changes for <package-name>"
```

### Step 6: Merge to Main
Once the PR is reviewed and approved, merge it to integrate the release changes back into the main branch.

## Example: Releasing goodiebag

```bash
# 1. Create release branch
git checkout -b release/goodiebag

# 2. Test release
nx release --dry-run --yes --projects=goodiebag

# 3. Execute release (if dry run looks good)
nx release --yes --projects=goodiebag

# 4. Push release branch
git push origin release/goodiebag

# 5. Create PR
gh pr create --title "release: goodiebag" --body "Release changes for goodiebag"

# 6. Merge PR through GitHub interface
```

## Notes

- Always run the dry run first to verify changes
- The `--yes` flag skips confirmation prompts
- Each package should be released on its own branch
- Release branches should be merged back to main to keep release commits in history
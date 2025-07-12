# Feature Development Workflow

Complete workflow for developing new features in this NX monorepo with proper
testing, documentation, and release procedures.

## Feature Development Lifecycle

### 1. Planning Phase

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feat/feature-name

# Plan the feature
# - Define requirements
# - Identify affected packages
# - Plan testing strategy
# - Consider breaking changes
```

### 2. Development Setup

```bash
# Install dependencies
pnpm install

# Run affected tests to ensure clean start
nx affected --target=test --base=main

# Start development server if needed
nx serve app-name
```

### 3. Implementation Phase

#### Core Development

```bash
# Make incremental changes
# - Write failing tests first (TDD)
# - Implement feature code
# - Ensure tests pass
# - Refactor as needed

# Check affected packages during development
nx affected:graph --base=main
```

#### Testing Strategy

```bash
# Unit tests - test individual functions/classes
nx test package-name --testNamePattern="FeatureName"

# Integration tests - test feature interactions
nx test package-name --testPathPattern="integration"

# E2E tests - test complete user workflows
nx e2e app-name --spec="feature-name.cy.ts"
```

#### Code Quality Checks

```bash
# Lint affected code
nx affected --target=lint --base=main

# Type check
nx affected --target=build --base=main

# Format code
nx format:write --uncommitted
```

### 4. Documentation Phase

#### Update Documentation

```bash
# Update package README if public API changed
# Update CHANGELOG.md with feature description
# Add JSDoc comments for new public functions
# Update integration guides if needed
```

#### API Documentation

```bash
# Generate API docs if applicable
nx run package-name:docs

# Update examples in documentation
# Add migration guides for breaking changes
```

### 5. Pre-Commit Validation

#### Automated Checks

```bash
# Run complete validation pipeline
nx affected --target=lint --base=main
nx affected --target=test --base=main
nx affected --target=build --base=main

# Ensure no linting issues
nx affected --target=lint --base=main --fix=false

# Check test coverage
nx affected --target=test --base=main --coverage
```

#### Manual Review

```bash
# Review changes
git diff main...HEAD

# Check affected packages
nx affected:libs --base=main
nx affected:apps --base=main

# Verify no unintended changes
git status
```

### 6. Commit Strategy

#### Conventional Commits

```bash
# Feature commit (minor version bump)
git commit -m "feat(package-name): add new feature description

- Detailed description of what was added
- Any important implementation notes
- References to issues: closes #123"

# Feature with breaking change (major version bump)
git commit -m "feat(package-name): redesign API for better usability

BREAKING CHANGE: Method signatures have changed, see migration guide"

# Bug fix during development (patch version bump)
git commit -m "fix(package-name): resolve edge case in feature implementation"
```

#### Commit Best Practices

```bash
# Make atomic commits
git add specific-files
git commit -m "feat(scope): specific change description"

# Keep commits focused and small
# One logical change per commit
# Include tests in the same commit as the feature
```

### 7. Push and PR Creation

#### Push Changes

```bash
# Push feature branch
git push -u origin feat/feature-name

# Or push with tracking
git push --set-upstream origin feat/feature-name
```

#### Create Pull Request

```bash
# Create PR with detailed description
gh pr create --title "feat(package-name): feature description" --body "
## Summary
Brief description of the feature and its purpose.

## Changes
- List of major changes
- New functionality added
- Any breaking changes

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests updated if needed

## Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Changelog entry added
- [ ] Migration guide created (if breaking)

## Checklist
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] No breaking changes (or properly documented)
- [ ] Backward compatibility maintained
"
```

### 8. Code Review Process

#### Self Review

```bash
# Review your own PR first
gh pr view --web

# Check CI status
gh pr checks

# Address any CI failures
gh pr view --json statusCheckRollup
```

#### Address Review Feedback

```bash
# Make requested changes
# Commit fixes with descriptive messages
git commit -m "fix: address review feedback - improve error handling"

# Push additional commits
git push
```

### 9. Pre-Merge Validation

#### Final Checks

```bash
# Ensure branch is up to date with main
git fetch origin
git rebase origin/main

# Run full test suite on updated branch
nx affected --target=test --base=origin/main
nx affected --target=build --base=origin/main
```

#### Integration Testing

```bash
# Test integration with other packages
nx affected:graph --base=origin/main

# Run E2E tests if applicable
nx affected --target=e2e --base=origin/main
```

### 10. Merge and Cleanup

#### Merge Strategy

```bash
# Use regular merge (not squash) to preserve commit history
gh pr merge --merge

# Or merge via GitHub UI using "Create a merge commit"
```

#### Post-Merge Cleanup

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Delete feature branch
git branch -d feat/feature-name
git push origin --delete feat/feature-name

# Verify merge was successful
git log --oneline -10
```

## Feature Types and Considerations

### New Package Features

```bash
# When adding new functionality to existing packages
- Follow existing package conventions
- Maintain backward compatibility
- Update package exports if needed
- Add comprehensive tests

# Example workflow
nx test package-name           # Ensure existing tests pass
# Implement feature
nx test package-name           # Ensure all tests still pass
nx build package-name          # Ensure package builds
```

### Cross-Package Features

```bash
# When feature spans multiple packages
- Consider impact on dependent packages
- Update package dependencies if needed
- Test integration between packages
- Coordinate version bumps

# Example workflow
nx affected:graph --base=main  # Visualize affected packages
nx affected --target=test      # Test all affected packages
```

### Breaking Changes

```bash
# When introducing breaking changes
- Create detailed migration guide
- Consider deprecation warnings first
- Update major version
- Communicate to team early

# Example commit
git commit -m "feat(api): redesign authentication system

BREAKING CHANGE:
- AuthService constructor now requires config object
- login() method returns Promise<AuthResult> instead of boolean
- See MIGRATION.md for upgrade instructions"
```

## Quality Gates

### Automated Quality Gates

- ✅ All tests pass (`nx affected --target=test`)
- ✅ Linting passes (`nx affected --target=lint`)
- ✅ Build succeeds (`nx affected --target=build`)
- ✅ Type checking passes
- ✅ Test coverage meets threshold

### Manual Quality Gates

- ✅ Code review approved
- ✅ Documentation updated
- ✅ Breaking changes documented
- ✅ Integration tested
- ✅ Performance impact assessed

## Troubleshooting Development Issues

### Common Development Problems

**Tests failing after changes:**

```bash
# Check what changed
nx affected:libs --base=main

# Run tests with verbose output
nx test package-name --verbose

# Check for dependency issues
nx graph --focus=package-name
```

**Build failures:**

```bash
# Check TypeScript errors
nx build package-name --verbose

# Check for circular dependencies
nx graph --focus=package-name

# Verify imports and exports
```

**Merge conflicts:**

```bash
# Rebase on latest main
git fetch origin
git rebase origin/main

# Resolve conflicts in affected files
# Run tests after resolving conflicts
nx affected --target=test --base=origin/main
```

---

**Development Best Practices:**

- Start with failing tests (TDD approach)
- Make small, focused commits
- Test integration points early
- Document as you go
- Consider performance implications
- Plan for backward compatibility
- Communicate breaking changes early

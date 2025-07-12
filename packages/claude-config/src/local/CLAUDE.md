# Repository-Specific Claude Configuration

Project-level Claude Code settings that complement global configurations.

## Project Information

**Project Type:** NX Monorepo  
**Primary Languages:** TypeScript, Rust, SurrealDB  
**Package Manager:** pnpm + NX  
**Team Size:** Small development team

## Project-Specific Rules

### Package Management Workflow

**CRITICAL:** Always use NX commands first, then pnpm. NEVER use npm.

```bash
# Preferred workflow
nx affected --target=build    # Build only changed packages
nx affected --target=test     # Test only affected packages
nx affected --target=lint     # Lint only changed code

# Package installation
pnpm install                  # Install dependencies
pnpm add package-name         # Add new package
```

### Development Workflow

#### Branch Strategy

- **Feature branches:** `feat/feature-name`
- **Bug fixes:** `fix/issue-description`
- **Documentation:** `docs/topic-name`
- **Chores:** `chore/task-description`

#### Commit Strategy

**IMPORTANT:** Separate commits per affected package for proper semantic
versioning.

```bash
# ✅ Correct: Separate commits per package
git add packages/nx-rust/
git commit -m "feat(nx-rust): add new cargo command"

git add packages/nx-surrealdb/
git commit -m "fix(nx-surrealdb): resolve migration issue"

# ❌ Wrong: Mixed package changes
git add packages/nx-rust/ packages/nx-surrealdb/
git commit -m "feat: update multiple packages"
```

### Testing Requirements

#### Pre-Release Testing

Before any release or merge:

- [ ] `nx affected --target=lint` passes
- [ ] `nx affected --target=test` passes
- [ ] `nx affected --target=build` passes
- [ ] Manual testing of affected functionality

#### Test Execution

```bash
# Run affected tests
nx affected --target=test

# Run specific package tests
nx test nx-surrealdb
nx test claude-config

# Run all tests (CI only)
nx run-many --target=test --all
```

### Code Quality Standards

#### TypeScript Rules

- **No `any` types** - Use proper typing
- **Explicit return types** for public functions
- **Prefer interfaces** over type aliases for object shapes
- **Use `const` assertions** for literal types

#### Documentation Requirements

- **README.md** for each package
- **CHANGELOG.md** maintained with releases
- **Inline comments** for complex logic
- **API documentation** for public interfaces

### Release Process

#### Version Bumping Strategy

- **feat:** triggers minor version bump
- **fix:** triggers patch version bump
- **BREAKING CHANGE:** triggers major version bump
- **chore/docs/style:** no version bump

#### Release Workflow

1. **Create release PR** from feature branch
2. **Run full test suite** and ensure all passes
3. **Update CHANGELOG.md** with changes
4. **Merge using regular merge** (not squash)
5. **GitHub Actions** handles version bumping and publishing

### Build and Deployment

#### Local Development

```bash
# Start development server
nx serve app-name

# Build for production
nx build app-name --prod

# Build all affected packages
nx affected --target=build
```

#### Environment Configuration

- **Development:** Use `.env.local` for local overrides
- **Testing:** Use test-specific environment files
- **Production:** Environment variables from CI/CD

### Team Collaboration

#### Code Review Process

- **All changes** require PR review
- **At least one approval** before merge
- **CI checks** must pass before merge
- **Documentation updates** included with feature changes

#### Communication

- **PR descriptions** should be detailed and explain the "why"
- **Issue linking** in PR descriptions
- **Breaking changes** must be clearly documented
- **Migration guides** for major API changes

### Repository-Specific Commands

#### Common Development Tasks

```bash
# Setup new package
nx g @nx/js:lib new-package-name

# Add new migration
nx g @deepbrainspace/nx-surrealdb:migration migration-name

# Run affected operations
nx affected:graph          # Visualize affected packages
nx affected --target=build # Build affected packages
```

#### Troubleshooting

```bash
# Clear NX cache
nx reset

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check package interdependencies
nx graph
```

### Project Conventions

#### File Organization

- **Packages:** `/packages/{package-name}/`
- **Documentation:** `/docs/{topic}/`
- **Configuration:** Root level configuration files
- **Scripts:** `/scripts/` for automation

#### Naming Conventions

- **Packages:** kebab-case (`nx-surrealdb`, `claude-config`)
- **Files:** kebab-case (`migration-service.ts`)
- **Variables:** camelCase (`migrationService`)
- **Types:** PascalCase (`MigrationService`)

### Security Guidelines

#### Secret Management

- **Never commit secrets** to version control
- **Use git-crypt** for encrypted environment files
- **Environment variables** for sensitive configuration
- **API keys** should be project-specific

#### Dependencies

- **Audit dependencies** regularly with `pnpm audit`
- **Update dependencies** using `nx migrate`
- **Pin versions** for stability in production
- **Review new dependencies** before adding

---

**Note:** This configuration supplements global Claude settings in `~/.claude/`
and takes precedence for this project.

# NX Monorepo Claude Configuration Template

Template configuration for NX monorepo projects with TypeScript, testing, and
build automation.

## Project Setup

**Project Type:** NX Monorepo  
**Package Manager:** {{ package_manager | default: "pnpm" }}  
**Primary Languages:** {{ languages | default: "TypeScript, JavaScript" }}  
**Testing Framework:** {{ test_framework | default: "Jest" }}

## NX Workflow Commands

### Core Operations

```bash
# Always use affected commands for efficiency
nx affected --target=build
nx affected --target=test
nx affected --target=lint

# Generate new libraries/applications
nx g @nx/js:lib new-library
nx g @nx/react:app new-app
```

### Package Management

```bash
# Install dependencies
{{ package_manager | default: "pnpm" }} install

# Add dependencies
{{ package_manager | default: "pnpm" }} add package-name

# Add dev dependencies
{{ package_manager | default: "pnpm" }} add -D package-name
```

## Development Workflow

### Branch Strategy

- **Feature:** `feat/feature-description`
- **Bug Fix:** `fix/issue-description`
- **Chore:** `chore/task-description`
- **Documentation:** `docs/topic-name`

### Commit Guidelines

Follow conventional commits for automatic semantic versioning:

```bash
# Feature (minor version bump)
git commit -m "feat(scope): add new feature"

# Bug fix (patch version bump)
git commit -m "fix(scope): resolve issue description"

# Breaking change (major version bump)
git commit -m "feat(scope): new feature

BREAKING CHANGE: describe the breaking change"
```

### Pre-Commit Workflow

```bash
# Check affected code
nx affected --target=lint
nx affected --target=test
nx affected --target=build

# Format code
nx format:write --uncommitted
```

## Testing Strategy

### Test Types

```bash
# Unit tests
nx test library-name

# Integration tests
nx test library-name --testPathPattern=integration

# E2E tests
nx e2e app-name
```

### Coverage Requirements

- **Minimum coverage:** {{ min_coverage | default: "80%" }}
- **Critical paths:** {{ critical_coverage | default: "95%" }}
- **New code:** {{ new_code_coverage | default: "90%" }}

## Build Configuration

### Development Builds

```bash
# Build affected packages
nx affected --target=build

# Build with watch mode
nx build library-name --watch
```

### Production Builds

```bash
# Build all for production
nx run-many --target=build --all --configuration=production

# Build affected for production
nx affected --target=build --configuration=production
```

## Release Process

### Automated Releases

This project uses automated semantic versioning:

1. **Conventional commits** trigger appropriate version bumps
2. **GitHub Actions** handle release creation
3. **Package publishing** happens automatically

### Manual Release

```bash
# Version packages
nx run-many --target=version --all

# Build packages
nx run-many --target=build --all --configuration=production

# Publish packages
nx run-many --target=publish --all
```

## Code Quality Standards

### TypeScript

- **Strict mode enabled**
- **No implicit any**
- **Explicit return types** for exported functions
- **Proper error handling**

### Testing

- **Test file naming:** `*.spec.ts`
- **Test coverage:** Minimum {{ min_coverage | default: "80%" }}
- **Integration tests** for critical workflows
- **Mocking** external dependencies

### Documentation

- **README.md** for each package
- **API documentation** for public interfaces
- **Changelog** maintained automatically
- **Code comments** for complex logic

## Project-Specific Rules

### Package Structure

```
packages/
├── lib-name/                 # Library packages
│   ├── src/
│   ├── package.json
│   └── README.md
├── app-name/                 # Application packages
│   ├── src/
│   └── project.json
└── shared/                   # Shared utilities
    └── utils/
```

### Dependency Management

- **Internal dependencies:** Use workspace protocol
- **External dependencies:** Pin major versions
- **Dev dependencies:** Keep in root when possible
- **Peer dependencies:** Use for framework integrations

### Performance Guidelines

- **Bundle size:** Monitor with `nx build --analyze`
- **Test performance:** Use `nx affected` for speed
- **Cache utilization:** Leverage NX caching
- **Parallel execution:** Use `--parallel` flag

## Environment Configuration

### Development

```bash
# Local development server
nx serve app-name

# Development environment variables
cp .env.example .env.local
```

### Testing

```bash
# Test environment setup
export NODE_ENV=test
nx test library-name
```

### Production

```bash
# Production build
nx build app-name --configuration=production

# Production environment (CI/CD)
export NODE_ENV=production
```

## Team Collaboration

### Code Review Process

- **All changes** require PR approval
- **CI checks** must pass
- **Documentation** updated with features
- **Tests** written for new functionality

### Communication

- **PR descriptions** explain the "why"
- **Breaking changes** clearly documented
- **Migration guides** for major updates
- **Issue linking** in PRs

## Troubleshooting

### Common Issues

```bash
# Clear NX cache
nx reset

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
{{ package_manager | default: "pnpm" }} install

# Check dependency graph
nx graph
```

### Performance Issues

```bash
# Use affected commands
nx affected --target=build

# Limit parallel execution
nx affected --target=test --parallel=2

# Skip cache for debugging
nx build library-name --skip-nx-cache
```

---

**Customization Notes:**

- Replace `{{ variables }}` with project-specific values
- Adjust coverage thresholds based on project requirements
- Modify workflow based on team size and release frequency
- Add project-specific tools and integrations as needed

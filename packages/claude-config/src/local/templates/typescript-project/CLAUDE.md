# TypeScript Project Claude Configuration Template

Template configuration for standalone TypeScript projects with modern tooling
and best practices.

## Project Setup

**Project Type:** TypeScript Library/Application  
**Package Manager:** {{ package_manager | default: "npm" }}  
**Build Tool:** {{ build_tool | default: "tsc" }}  
**Testing Framework:** {{ test_framework | default: "Jest" }}  
**Bundler:** {{ bundler | default: "none" }}

## Development Workflow

### Quick Commands

```bash
# Install dependencies
{{ package_manager | default: "npm" }} install

# Start development
{{ package_manager | default: "npm" }} run dev

# Build project
{{ package_manager | default: "npm" }} run build

# Run tests
{{ package_manager | default: "npm" }} test

# Lint code
{{ package_manager | default: "npm" }} run lint
```

### Git Workflow

```bash
# Feature development
git checkout -b feat/feature-name

# Bug fixes
git checkout -b fix/issue-description

# Commit with conventional format
git commit -m "feat: add new feature description"
git commit -m "fix: resolve issue description"
```

## TypeScript Configuration

### Strict Settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitThis": true
  }
}
```

### Code Quality Rules

- **No `any` types** - Use proper typing
- **Explicit return types** for exported functions
- **Interface over type** for object shapes
- **Const assertions** for literal types
- **Proper error handling** with typed errors

### Build Process

```bash
# Type checking
{{ package_manager | default: "npm" }} run type-check

# Build for development
{{ package_manager | default: "npm" }} run build:dev

# Build for production
{{ package_manager | default: "npm" }} run build:prod

# Watch mode
{{ package_manager | default: "npm" }} run build:watch
```

## Testing Strategy

### Test Structure

```bash
# Run all tests
{{ package_manager | default: "npm" }} test

# Run tests in watch mode
{{ package_manager | default: "npm" }} run test:watch

# Run tests with coverage
{{ package_manager | default: "npm" }} run test:coverage

# Run specific test file
{{ package_manager | default: "npm" }} test -- src/module.test.ts
```

### Test Types

- **Unit tests:** `*.test.ts` or `*.spec.ts`
- **Integration tests:** `integration/` directory
- **E2E tests:** `e2e/` directory

### Coverage Requirements

- **Minimum coverage:** {{ min_coverage | default: "80%" }}
- **Functions:** {{ function_coverage | default: "85%" }}
- **Lines:** {{ line_coverage | default: "85%" }}
- **Branches:** {{ branch_coverage | default: "75%" }}

## Code Quality

### Linting

```bash
# Lint code
{{ package_manager | default: "npm" }} run lint

# Fix linting issues
{{ package_manager | default: "npm" }} run lint:fix

# Check formatting
{{ package_manager | default: "npm" }} run format:check

# Format code
{{ package_manager | default: "npm" }} run format
```

### Pre-commit Checks

```bash
# Full quality check
{{ package_manager | default: "npm" }} run lint
{{ package_manager | default: "npm" }} run type-check
{{ package_manager | default: "npm" }} test
{{ package_manager | default: "npm" }} run build
```

## Package Management

### Dependencies

```bash
# Add production dependency
{{ package_manager | default: "npm" }} install package-name

# Add development dependency
{{ package_manager | default: "npm" }} install -D package-name

# Add type definitions
{{ package_manager | default: "npm" }} install -D @types/package-name

# Update dependencies
{{ package_manager | default: "npm" }} update
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "{{ dev_command | default: 'tsc --watch' }}",
    "build": "{{ build_command | default: 'tsc' }}",
    "test": "{{ test_command | default: 'jest' }}",
    "lint": "{{ lint_command | default: 'eslint src/**/*.ts' }}",
    "format": "{{ format_command | default: 'prettier --write .' }}"
  }
}
```

## Build and Distribution

### Build Configuration

```bash
# Development build
{{ package_manager | default: "npm" }} run build:dev

# Production build (optimized)
{{ package_manager | default: "npm" }} run build:prod

# Build with source maps
{{ package_manager | default: "npm" }} run build -- --sourceMap

# Build and watch
{{ package_manager | default: "npm" }} run build:watch
```

### Publishing

```bash
# Version bump
{{ package_manager | default: "npm" }} version patch|minor|major

# Prepare for publishing
{{ package_manager | default: "npm" }} run prepublishOnly

# Publish to npm
{{ package_manager | default: "npm" }} publish

# Publish beta version
{{ package_manager | default: "npm" }} publish --tag beta
```

## Environment Configuration

### Development Environment

```bash
# Environment variables
export NODE_ENV=development
export DEBUG=true

# Local configuration
cp .env.example .env.local
```

### Production Environment

```bash
# Production environment
export NODE_ENV=production

# Build for production
{{ package_manager | default: "npm" }} run build:prod
```

## Documentation

### Code Documentation

- **JSDoc comments** for public APIs
- **README.md** with usage examples
- **CHANGELOG.md** for version history
- **API documentation** generated from types

### Documentation Commands

```bash
# Generate API documentation
{{ package_manager | default: "npm" }} run docs

# Serve documentation locally
{{ package_manager | default: "npm" }} run docs:serve

# Update changelog
{{ package_manager | default: "npm" }} run changelog
```

## Debugging

### Development Debugging

```bash
# Debug with Node.js inspector
node --inspect-brk ./dist/index.js

# Debug tests
{{ package_manager | default: "npm" }} test -- --inspect-brk

# Debug with VS Code
# Add launch configuration in .vscode/launch.json
```

### Production Debugging

```bash
# Enable source maps for stack traces
export NODE_OPTIONS="--enable-source-maps"

# Production debugging (be careful!)
node --inspect ./dist/index.js
```

## Performance Optimization

### Build Performance

```bash
# Incremental compilation
{{ package_manager | default: "npm" }} run build -- --incremental

# Project references (for large projects)
{{ package_manager | default: "npm" }} run build -- --build

# Parallel type checking
{{ package_manager | default: "npm" }} run type-check -- --preserveWatchOutput
```

### Runtime Performance

- **Lazy loading** for large modules
- **Tree shaking** to eliminate dead code
- **Bundle analysis** to optimize size
- **Memory profiling** for memory leaks

## Troubleshooting

### Common Issues

**Type checking errors:**

```bash
# Regenerate type declarations
{{ package_manager | default: "npm" }} run build -- --declaration

# Check TypeScript configuration
npx tsc --showConfig
```

**Module resolution issues:**

```bash
# Check module paths
npx tsc --traceResolution

# Clear TypeScript cache
rm -rf ./dist ./node_modules/.cache
```

**Test failures:**

```bash
# Run tests with verbose output
{{ package_manager | default: "npm" }} test -- --verbose

# Clear Jest cache
{{ package_manager | default: "npm" }} test -- --clearCache
```

**Build failures:**

```bash
# Clean build
rm -rf dist
{{ package_manager | default: "npm" }} run build

# Check for circular dependencies
npx madge --circular src/
```

### Performance Issues

**Slow compilation:**

```bash
# Use incremental compilation
{{ package_manager | default: "npm" }} run build -- --incremental

# Exclude unnecessary files
# Update tsconfig.json exclude patterns
```

**Large bundle size:**

```bash
# Analyze bundle
npx webpack-bundle-analyzer dist/

# Check for duplicates
npx duplicate-package-checker-webpack-plugin
```

## Project Structure

### Recommended Structure

```
src/
├── index.ts              # Main entry point
├── types/                # Type definitions
├── utils/                # Utility functions
├── modules/              # Feature modules
├── __tests__/            # Test files
└── __mocks__/            # Mock files

dist/                     # Build output
docs/                     # Documentation
tests/                    # Integration tests
```

---

**Customization Checklist:**

- [ ] Update package.json with project-specific scripts
- [ ] Configure TypeScript compiler options
- [ ] Set up linting and formatting rules
- [ ] Configure testing framework
- [ ] Add project-specific dependencies
- [ ] Update documentation templates
- [ ] Configure CI/CD pipeline
- [ ] Set up pre-commit hooks

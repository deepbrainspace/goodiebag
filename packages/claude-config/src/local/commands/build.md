# Build Commands

Project-specific build and deployment commands for this NX monorepo.

## Quick Commands

### Development Build

```bash
# Build affected packages only (recommended)
nx affected --target=build

# Build specific package
nx build package-name

# Build with watch mode
nx build package-name --watch
```

### Production Build

```bash
# Build all packages for production
nx run-many --target=build --all --configuration=production

# Build affected packages for production
nx affected --target=build --configuration=production
```

## Package-Specific Builds

### TypeScript Packages

```bash
# Build TypeScript library
nx build nx-surrealdb
nx build nx-rust
nx build claude-config

# Build with type checking
nx build package-name --skipTypeCheck=false
```

### Rust Packages

```bash
# Build Rust package (uses NX wrapper)
nx build claude-code-toolkit

# Build in release mode
nx build claude-code-toolkit --configuration=release

# Build with specific target
nx build claude-code-toolkit --target=x86_64-unknown-linux-gnu
```

### Applications

```bash
# Build web application
nx build app-name

# Build with specific environment
nx build app-name --configuration=staging
nx build app-name --configuration=production
```

## Build Configurations

### Available Configurations

- **development** (default) - Fast builds with source maps
- **production** - Optimized builds with minification
- **staging** - Production-like builds with debug info
- **test** - Builds optimized for testing

### Configuration Examples

```bash
# Development build (default)
nx build package-name

# Production build
nx build package-name --configuration=production

# Staging build
nx build package-name --configuration=staging
```

## Build Optimization

### Affected Builds

```bash
# Only build what changed (recommended for CI/CD)
nx affected --target=build --base=HEAD~1

# Build affected packages since specific commit
nx affected --target=build --base=main

# Build affected packages with parallel execution
nx affected --target=build --parallel=3
```

### Cache Management

```bash
# Build with cache
nx build package-name

# Build without cache (force rebuild)
nx build package-name --skip-nx-cache

# Clear build cache
nx reset
```

## Build Verification

### Post-Build Checks

```bash
# Verify build artifacts exist
ls -la dist/packages/package-name/

# Test built package
nx test package-name --configuration=built

# Lint built artifacts
nx lint package-name --configuration=built
```

### Build Analysis

```bash
# Analyze bundle size
nx build package-name --analyze

# Generate build report
nx build package-name --stats-json

# View dependency graph
nx graph --focus=package-name
```

## Troubleshooting

### Common Build Issues

**Issue: "Cannot find module" errors**

```bash
# Solution: Clean and reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
nx reset
```

**Issue: TypeScript compilation errors**

```bash
# Solution: Check TypeScript configuration
nx build package-name --verbose
tsc --noEmit --project packages/package-name/tsconfig.json
```

**Issue: Rust build failures**

```bash
# Solution: Check Rust toolchain and dependencies
nx build claude-code-toolkit --verbose
cd packages/claude-code-toolkit && cargo check
```

**Issue: Out of memory errors**

```bash
# Solution: Increase Node.js memory limit
NODE_OPTIONS="--max_old_space_size=8192" nx build package-name
```

### Build Performance

#### Speed Optimization

```bash
# Use parallel builds
nx affected --target=build --parallel=true

# Skip type checking for faster builds
nx build package-name --skipTypeCheck=true

# Use incremental builds
nx build package-name --incremental
```

#### Memory Optimization

```bash
# Limit parallel processes
nx affected --target=build --parallel=2

# Build packages sequentially
nx affected --target=build --parallel=1
```

## CI/CD Integration

### GitHub Actions

```bash
# Build command for CI
nx affected --target=build --base=origin/main --parallel=3

# Build with cache
nx affected --target=build --base=origin/main --parallel=3 --cache
```

### Local CI Simulation

```bash
# Simulate CI build locally
nx affected --target=build --base=HEAD~1 --parallel=3

# Run full CI pipeline locally
nx run-many --target=build --all --parallel=3
```

## Build Outputs

### Output Locations

- **TypeScript packages:** `dist/packages/{package-name}/`
- **Rust packages:** `packages/{package-name}/target/`
- **Applications:** `dist/apps/{app-name}/`

### Artifact Structure

```
dist/packages/package-name/
├── index.js              # Main entry point
├── index.d.ts            # TypeScript definitions
├── package.json          # Package metadata
├── README.md             # Documentation
└── lib/                  # Library files
    ├── *.js              # Compiled JavaScript
    └── *.d.ts            # Type definitions
```

---

**Pro Tips:**

- Use `nx affected` for faster builds in development
- Always build before running tests or deployment
- Check build outputs in `dist/` directory after successful builds
- Use `--verbose` flag for detailed build information when debugging

# DeepBrain NX Plugins

A collection of NX plugins for DeepBrain projects, featuring database migrations and tooling.

<!-- Test CircleCI pipeline - attempt 2 -->

## Packages

### @deepbrainspace/nx-surrealdb

An NX plugin for SurrealDB migrations with modular architecture support.

**Features:**
- Database migration management
- Modular schema organization
- Dependency resolution between modules
- Rollback capabilities
- Status reporting
- Module import/export

**Installation:**
```bash
npm install @deepbrainspace/nx-surrealdb
# or
pnpm add @deepbrainspace/nx-surrealdb
```

**Usage:**
```bash
# Generate a new migration
nx g @deepbrainspace/nx-surrealdb:migration my-migration

# Run migrations
nx run database:migrate

# Check migration status
nx run database:status

# Rollback migrations
nx run database:rollback
```

## Development

### Prerequisites
- Node.js 18+ or 20+
- pnpm 9.0.0+
- NX CLI

### Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

## CI/CD Pipeline

Our CircleCI pipeline is optimized for speed and reliability with parallel job execution:

```
   dependencies
       ├── lint ──┐
       └── test ──┼── build ──┬── npm-publish
                  │           └── github-release
```

### Pipeline Stages

1. **`dependencies`** - Install pnpm and project dependencies
2. **`lint` + `test`** - Run in parallel after dependencies complete
   - **lint**: ESLint checks across all packages
   - **test**: Jest tests with coverage reporting
3. **`build`** - Compile TypeScript and prepare distribution files (requires both lint and test)
4. **`npm-publish` + `github-release`** - Run in parallel after successful build
   - **npm-publish**: Version bump and publish to npm registry
   - **github-release**: Create GitHub release with tarball artifacts

### Triggers

- **Production Release**: Push git tag (e.g., `v1.0.0`)
  - Publishes to npm with production tag
  - Creates GitHub release with version tag
- **Beta Release**: Merge to `main` branch
  - Auto-bumps patch version
  - Publishes to npm with `beta` tag
  - Creates GitHub prerelease

### Performance Benefits

- **~50% faster CI** through parallel execution
- **Independent failure modes** for publishing vs releases
- **Early failure detection** with lint-first approach
- **Artifact redundancy** via both npm registry and GitHub releases

### Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **Major** (v1.0.0): Breaking changes
- **Minor** (v0.1.0): New features, backwards compatible
- **Patch** (v0.0.1): Bug fixes, backwards compatible

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit changes: `git commit -m "feat: add my feature"`
6. Push to branch: `git push origin feature/my-feature`
7. Create a Pull Request

### Architecture

See individual package documentation:
- [nx-surrealdb Architecture](./packages/nx-surrealdb/ARCHITECTURE.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.
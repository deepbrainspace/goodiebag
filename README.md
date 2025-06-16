# DeepBrain NX Plugins

A collection of NX plugins for DeepBrain projects, featuring database migrations and tooling.

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

### CI/CD

This repository uses:
- **CircleCI** for continuous integration
- **NX Cloud** for distributed caching and execution
- **Automated publishing** to npm on releases

#### Publishing Process

1. **Automatic (Recommended):**
   - Create a git tag: `git tag v1.0.0 && git push origin v1.0.0`
   - CircleCI will automatically build, test, and publish

2. **Manual:**
   - Run the "Publish Package" workflow in CircleCI
   - Use dry-run mode for testing: set `dry_run: true`

#### Setup Instructions

1. **CircleCI Setup:**
   - Connect your repository to CircleCI
   - Add environment variable: `NPM_TOKEN` (your npm publish token)
   - Enable builds for your repository

2. **NX Cloud Setup:**
   - Sign up at [nx.app](https://nx.app)
   - Get your access token
   - Replace `your-nx-cloud-token-here` in `nx.json` with your actual token
   - Or set `NX_CLOUD_ACCESS_TOKEN` environment variable

3. **npm Registry:**
   - Create account at [npmjs.com](https://npmjs.com)
   - Generate access token with publish permissions
   - Add token to CircleCI environment variables

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
# Test Commands

Comprehensive testing commands for this NX monorepo with TypeScript, Rust, and
SurrealDB components.

## Quick Test Commands

### Run Affected Tests

```bash
# Test only affected packages (recommended)
nx affected --target=test

# Test affected packages with coverage
nx affected --target=test --coverage

# Test affected packages in watch mode
nx affected --target=test --watch
```

### Run Specific Tests

```bash
# Test specific package
nx test package-name

# Test specific file pattern
nx test package-name --testNamePattern="migration"

# Test specific test file
nx test package-name --testPathPattern="migration.spec.ts"
```

## Package-Specific Testing

### TypeScript Packages

```bash
# Test TypeScript packages with Jest
nx test nx-surrealdb
nx test nx-rust
nx test claude-config

# Test with coverage report
nx test nx-surrealdb --coverage

# Test in watch mode
nx test nx-surrealdb --watch
```

### Rust Packages

```bash
# Test Rust package
nx test claude-code-toolkit

# Test with output capture
nx test claude-code-toolkit --verbose

# Test specific module
nx test claude-code-toolkit --test=integration
```

### SurrealDB Integration Tests

```bash
# Test database migrations
nx test exponentials-tv --testNamePattern="migration"

# Test database schema
nx test exponentials-tv --testNamePattern="schema"

# Test with real database (requires setup)
SURREALDB_URL=ws://localhost:8000 nx test exponentials-tv
```

## Test Configurations

### Test Environments

```bash
# Unit tests (default)
nx test package-name

# Integration tests
nx test package-name --configuration=integration

# End-to-end tests
nx test package-name --configuration=e2e
```

### Test Options

```bash
# Run tests with coverage
nx test package-name --coverage

# Run tests in silent mode
nx test package-name --silent

# Run tests with verbose output
nx test package-name --verbose

# Run tests without cache
nx test package-name --skip-nx-cache
```

## Test Types

### Unit Tests

```bash
# Run unit tests for specific service
nx test nx-surrealdb --testNamePattern="MigrationService"

# Run unit tests for utilities
nx test nx-surrealdb --testNamePattern="PatternResolver"

# Run all unit tests
nx test nx-surrealdb --testPathPattern="spec.ts$"
```

### Integration Tests

```bash
# Run integration tests
nx test nx-surrealdb --testPathPattern="integration"

# Run database integration tests
nx test exponentials-tv --testNamePattern="database"

# Run API integration tests
nx test package-name --testNamePattern="api"
```

### End-to-End Tests

```bash
# Run E2E tests
nx e2e app-name

# Run E2E tests with specific browser
nx e2e app-name --browser=chrome

# Run E2E tests headlessly
nx e2e app-name --headless
```

## Test Coverage

### Coverage Reports

```bash
# Generate coverage report
nx test package-name --coverage

# Generate coverage for all packages
nx run-many --target=test --all --coverage

# Generate coverage with threshold
nx test package-name --coverage --coverageThreshold=80
```

### Coverage Analysis

```bash
# View coverage report
open coverage/packages/package-name/lcov-report/index.html

# Coverage summary
nx test package-name --coverage --coverageReporters=text-summary
```

## Test Debugging

### Debug Specific Tests

```bash
# Debug test with Node inspector
nx test package-name --runInBand --detectOpenHandles

# Debug with VS Code
nx test package-name --runInBand --detectOpenHandles --no-cache
```

### Verbose Testing

```bash
# Verbose output
nx test package-name --verbose

# Very verbose (includes console.log)
nx test package-name --verbose --silent=false
```

## Database Testing

### SurrealDB Test Setup

```bash
# Start test database
docker run -d --name surrealdb-test -p 8001:8000 surrealdb/surrealdb:latest start --log trace memory

# Run tests against test database
SURREALDB_URL=ws://localhost:8001 nx test exponentials-tv

# Clean up test database
docker stop surrealdb-test && docker rm surrealdb-test
```

### Migration Testing

```bash
# Test migrations up
nx test exponentials-tv --testNamePattern="migrate.*up"

# Test migrations down
nx test exponentials-tv --testNamePattern="migrate.*down"

# Test migration rollback
nx test exponentials-tv --testNamePattern="rollback"
```

## Performance Testing

### Load Testing

```bash
# Run performance tests
nx test package-name --testNamePattern="performance"

# Test with memory profiling
nx test package-name --logHeapUsage

# Test with timing
nx test package-name --verbose --testTimeout=30000
```

### Benchmark Testing

```bash
# Run benchmark tests
nx test package-name --testNamePattern="benchmark"

# Run with CPU profiling
node --prof $(which nx) test package-name
```

## Test Automation

### Pre-commit Testing

```bash
# Run affected tests before commit
nx affected --target=test --uncommitted

# Run linting and tests
nx affected --target=lint && nx affected --target=test
```

### CI/CD Testing

```bash
# CI test command
nx affected --target=test --base=origin/main --parallel=3

# Full test suite for release
nx run-many --target=test --all --parallel=3 --coverage
```

## Test Utilities

### Test Data Management

```bash
# Generate test fixtures
nx run package-name:generate-fixtures

# Reset test database
nx run exponentials-tv:reset-test-db

# Seed test data
nx run exponentials-tv:seed-test-data
```

### Test Monitoring

```bash
# Watch tests continuously
nx test package-name --watch

# Run tests when files change
nx test package-name --watchAll
```

## Troubleshooting

### Common Test Issues

**Issue: Tests timeout**

```bash
# Solution: Increase timeout
nx test package-name --testTimeout=60000

# Or update jest.config.js
# testTimeout: 60000
```

**Issue: Database connection fails**

```bash
# Solution: Check database is running
docker ps | grep surrealdb

# Start database if needed
docker run -d -p 8000:8000 surrealdb/surrealdb:latest start memory
```

**Issue: Tests fail intermittently**

```bash
# Solution: Run tests sequentially
nx test package-name --runInBand

# Or increase retry count
nx test package-name --retry=3
```

**Issue: Memory leaks in tests**

```bash
# Solution: Detect open handles
nx test package-name --detectOpenHandles --forceExit

# Clean up resources in afterEach/afterAll
```

### Test Performance Issues

**Slow test execution:**

```bash
# Use parallel execution
nx affected --target=test --parallel=true

# Skip slower integration tests in development
nx test package-name --testPathIgnorePatterns=integration
```

**High memory usage:**

```bash
# Limit worker processes
nx test package-name --maxWorkers=2

# Run tests in isolation
nx test package-name --runInBand
```

## Test Best Practices

### Test Structure

- **Unit tests:** `*.spec.ts` files alongside source
- **Integration tests:** `integration/` directory
- **E2E tests:** `e2e/` directory
- **Test utilities:** `test-utils/` directory

### Test Naming

- **Descriptive test names:** "should create migration when valid config
  provided"
- **Group related tests:** `describe` blocks for logical grouping
- **Test file naming:** `{feature}.spec.ts` format

### Test Data

- **Use factories** for test data generation
- **Mock external dependencies** appropriately
- **Clean up** test data after each test
- **Isolate tests** to prevent interference

---

**Pro Tips:**

- Run `nx affected --target=test` before committing changes
- Use `--coverage` to ensure adequate test coverage
- Write integration tests for critical paths
- Mock external services in unit tests
- Use descriptive test names that explain the expected behavior

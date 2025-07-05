# Testing SurrealDB Migrations

> **Status**: Testing features are not yet implemented. This document provides
> guidance for manual testing until automated testing is available.

## Overview

Database migration testing ensures that:

- Migrations execute without errors
- Rollbacks work correctly
- Schema changes are applied as expected
- Data integrity is maintained

## Manual Testing Process

### 1. Set Up Test Environment

Create a separate test database to avoid affecting development data:

```bash
# Start test SurrealDB instance
surrealdb start --log trace --user root --pass root --bind localhost:8001 memory

# Or use a persistent test database
surrealdb start --log trace --user root --pass root --bind localhost:8001 file://test.db
```

### 2. Configure Test Environment Variables

Create a `.env.test` file:

```bash
SURREALDB_URL=ws://localhost:8001/rpc
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=root
SURREALDB_NAMESPACE=myproject_test
SURREALDB_DATABASE=test
```

### 3. Test Migration Flow

```bash
# Check initial status
nx run myproject/db:status

# Apply migrations
nx run myproject/db:migrate

# Verify schema was created correctly
# (Connect to database and inspect tables/indexes)

# Test rollback
nx run myproject/db:rollback --module some_module

# Verify rollback worked
nx run myproject/db:status
```

### 4. Test Scenarios

#### Idempotency Testing

Ensure migrations can be run multiple times safely:

```bash
# Run migrations twice
nx run myproject/db:migrate
nx run myproject/db:migrate

# Both should succeed without conflicts
```

#### Rollback Testing

Test that up/down migration pairs work correctly:

```bash
# Apply a specific module
nx run myproject/db:migrate --module auth

# Rollback the same module
nx run myproject/db:rollback --module auth

# Verify clean state
nx run myproject/db:status --module auth
```

#### Dependency Testing

Test that module dependencies are respected:

```bash
# Try to rollback a module that others depend on
nx run myproject/db:rollback --module admin

# Should show dependency warnings/errors
```

## Planned Automated Testing Features

### Test Executor (Future)

```bash
# Planned test command
nx run myproject/db:test

# With specific test types
nx run myproject/db:test --type=idempotency
nx run myproject/db:test --type=rollback
nx run myproject/db:test --type=schema
```

### Test Types

#### 1. Dry-Run Testing

- Parse and validate SQL syntax
- Check migration order and dependencies
- Verify no conflicts between migrations

#### 2. Integration Testing

- Apply migrations to test database
- Verify schema matches expected structure
- Test rollback functionality

#### 3. Idempotency Testing

- Run migrations multiple times
- Ensure no duplicate data or conflicts
- Verify IF NOT EXISTS clauses work

#### 4. Performance Testing

- Measure migration execution time
- Test with large datasets
- Identify slow migrations

## CI/CD Testing

### GitHub Actions Example

```yaml
name: Test Migrations
on: [push, pull_request]

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    services:
      surrealdb:
        image: surrealdb/surrealdb:latest
        ports:
          - 8000:8000
        options: --health-cmd "curl -f http://localhost:8000/health"

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Test migrations
        env:
          SURREALDB_URL: ws://localhost:8000/rpc
          SURREALDB_NAMESPACE: ci_test_${{ github.run_id }}
          SURREALDB_DATABASE: test
        run: |
          nx run myproject/db:lint
          nx run myproject/db:migrate --dry-run
          # Add more test commands when available
```

## Best Practices

### Migration Testing

1. **Always test rollbacks** - Every up migration should have a working down
   migration
2. **Test in isolation** - Use separate test databases/namespaces
3. **Test with data** - Verify migrations work with existing data
4. **Test dependencies** - Ensure module dependencies are correct

### Test Data Management

1. **Use fixtures** - Create consistent test data sets
2. **Clean between tests** - Reset database state between test runs
3. **Test edge cases** - Empty tables, large datasets, etc.

### Continuous Testing

1. **Automate in CI** - Run tests on every commit
2. **Test migrations on staging** - Before production deployment
3. **Monitor performance** - Track migration execution times

## Contributing

To help implement automated testing features:

1. See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup
2. Check GitHub issues for testing-related tasks
3. Review the [Architecture](../ARCHITECTURE.md) for implementation guidance

## TODO: Planned Features

- [ ] Dry-run migration executor
- [ ] Rollback safety validation
- [ ] Schema comparison tools
- [ ] Performance benchmarking
- [ ] Test fixture management
- [ ] CI/CD integration templates
- [ ] Migration testing best practices guide

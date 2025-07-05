# test-config - SurrealDB Migrations

This directory contains the SurrealDB migrations for the test-config project.

## Getting Started

### 1. Configure Environment

Add these to your `.env` file:

```bash
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NAMESPACE=test-config
SURREALDB_DATABASE=main
SURREALDB_ROOT_USER=root
SURREALDB_ROOT_PASS=root
```

### 2. Create Module Structure

The project uses a modular architecture. Create your first migration:

```bash
# Generate a migration for a specific module
nx g @deepbrainspace/nx-surrealdb:migration --name=init --module=000_admin --project=test-config
```

Or import pre-built modules (coming soon):

```bash
# Import admin module
nx g @deepbrainspace/nx-surrealdb:import-module --module=@deepbrainspace/surrealdb-module-admin --project=test-config
```

## Structure

```
test-config/
├── config.json             # Module configuration
├── project.json            # NX project configuration
├── 000_admin/              # System administration module
├── 010_auth/               # Authentication module
└── 020_schema/             # Application schema module
```

## Commands

```bash
# Generate a new migration
nx g @deepbrainspace/nx-surrealdb:migration --name=my-migration --module=000_admin --project=test-config

# Run migrations
nx run test-config:migrate

# Check migration status
nx run test-config:status

# Rollback migrations
nx run test-config:rollback

# Reset all migrations (WARNING: destructive)
nx run test-config:reset
```

## Troubleshooting

If you get connection errors:

- Check your .env file has the correct SurrealDB connection details
- Ensure SurrealDB is running (e.g., `surreal start --user root --pass root`)

# NX SurrealDB Plugin - Roadmap

## Major Features for Future Development

### 1. **Pluggable Backend Database Support**
Allow users to choose which database to use instead of being locked to SurrealDB. Since we're using standard SQL, this should be fairly straightforward. Main changes: rename `.surql` to `.sql`, use generic variable names (`DATABASE_URL` instead of `SURREALDB_URL`), and create database adapter interface.

### 2. **Code Cleanup - Generators and Executors**
Remove duplication between generators and executors by extracting shared code patterns into common utilities. This will improve maintainability and ensure consistent behavior across all executors.

### 3. **Custom Project Generator**
Create a generator that sets up complete `database/` folder with common migration modules (authentication, permissions, audit logging) and pre-configured `config.json` with sensible defaults.

### 4. **Integration Testing with Real Database**
Replace current mocking with real database integration tests using Docker containers. Test all migration scenarios against actual databases for better reliability and confidence.

### 5. **Fix Current Test Suite**
Address issues and gaps in existing test coverage. Fix broken tests, improve reliability, and add missing coverage for edge cases.

### 6. **Publish to npm Registry**
Prepare and publish the plugin to npm for public distribution. Set up proper versioning and package configuration for public consumption.

### 7. **CI/CD Pipeline**
Set up automated build, testing, and publishing pipeline with GitHub Actions. Include automated testing on PRs, multi-database testing, and release automation.

### 8. **Separate Pattern Matching Plugin**
Extract the pattern-matching functionality (module and filename resolution with auto-globbing) into a separate NX plugin. This can be used independently of the nx-surrealdb module for other projects that need smart pattern matching capabilities.
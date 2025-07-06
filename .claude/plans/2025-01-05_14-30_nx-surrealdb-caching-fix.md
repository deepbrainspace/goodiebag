# NX-SurrealDB Caching Fix Implementation Plan

**Date:** 2025-01-05 14:30  
**Issue:** Manual project deletion causes NX cache conflicts requiring
`nx reset`  
**Solution:** Create proper destroy generator using NX Tree API

## User Approval Process

**For each step completion, I must:**

1. **Self-test thoroughly** and ensure all success criteria are met
2. **Present clear test results** showing what works
3. **Provide specific testing commands** for user verification
4. **Show build success** and any output/artifacts created
5. **Wait for explicit user approval** before proceeding to next step
6. **Document any issues** discovered and how they were resolved

**ALL testing will be done using the existing `exponentials.tv/db` project as
the primary test case.**

## Implementation Tasks

### Phase 1: Generator Infrastructure ✅ COMPLETED

- ✅ Add schema.d.ts to migration generator
- ✅ Add schema.d.ts to remaining generators (export, import, init)
- ✅ Simplify export and import generators for simple tar archives

### Step 1: Fix Failing Tests ✅ **COMPLETED**

- ✅ Update export generator tests to expect simple tar archives (no
  package.json, README.md)
- ✅ Update import generator tests to expect direct .surql file copying
- ✅ Remove test expectations for complex package structures
- ✅ Ensure all tests pass with simplified behavior
- ✅ Test export/import with real `exponentials.tv/db` project
- ✅ Present results and request user approval for Step 1 completion
- ✅ Git commit and push changes after user approval

### Step 2: Create Destroy Generator 🔧 **CURRENT**

- ✅ Create destroy generator using `removeProjectConfiguration()` and
  `tree.delete()`
- ✅ Add proper schema.d.ts and schema.json files
- ✅ Add generator to generators.json registry
- ✅ Implement comprehensive tests for project removal
- ✅ Test with `exponentials.tv/db` project: destroy → init cycle without
  `nx reset`
- ✅ Present results and request user approval for Step 2 completion
- ✅ Git commit and push changes after user approval

## Success Criteria

- All tests pass
- Destroy generator removes `exponentials.tv/db` completely
- No `nx reset` required after destroy + init cycle
- NX workspace remains consistent
- Re-creation works seamlessly

---

## Implementation Notes & Research

### Problem Analysis

Manual deletion of `exponentials.tv/db` leaves project configuration in NX
workspace, causing cache conflicts when running init again.

### NX Devkit APIs Required

- `removeProjectConfiguration(tree, projectName)` - Removes project from
  workspace
- `tree.delete(path)` - Removes files/directories
- `getProjects(tree)` - Gets all workspace projects
- `removeDependenciesFromPackageJson()` - Cleans package.json

### Current Init Generator Creates

```typescript
generateFiles(tree, path.join(__dirname, 'files'), projectPath, {
  // Creates project.json.template with NX targets
  // Creates directory structure with modules
  // Creates config.json with module configuration
});
```

### Proposed Destroy Generator

```typescript
export default async function destroyGenerator(
  tree: Tree,
  options: DestroySchema
) {
  // 1. Remove NX project configuration
  removeProjectConfiguration(tree, projectName);

  // 2. Remove all project files
  const projects = getProjects(tree);
  const project = projects.get(projectName);
  if (project?.root) {
    tree.delete(project.root);
  }

  // 3. Clean up package.json dependencies
  removeDependenciesFromPackageJson(tree, ['surrealdb'], [], 'package.json');
}
```

### Workflow Comparison

```bash
# Old: rm -rf exponentials.tv/ → nx init → nx reset (BAD)
# New: nx destroy exponentials.tv/db → nx init exponentials.tv/db (GOOD)
```

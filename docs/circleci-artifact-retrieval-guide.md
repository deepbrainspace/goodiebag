# CircleCI Build Artifact Retrieval Guide

This guide provides practical solutions for accessing build artifacts from previous CircleCI builds in new pipeline runs, specifically for NX monorepo with npm packages.

## 1. CircleCI Artifact API

### Authentication Methods

CircleCI supports three authentication methods (in order of preference):

#### a. Circle-Token Header (Recommended)
```bash
curl https://circleci.com/api/v1.1/project/:vcs-type/:username/:project/:build_num/artifacts \
  -H "Circle-Token: <your-api-token>"
```

#### b. HTTP Basic Authentication
```bash
curl https://circleci.com/api/v1.1/project/:vcs-type/:username/:project/:build_num/artifacts \
  -u "<your-api-token>:"
```

#### c. Query Parameter (Deprecated)
```bash
curl https://circleci.com/api/v1.1/project/:vcs-type/:username/:project/:build_num/artifacts?circle-token=<your-api-token>
```

### API Endpoints

#### API v1.1 Endpoints
1. **Get artifacts for a specific build:**
   ```
   GET https://circleci.com/api/v1.1/project/:vcs-type/:username/:project/:build_num/artifacts
   ```

2. **Get latest artifacts for a branch:**
   ```
   GET https://circleci.com/api/v1.1/project/:vcs-type/:username/:project/latest/artifacts?branch=:branch_name
   ```

#### API v2 Endpoints
1. **Get artifacts for a specific job:**
   ```
   GET https://circleci.com/api/v2/project/{project-slug}/{job_number}/artifacts
   ```

### Practical Example: Download All Artifacts
```bash
#!/bin/bash
# Set your API token
export CIRCLE_TOKEN='your-api-token-here'

# Download all artifacts from a specific build
curl -s -H "Circle-Token: $CIRCLE_TOKEN" \
  https://circleci.com/api/v1.1/project/github/myorg/myproject/123/artifacts \
  | grep -o -E 'https://([^"]*)' \
  | wget --verbose --header "Circle-Token: $CIRCLE_TOKEN" --input-file -
```

## 2. NX Cloud Cache

NX Cloud provides remote caching (Nx Replay) that persists build outputs across different pipeline runs.

### Key Features

1. **Cross-Pipeline Cache Sharing**: Tasks executed in one pipeline can be reused in subsequent runs
2. **Automatic Artifact Transfer**: Build outputs (dist/ folders) are automatically cached and retrieved
3. **Selective Access Control**: Configure read/write permissions for CI vs developers

### What Gets Cached
- Terminal output (logs, warnings, errors)
- Task artifacts (build outputs defined in `outputs` property)
- Files in dist/ folders

### Configuration Example
```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nrwl/nx-cloud",
      "options": {
        "accessToken": "your-nx-cloud-token",
        "cacheableOperations": ["build", "test", "lint"],
        "parallel": 3
      }
    }
  }
}
```

### Benefits for CI/CD
- Prevents rebuilding unchanged packages
- Shares artifacts between PR builds and main branch merges
- Reduces CI execution time significantly

## 3. CircleCI Workspace Persistence

**Important Limitation**: Workspaces only persist within the same workflow execution, NOT across different workflow runs.

### Within Same Workflow
```yaml
jobs:
  build:
    steps:
      - checkout
      - run: pnpm build
      - persist_to_workspace:
          root: .
          paths:
            - dist/
            - packages/*/dist/

  publish:
    steps:
      - attach_workspace:
          at: .
      - run: npm publish
```

### For Cross-Workflow Sharing
Workspaces cannot be shared between different workflow runs. Use artifacts or external storage instead.

## 4. Git SHA-based Artifact Retrieval

CircleCI doesn't provide a direct API to retrieve artifacts by commit SHA. Here's a workaround:

### Step 1: Find Pipeline/Build by Commit SHA
```bash
#!/bin/bash
org_name='your-org'
prj_name='your-project'
branch_name='main'
target_sha='abc123def456'
CIRCLE_TOKEN='your-token'

# Get pipelines for the branch
pipelines=$(curl -s -H "Circle-Token: ${CIRCLE_TOKEN}" \
  "https://circleci.com/api/v2/project/gh/${org_name}/${prj_name}/pipeline?branch=${branch_name}")

# Find pipeline ID for target SHA
pipeline_id=$(echo $pipelines | jq -r '.items[] | select(.vcs.revision == "'${target_sha}'") | .id')

# Get workflows for the pipeline
workflows=$(curl -s -H "Circle-Token: ${CIRCLE_TOKEN}" \
  "https://circleci.com/api/v2/pipeline/${pipeline_id}/workflow")

# Extract job numbers
job_numbers=$(echo $workflows | jq -r '.items[].id')
```

### Step 2: Retrieve Artifacts
```bash
# For each job, get artifacts
for job_id in $job_numbers; do
  artifacts=$(curl -s -H "Circle-Token: ${CIRCLE_TOKEN}" \
    "https://circleci.com/api/v2/workflow/${job_id}/job")
  
  # Process artifacts...
done
```

## 5. Practical Implementation for NX Monorepo

### Option 1: NX Cloud (Recommended)
```yaml
version: 2.1

jobs:
  build-pr:
    docker:
      - image: cimg/node:20.9.0
    steps:
      - checkout
      - run: pnpm install --frozen-lockfile
      - run:
          name: Build with NX Cloud caching
          command: |
            # NX Cloud will automatically cache dist/ folders
            pnpm nx affected:build --base=origin/main --head=HEAD
      
  publish-on-merge:
    docker:
      - image: cimg/node:20.9.0
    steps:
      - checkout
      - run: pnpm install --frozen-lockfile
      - run:
          name: Build or retrieve from cache
          command: |
            # NX Cloud will retrieve cached artifacts if available
            pnpm nx affected:build --base=origin/main~1 --head=HEAD
      - run:
          name: Publish packages
          command: pnpm publish:all

workflows:
  version: 2
  pr-workflow:
    jobs:
      - build-pr:
          filters:
            branches:
              ignore: main
  
  main-workflow:
    jobs:
      - publish-on-merge:
          filters:
            branches:
              only: main
```

### Option 2: CircleCI Artifacts with API
```yaml
version: 2.1

jobs:
  build-and-store:
    docker:
      - image: cimg/node:20.9.0
    steps:
      - checkout
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - store_artifacts:
          path: packages/*/dist
          destination: build-artifacts
      - run:
          name: Save build metadata
          command: |
            echo "{\"commit\": \"$CIRCLE_SHA1\", \"build\": \"$CIRCLE_BUILD_NUM\"}" > build-info.json
      - store_artifacts:
          path: build-info.json

  retrieve-and-publish:
    docker:
      - image: cimg/node:20.9.0
    steps:
      - checkout
      - run:
          name: Retrieve artifacts from previous build
          command: |
            # Get the commit SHA from the PR that was merged
            MERGE_COMMIT=$(git log --format="%H" -n 1)
            PR_COMMIT=$(git log --format="%H" -n 2 | tail -1)
            
            # Try to find build artifacts
            ./scripts/retrieve-artifacts.sh $PR_COMMIT || \
            ./scripts/retrieve-artifacts.sh $MERGE_COMMIT || \
            (echo "No artifacts found, rebuilding..." && pnpm build)
      - run:
          name: Publish packages
          command: pnpm publish:all
```

### Helper Script: retrieve-artifacts.sh
```bash
#!/bin/bash
set -e

COMMIT_SHA=$1
CIRCLE_TOKEN=${CIRCLE_TOKEN}
ORG="your-org"
PROJECT="your-project"

# Find build number for commit
echo "Searching for build with commit $COMMIT_SHA..."

# Get recent builds
builds=$(curl -s -H "Circle-Token: $CIRCLE_TOKEN" \
  "https://circleci.com/api/v1.1/project/github/$ORG/$PROJECT?limit=100")

# Find build with matching SHA
build_num=$(echo $builds | jq -r '.[] | select(.vcs_revision == "'$COMMIT_SHA'") | .build_num' | head -1)

if [ -z "$build_num" ]; then
  echo "No build found for commit $COMMIT_SHA"
  exit 1
fi

echo "Found build #$build_num for commit $COMMIT_SHA"

# Get artifacts
artifacts=$(curl -s -H "Circle-Token: $CIRCLE_TOKEN" \
  "https://circleci.com/api/v1.1/project/github/$ORG/$PROJECT/$build_num/artifacts")

# Download dist folders
echo $artifacts | jq -r '.[] | select(.path | contains("/dist/")) | .url' | \
while read -r url; do
  # Extract relative path from URL
  relative_path=$(echo $url | sed 's/.*\/build-artifacts\///')
  mkdir -p $(dirname "$relative_path")
  curl -L -H "Circle-Token: $CIRCLE_TOKEN" "$url" -o "$relative_path"
done

echo "Artifacts retrieved successfully"
```

### Option 3: External Storage (S3)
```yaml
jobs:
  build-and-upload:
    steps:
      - checkout
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run:
          name: Upload to S3
          command: |
            aws s3 sync packages/*/dist s3://my-artifacts/$CIRCLE_SHA1/dist \
              --delete --cache-control "max-age=31536000"

  download-and-publish:
    steps:
      - checkout
      - run:
          name: Download from S3
          command: |
            # Get PR commit SHA (adjust based on your merge strategy)
            PR_SHA=$(git log --format="%H" -n 2 | tail -1)
            
            # Try to download artifacts
            if aws s3 sync s3://my-artifacts/$PR_SHA/dist . --delete; then
              echo "Artifacts retrieved from S3"
            else
              echo "No artifacts found, rebuilding..."
              pnpm install --frozen-lockfile
              pnpm build
            fi
      - run: pnpm publish:all
```

## Best Practices

1. **Use NX Cloud for Monorepos**: It's specifically designed for this use case and handles caching automatically
2. **Set Artifact Retention**: CircleCI artifacts expire after 30 days by default
3. **Implement Fallbacks**: Always have a rebuild strategy if artifacts aren't found
4. **Version Your Artifacts**: Include version/commit info with artifacts for verification
5. **Use Compression**: Compress large dist folders before storing as artifacts
6. **Parallel Processing**: Use CircleCI's parallelism with NX affected commands

## Error Handling

```bash
# Robust artifact retrieval with fallback
retrieve_or_build() {
  local commit_sha=$1
  
  if retrieve_artifacts_by_sha "$commit_sha"; then
    echo "✓ Artifacts retrieved successfully"
    return 0
  elif [ -n "$NX_CLOUD_ACCESS_TOKEN" ] && nx print-affected --type=app --select=projects | grep -q .; then
    echo "✓ Using NX Cloud cache"
    return 0
  else
    echo "⚠ No artifacts found, rebuilding..."
    pnpm install --frozen-lockfile
    pnpm build
    return $?
  fi
}
```

## Conclusion

For NX monorepos, the most reliable approach is:
1. **Primary**: Use NX Cloud for automatic cross-pipeline caching
2. **Secondary**: Store artifacts in CircleCI with API retrieval scripts
3. **Fallback**: Always implement rebuild capability when artifacts are unavailable

This ensures fast builds while maintaining reliability across different pipeline runs.
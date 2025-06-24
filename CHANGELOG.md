## 0.2.0 (2025-06-24)

### 🚀 Features

- enable NX Cloud distributed caching for CI and local development ([c84f0d6](https://github.com/deepbrainspace/goodiebag/commit/c84f0d6))
- add smart release branch detection to build workflow ([5110d4a](https://github.com/deepbrainspace/goodiebag/commit/5110d4a))
- ⚠️  simplify release system to use direct NX commands ([e0e7d86](https://github.com/deepbrainspace/goodiebag/commit/e0e7d86))

### 🩹 Fixes

- rename summary job to match branch protection requirement ([3e2cca1](https://github.com/deepbrainspace/goodiebag/commit/3e2cca1))
- handle different build output paths for Rust and TypeScript packages ([3810a2b](https://github.com/deepbrainspace/goodiebag/commit/3810a2b))
- resolve NX release configuration and workflow commit parsing ([22eb9e3](https://github.com/deepbrainspace/goodiebag/commit/22eb9e3))

### ⚠️  Breaking Changes

- Automated release workflows removed, now requires manual nx release commands

### ❤️ Thank You

- DeepBrain

## 0.1.1 (2025-06-24)

This was a version bump only for goodiebag to align it with other projects, there were no code changes.

## 0.1.0 (2025-06-24)

### 🚀 Features

- unify CI checks under single '✅ CI Build' status ([0b5bc83](https://github.com/deepbrainspace/goodiebag/commit/0b5bc83))
- link custom checks to actual workflow runs instead of dispatcher ([beedda6](https://github.com/deepbrainspace/goodiebag/commit/beedda6))
- implement workflow dispatcher architecture ([c0a94b1](https://github.com/deepbrainspace/goodiebag/commit/c0a94b1))
- auto-add automerge label when checks pass ([9502174](https://github.com/deepbrainspace/goodiebag/commit/9502174))
- update CODEOWNERS to use admin team instead of individual user ([359f704](https://github.com/deepbrainspace/goodiebag/commit/359f704))
- add repository-specific CODEOWNERS for automatic reviewer assignment ([4bb8a06](https://github.com/deepbrainspace/goodiebag/commit/4bb8a06))
- **ci:** improve GitHub status checks visibility ([a0511ff](https://github.com/deepbrainspace/goodiebag/commit/a0511ff))
- add git-crypt validation to prevent unencrypted sensitive files ([c6b7f17](https://github.com/deepbrainspace/goodiebag/commit/c6b7f17))
- add comprehensive husky hooks for security, workflow protection, and auto-dependency management ([e1f43f5](https://github.com/deepbrainspace/goodiebag/commit/e1f43f5))
- add conventional commit validation with husky commit-msg hook ([4d244d6](https://github.com/deepbrainspace/goodiebag/commit/4d244d6))
- add husky hooks for automatic lockfile management ([a7a671a](https://github.com/deepbrainspace/goodiebag/commit/a7a671a))
- add husky pre-commit hook for automatic nx format on commit ([2fa0baf](https://github.com/deepbrainspace/goodiebag/commit/2fa0baf))
- expand build workflow triggers to include GitHub Actions and docs changes ([da35263](https://github.com/deepbrainspace/goodiebag/commit/da35263))
- implement PR-based release pipeline with cross-workflow artifacts ([04eae2c](https://github.com/deepbrainspace/goodiebag/commit/04eae2c))
- **workflow:** implement matrix-based release pipeline with improved visibility ([3cf8c23](https://github.com/deepbrainspace/goodiebag/commit/3cf8c23))

### 🩹 Fixes

- update pnpm version in setup-workspace action to 10.12.2 ([eb98523](https://github.com/deepbrainspace/goodiebag/commit/eb98523))
- reset release branch to main instead of merging + fix husky lockfile check ([76ed48f](https://github.com/deepbrainspace/goodiebag/commit/76ed48f))
- use GH_PAT instead of GITHUB_TOKEN to enable workflow triggering ([fe2113a](https://github.com/deepbrainspace/goodiebag/commit/fe2113a))
- rename workflows ([5ef842e](https://github.com/deepbrainspace/goodiebag/commit/5ef842e))
- remove duplicate PR triggers from worker workflows ([26c2bc8](https://github.com/deepbrainspace/goodiebag/commit/26c2bc8))
- align input parameters across workflow dispatches ([0a42af0](https://github.com/deepbrainspace/goodiebag/commit/0a42af0))
- align custom check names with branch protection requirements ([c7db9e1](https://github.com/deepbrainspace/goodiebag/commit/c7db9e1))
- add checkout step to build summary job for custom action access ([0a816e9](https://github.com/deepbrainspace/goodiebag/commit/0a816e9))
- improve pre-commit formatting feedback and logic ([a466265](https://github.com/deepbrainspace/goodiebag/commit/a466265))
- auto-stage formatting changes in pre-commit hook ([836fbc0](https://github.com/deepbrainspace/goodiebag/commit/836fbc0))
- replace deprecated actions-rs/toolchain with dtolnay/rust-toolchain ([15c20eb](https://github.com/deepbrainspace/goodiebag/commit/15c20eb))
- use nrwl/nx-set-shas@v4.3.0 to eliminate set-output warnings ([4bba22d](https://github.com/deepbrainspace/goodiebag/commit/4bba22d))
- correct nrwl/nx-set-shas version to v4 (latest available) ([e7b8704](https://github.com/deepbrainspace/goodiebag/commit/e7b8704))
- update GitHub Actions to eliminate deprecation warnings ([58bc2fb](https://github.com/deepbrainspace/goodiebag/commit/58bc2fb))
- improve prepare workflow parsing and enhance secret detection ([#40](https://github.com/deepbrainspace/goodiebag/pull/40))
- remove post-merge hook to avoid unexpected file modifications ([a7f8a27](https://github.com/deepbrainspace/goodiebag/commit/a7f8a27))
- remove deprecated husky script header for v10 compatibility ([8bb8f53](https://github.com/deepbrainspace/goodiebag/commit/8bb8f53))
- handle manual package input parameter in detect-affected action ([01811b9](https://github.com/deepbrainspace/goodiebag/commit/01811b9))
- resolve release workflow dist/ artifact sharing issues ([#35](https://github.com/deepbrainspace/goodiebag/pull/35))
- resolve NX release cross-dependency issues ([a12a307](https://github.com/deepbrainspace/goodiebag/commit/a12a307))

### 🔥 Performance

- optimize GitHub Actions cache usage with split caches and 1-day artifact retention ([3357343](https://github.com/deepbrainspace/goodiebag/commit/3357343))

### ❤️ Thank You

- DeepBrain
- nayeem.ai @wizardsupreme
- wizard supreme @wizardsupreme

# Changelog

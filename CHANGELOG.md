## 0.1.0 (2025-06-23)

### 🚀 Features

- unify CI checks under single '✅ CI Build' status ([0b5bc83](https://github.com/deepbrainspace/goodiebag/commit/0b5bc83))
- link custom checks to actual workflow runs instead of dispatcher ([beedda6](https://github.com/deepbrainspace/goodiebag/commit/beedda6))
- implement workflow dispatcher architecture ([c0a94b1](https://github.com/deepbrainspace/goodiebag/commit/c0a94b1))
- auto-add automerge label when checks pass ([9502174](https://github.com/deepbrainspace/goodiebag/commit/9502174))
- add release validation workflow for release branches ([784c7da](https://github.com/deepbrainspace/goodiebag/commit/784c7da))
- update CODEOWNERS to use admin team instead of individual user ([359f704](https://github.com/deepbrainspace/goodiebag/commit/359f704))
- add repository-specific CODEOWNERS for automatic reviewer assignment ([4bb8a06](https://github.com/deepbrainspace/goodiebag/commit/4bb8a06))
- **ci:** improve GitHub status checks visibility ([a0511ff](https://github.com/deepbrainspace/goodiebag/commit/a0511ff))
- enhance release workflow with better commit messages and changelog content ([06cf66f](https://github.com/deepbrainspace/goodiebag/commit/06cf66f))
- implement Release Please branching strategy for consistent release workflows ([ac17952](https://github.com/deepbrainspace/goodiebag/commit/ac17952))
- add git-crypt validation to prevent unencrypted sensitive files ([c6b7f17](https://github.com/deepbrainspace/goodiebag/commit/c6b7f17))
- add comprehensive husky hooks for security, workflow protection, and auto-dependency management ([e1f43f5](https://github.com/deepbrainspace/goodiebag/commit/e1f43f5))
- add conventional commit validation with husky commit-msg hook ([4d244d6](https://github.com/deepbrainspace/goodiebag/commit/4d244d6))
- add husky hooks for automatic lockfile management ([a7a671a](https://github.com/deepbrainspace/goodiebag/commit/a7a671a))
- add husky pre-commit hook for automatic nx format on commit ([2fa0baf](https://github.com/deepbrainspace/goodiebag/commit/2fa0baf))
- expand build workflow triggers to include GitHub Actions and docs changes ([da35263](https://github.com/deepbrainspace/goodiebag/commit/da35263))
- implement PR-based release pipeline with cross-workflow artifacts ([04eae2c](https://github.com/deepbrainspace/goodiebag/commit/04eae2c))
- **workflow:** implement matrix-based release pipeline with improved visibility ([3cf8c23](https://github.com/deepbrainspace/goodiebag/commit/3cf8c23))

### 🩹 Fixes

- prevent unintended user notifications in release PR descriptions ([4fe47df](https://github.com/deepbrainspace/goodiebag/commit/4fe47df))
- align custom check names with branch protection requirements ([c7db9e1](https://github.com/deepbrainspace/goodiebag/commit/c7db9e1))
- use GitHub API instead of gh CLI for workflow dispatch ([57b49a5](https://github.com/deepbrainspace/goodiebag/commit/57b49a5))
- add checkout step to build summary job for custom action access ([0a816e9](https://github.com/deepbrainspace/goodiebag/commit/0a816e9))
- changed release validation to use branches-ignre instead ([e0195ba](https://github.com/deepbrainspace/goodiebag/commit/e0195ba))
- improve pre-commit formatting feedback and logic ([a466265](https://github.com/deepbrainspace/goodiebag/commit/a466265))
- auto-stage formatting changes in pre-commit hook ([836fbc0](https://github.com/deepbrainspace/goodiebag/commit/836fbc0))
- format fixes ([933fb49](https://github.com/deepbrainspace/goodiebag/commit/933fb49))
- **release:** extract version from merge commit message instead of files ([f8de754](https://github.com/deepbrainspace/goodiebag/commit/f8de754))
- replace deprecated actions-rs/toolchain with dtolnay/rust-toolchain ([15c20eb](https://github.com/deepbrainspace/goodiebag/commit/15c20eb))
- use nrwl/nx-set-shas@v4.3.0 to eliminate set-output warnings ([4bba22d](https://github.com/deepbrainspace/goodiebag/commit/4bba22d))
- correct nrwl/nx-set-shas version to v4 (latest available) ([e7b8704](https://github.com/deepbrainspace/goodiebag/commit/e7b8704))
- update GitHub Actions to eliminate deprecation warnings ([58bc2fb](https://github.com/deepbrainspace/goodiebag/commit/58bc2fb))
- **workflow:** prevent Prepare workflow from running on release PR merges ([2c7f5e7](https://github.com/deepbrainspace/goodiebag/commit/2c7f5e7))
- remove hardcoded package name and use dynamic changelog path detection ([67789a6](https://github.com/deepbrainspace/goodiebag/commit/67789a6))
- use changelog file for version extraction instead of package.json ([32bc9db](https://github.com/deepbrainspace/goodiebag/commit/32bc9db))
- improve prepare workflow parsing and enhance secret detection ([#40](https://github.com/deepbrainspace/goodiebag/pull/40))
- remove post-merge hook to avoid unexpected file modifications ([a7f8a27](https://github.com/deepbrainspace/goodiebag/commit/a7f8a27))
- remove deprecated husky script header for v10 compatibility ([8bb8f53](https://github.com/deepbrainspace/goodiebag/commit/8bb8f53))
- remove --yes flag from nx release command when using --skip-publish ([7005cef](https://github.com/deepbrainspace/goodiebag/commit/7005cef))
- handle manual package input parameter in detect-affected action ([01811b9](https://github.com/deepbrainspace/goodiebag/commit/01811b9))
- correct release workflow trigger to use pull_request events ([ff3f1ce](https://github.com/deepbrainspace/goodiebag/commit/ff3f1ce))
- resolve release workflow dist/ artifact sharing issues ([#35](https://github.com/deepbrainspace/goodiebag/pull/35))
- resolve NX release cross-dependency issues ([a12a307](https://github.com/deepbrainspace/goodiebag/commit/a12a307))
- correct matrix strategy syntax in release workflow ([b425ede](https://github.com/deepbrainspace/goodiebag/commit/b425ede))

### 🔥 Performance

- optimize GitHub Actions cache usage with split caches and 1-day artifact retention ([3357343](https://github.com/deepbrainspace/goodiebag/commit/3357343))

### ❤️ Thank You

- DeepBrain
- nayeem.ai @wizardsupreme
- wizard supreme @wizardsupreme

# Changelog

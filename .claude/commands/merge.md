# merge Command

- add the following to the TODO and proceed:
- check if the current code has a diff, if so do the `commitpr` step first.
- **only upon successful finish** of `commitpr` step proceed further with the following steps.
- if the build did not pass:
  - ask the user if we should fix the build or an explanation of why we are merging on a failed build.
  - add this explanation as a comment on the PR.
- if you are proceeding with the merge ensure
  - you do a 'squash merge'
  - update the merge commit message by shortening the default message and making a concise and comprehensive message that covers the final change of the PR.
- once the PR is merged:
  - confirm the user the merge status,
  - delete the branch at git,
  - locally switch to the main branch
  - pull in the new main branch
  - check the updated content is showing
  - confirm the user a summary of your actions.
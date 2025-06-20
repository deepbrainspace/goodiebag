# merge Command

- check if the current code is committed and a PR is raised. If not then run the `commitpr` command, no need to ask for confirmation.
- if the build did not pass ask the user if we should fix the build or an explanation of why we are merging on a failed build.
- if you are proceeding with the merge ensure you do a 'squash merge' and update the merge commit message by shortening the default message and making a concise and comprehensive message that covers the final change of the PR.
- once the PR is merged, confirm the user the merge status, delete the branch at git, then locally switch to the main branch and pull in the new main branch, check the updated content is showing and confirm the user a summary of your actions.
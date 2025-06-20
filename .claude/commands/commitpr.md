# CommitPR Command

- run `commit` claude code command if there is still git diff.
- if there is no pr raised with this branch then create one otherwse update the PR that has a relevant PR message covering the difference with the main branch. Ensure the message is comprehensive.
- Monitor the CI build of the PR once its raised / updated.
- If there are errors create a plan of how it can be fixed and present to the user.

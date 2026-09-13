# Website workflow

GitHub Pages publishes the repository root on `main` at https://calissa.ai/.
Pushing a feature branch alone does not update the live website.

After each completed user-requested website change, run the appropriate checks,
commit the change, and push it to `origin/main`. The user has requested this
as the default workflow. If you work on a feature branch, integrate the verified
change into `main` before pushing. Preserve unrelated remote changes.

Check that the Pages deployment succeeds for the pushed commit and verify the
updated content on the public website before reporting that the change is live.

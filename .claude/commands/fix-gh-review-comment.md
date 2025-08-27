# Claude Code command to address GitHub PR review comments
Please analyze and fix the GitHub PR review comments: $ARGUMENTS.

Follow these steps:

1. Use `gh pr view` to get the PR details and review comments
2. Use `gh pr diff` to see the current changes in the PR
3. Understand the feedback and requested changes from reviewers
4. Search the codebase for relevant files mentioned in comments
5. Implement the necessary changes to address each review comment
6. Write and run tests to verify the fixes work correctly
7. Ensure code passes linting and type checking
8. Create a descriptive commit message referencing the review feedback
9. Push the changes to update the existing PR
10. Use `gh pr comment` to respond to reviewers acknowledging the changes

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks and reference specific review comments when making changes.
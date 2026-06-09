---
emoji: 📚
description: Automatically sync documentation for copilotWebRelay code changes
on:
  push:
    paths:
      - '2.copilotWebRelay/**'
      - '!2.copilotWebRelay/docs/**'
permissions:
  contents: read
  pull-requests: read
  issues: read
tools:
  github:
    mode: gh-proxy
    toolsets: [default]
  edit: true
safe-outputs:
  create-pull-request:
    allowed-files:
      - '2.copilotWebRelay/docs/**'
---

# Sync copilotWebRelay Documentation

## Task

When code in `2.copilotWebRelay/` is updated (excluding doc changes), analyze the changes and automatically update the documentation in `2.copilotWebRelay/docs/` to keep source code and documentation in sync.

Steps:
1. Get the list of changed files in `2.copilotWebRelay/` (excluding docs)
2. Read the changed source files to understand the modifications
3. Review the existing documentation in `2.copilotWebRelay/docs/`
4. Determine what documentation needs to be updated or created
5. Update or create documentation files to reflect the source code changes
6. If documentation changes are needed, create a pull request with:
   - Title: `docs: sync copilotWebRelay documentation`
   - Description: Brief summary of what was updated
   - Target branch: current branch
   - Source files: updated documentation files in `2.copilotWebRelay/docs/`
7. If no documentation changes are needed, call `noop` with explanation

## Important

- Only update documentation; do not modify source code
- Keep documentation accurate and up-to-date with source code
- Use clear, professional documentation style in Japanese
- If `2.copilotWebRelay/docs/` doesn't exist, create it
- Format: Use Markdown for documentation files

## Safe Outputs

- Use `create-pull-request` only when documentation updates are needed
- Use `noop` when documentation is already in sync

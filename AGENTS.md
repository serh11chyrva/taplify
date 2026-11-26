<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Workflow

### Language

Use English for all new or updated repository text, including UI copy, error messages, code comments, documentation, and commit messages. Use the user's language in chat.

### Commits and Pushes

Split large tasks into several self-contained changes and commit each as soon as it is complete. Use a single commit for a small task. Follow Conventional Commits with `type(scope): description` or `type: description`. Write a short description in English using the imperative mood.

Commit only changes that belong to the task. Preserve unrelated changes, including changes the user has already staged. Keep `.env.local`, real tokens, keys, and other secrets out of commits.

When the task is complete on local `main`, compare the branch with the latest `origin/main` and verify that all outgoing commits belong to the task. Immediately send them together in one regular push to `origin/main`. If you are on another branch, keep the commits on that branch and report where they are. If local `main` is behind or has diverged from `origin/main`, the push would include unrelated commits, or the remote rejects the push, keep the task's commits locally and report the reason.

### Checks

Run local builds, tests, lint, and type checks only when the user explicitly requests them. Use code review and Git checks such as `git diff --check` for verification by default. Add or update tests when the task or repository requires them or when they cover a specific regression risk. GitHub Actions runs automatically on push.

# Contributing to meonode-ui

First off — thank you for considering contributing to meonode-ui! Your help improves the project for everyone. This
document describes how to report issues, propose changes, and contribute code in a way that keeps the project healthy
and easy to maintain.

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [How can I contribute?](#how-can-i-contribute)
    - [Reporting bugs](#reporting-bugs)
    - [Suggesting enhancements](#suggesting-enhancements)
    - [Discussing ideas](#discussing-ideas)
- [Development setup](#development-setup)
- [Making changes (Pull Requests)](#making-changes-pull-requests)
    - [Branching and commit messages](#branching-and-commit-messages)
    - [Tests and linting](#tests-and-linting)
    - [PR checklist](#pr-checklist)
- [Style guide](#style-guide)
- [Releasing & changelog](#releasing--changelog)
- [Getting help / contact](#getting-help--contact)

---

## Code of Conduct

This project follows a [Code of Conduct]. Please be respectful and kind. If you encounter unacceptable behavior, report
it to the maintainers.

[Code of Conduct]: https://www.contributor-covenant.org/version/2/0/code_of_conduct/

---

## How can I contribute?

Contributions are welcome in many forms: filing issues, suggesting features, improving documentation, or sending code
changes.

### Reporting bugs

When reporting a bug, please include:

- A short, descriptive title.
- A clear description of the problem and expected behavior.
- Steps to reproduce the issue (minimal reproduction preferred).
- Environment details: Node.js version, Bun (or npm), OS.
- If applicable, a small code sample or link to a minimal repository that reproduces the issue.
- Any error messages or stack traces.

Example issue template (you can copy/paste):

Title: "Button: style props not applied when using as()"

Body:

- Steps to reproduce:
    1. Create a Button with prop `color: "red"`.
    2. Observe styles not applied.
- Expected behavior: Color prop should apply to the rendered element.
- Environment: Node 22.17.1, Bun latest stable, macOS 26

### Suggesting enhancements

Feature requests are welcome. Please open an issue with:

- The problem you're trying to solve,
- Why the current behavior is insufficient,
- Example API you'd like to see,
- Any backward compatibility concerns.

### Discussing ideas

For larger design discussions or proposals, opening a GitHub Discussion or drafting a proposal in the issue tracker
helps get feedback before investing implementation time.

---

## Development setup

Prerequisites

- Node.js (LTS recommended; >= 22)
- Bun (since the repository uses bun.lock), or use npm if you prefer.

Quick start

```bash
# clone
git clone https://github.com/l7aromeo/meonode-ui.git
cd meonode-ui

# install dependencies
bun install

# build the project
bun run build

# run tests
bun run test

# lint and format
bun run lint
```

Notes

- Husky hooks may run on commit (pre-commit / pre-push). If you need to bypass hooks: `git commit --no-verify` (use
  sparingly).
- The repository includes a prepublish script; if you plan to test publishing locally, inspect `prepublish.sh` before
  running it.

---

## Making changes (Pull Requests)

1. Fork the repository, clone your fork, and create a branch with a descriptive name:
    - feature/my-new-component
    - fix/button-prop-pass-through

2. Keep changes focused and small; one purpose per PR.

3. Rebase or merge `main` regularly to keep your branch up to date.

### Branching and commit messages

- Use clear, present-tense commit messages.
- Prefer Conventional Commits style for easier changelog generation:
    - feat(scope): add new public API
    - fix(scope): fix bug in prop forwarding
    - docs: update README examples
    - chore: update deps, build tweaks
- Squash or tidy up WIP commits before final PR if possible.

### Tests and linting

- Add tests for new behavior or bug fixes. Unit tests use Vitest.
- Run test suite locally: `bun run test`
- Run lint: `bun run lint`
- Ensure types compile: `bun run build`

### PR checklist

Before requesting a review, ensure:

- [ ] The change is covered by tests (or a clear explanation why not).
- [ ] Linting passes and code formatted.
- [ ] TypeScript types are correct and compile.
- [ ] The PR description explains the rationale and any backward compatibility impacts.
- [ ] Update docs/README if public APIs changed.
- [ ] Use conventional commit format for user-facing changes (release notes are auto-generated).

---

## Style guide

- This project uses TypeScript; prefer explicit types in public APIs.
- Follow existing patterns for component composition and prop styling.
- Use the project's ESLint and Prettier configuration (present in the repo).
- Keep default exports to a minimum; prefer named exports for clarity.

---

## Releasing & changelog

Releases follow semantic versioning via `semantic-release`, triggered on pushes to `main`, `beta`, or `alpha` branches.
Release notes are auto-generated from conventional commit messages and published to
[GitHub Releases](https://github.com/l7aromeo/meonode-ui/releases).

If you contribute a user-facing change, use [Conventional Commits](#branching-and-commit-messages) format — the release
notes will include your change automatically.

---

## Getting help / contact

If you need help:

- Open an issue describing the problem and steps you took.
- Start a discussion for design-level questions.

Maintainers: @l7aromeo

---

Thank you for helping make meonode-ui better!

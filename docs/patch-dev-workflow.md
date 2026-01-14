---
description: Patch version development workflow for minor releases
---

# Patch Development Workflow

This command guides the patch version development process from start to release.

## Workflow Overview

1. **Start**: Create draft changelog and development branch
2. **Develop**: Record changes in draft changelog as you work
3. **Review**: Final review of all changes before release
4. **Release**: Update version, CHANGELOG, and squash merge to main

---

## Phase 1: Start Development

When starting a new patch version (e.g., v1.0.5):

```bash
# Create development branch
git checkout -b dev/1.0.5

# Create draft changelog
touch _bmad-output/changelogs/v1.0.5-draft.md
```

Initialize the draft changelog with this template:

```markdown
# v1.0.5 Draft Changelog

**Status**: In Progress
**Started**: YYYY-MM-DD

---

## Bug Fixes

- [ ] **Issue title**
  - Description of the fix
  - Files: `path/to/file.ts`

## Enhancements

- [ ] **Feature title**
  - Description of the enhancement
  - Files: `path/to/file.ts`

## Breaking Changes

- None

---

## Release Checklist

- [ ] All tests passing
- [ ] Build successful
- [ ] Version bump in package.json
- [ ] CHANGELOG.md updated
- [ ] Squash merged to main
```

---

## Phase 2: During Development

### Commit frequently to dev branch

Each logical change should be committed separately:

```bash
# After completing a bug fix
git add .
git commit -m "fix: description of the fix"

# After completing a feature
git add .
git commit -m "feat: description of the feature"

# After refactoring
git add .
git commit -m "refactor: description of the change"
```

**Commit message prefixes:**
- `fix:` - Bug fixes
- `feat:` - New features
- `refactor:` - Code refactoring (no behavior change)
- `test:` - Adding or updating tests
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

### Update draft changelog

As you commit changes, update the draft changelog:

1. **Mark completed items** with `[x]`
2. **Add new items** as they are implemented
3. **Record file changes** for each item
4. **Note any breaking changes**

Example entry:
```markdown
- [x] **Toast notification system**
  - Reusable toast component and store
  - Files: `src/stores/useToastStore.ts`, `src/components/ui/Toast.tsx`
```

### Example commit history

A typical dev branch might have commits like:
```
d61904c v1.0.4: triplet subdivision support and URL compatibility fix
112e89e refactor: improve subdivision encoding code quality
8add46b fix: maintain v1.0.2 pattern URL compatibility
```

---

## Phase 3: Pre-Release Review

Before releasing, verify:

1. **All tests pass**: `npm test`
2. **Build succeeds**: `npm run build`
3. **Draft changelog is complete**: All items marked `[x]`
4. **No uncommitted changes**: `git status` is clean

---

## Phase 4: Release

### 4.1 Update package.json version

```json
{
  "version": "1.0.5"
}
```

### 4.2 Update CHANGELOG.md

Write **user-facing changes only**. Exclude:
- Internal refactoring
- Test additions
- Code documentation changes
- Variable renaming

Include:
- New features users can use
- Bug fixes users experienced
- Breaking changes
- Notable performance improvements

Example:
```markdown
## [1.0.5] - YYYY-MM-DD

### Added
- Feature description (user perspective)

### Fixed
- Bug fix description (user perspective)

### Changed
- Behavior change description (user perspective)
```

### 4.3 Commit and merge

```bash
# Commit version bump and changelog
git add package.json CHANGELOG.md
git commit -m "v1.0.5: brief description"

# Squash merge to main
git checkout main
git merge --squash dev/1.0.5
git commit -m "v1.0.5: brief description"

# Tag release
git tag v1.0.5
git push origin main --tags

# Clean up
git branch -d dev/1.0.5
```

---

## File Locations

| File | Purpose |
|------|---------|
| `_bmad-output/changelogs/vX.X.X-draft.md` | Development changelog (detailed, developer-facing) |
| `CHANGELOG.md` | Release changelog (concise, user-facing) |
| `package.json` | Version number |

---

## Changelog Writing Guidelines

### Draft Changelog (Developer-facing)
- Include all changes: refactoring, tests, docs
- Reference specific files changed
- Use checkboxes to track progress
- Written in Korean or English (internal use)

### Release CHANGELOG (User-facing)
- Only user-visible changes
- No internal implementation details
- Follow [Keep a Changelog](https://keepachangelog.com) format
- Written in English (public facing)

# Phase 4: Release

## Step 1: Version Bump

Update `package.json` version field to `{version}`.

## Step 2: Update CHANGELOG.md

Read the current `CHANGELOG.md` and add a new entry at the top (below the header).

### CHANGELOG rules:
- **User-facing changes only** - no internal refactoring, test additions, or code documentation
- Follow [Keep a Changelog](https://keepachangelog.com) format
- Written in **English**
- Use these sections as needed: `Added`, `Fixed`, `Changed`, `Removed`
- Describe changes from the **user's perspective**
- Add a comparison link at the bottom of the file

Example entry:
```markdown
## [1.0.5] - 2026-02-22

### Added
- Feature description (user perspective)

### Fixed
- Bug fix description (user perspective)

### Changed
- Behavior change description (user perspective)
```

Add the comparison link:
```markdown
[1.0.5]: https://github.com/{owner}/{repo}/compare/v{prev-version}...v{version}
```

## Step 3: Final Commit on Dev Branch

```bash
git add package.json CHANGELOG.md
git commit -m "v{version}: {brief description of release}"
```

## Step 4: Squash Merge to Main

```bash
git checkout main
git pull origin main
git merge --squash dev/{version}
git commit -m "v{version}: {brief description of release}"
```

## Step 5: Tag Release

```bash
git tag v{version}
```

## Step 6: Push

```bash
git push origin main --tags
```

## Step 7: Clean Up

```bash
git branch -d dev/{version}
```

## Step 8: Completion Report

Present to the user:

```
## Release v{version} Complete

- Squash merged to main
- Tagged: v{version}
- Pushed to origin
- Dev branch cleaned up

Release URL: https://github.com/{owner}/{repo}/releases/tag/v{version}
```

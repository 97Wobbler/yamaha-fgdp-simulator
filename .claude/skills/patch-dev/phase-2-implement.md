# Phase 2: Branch Creation, Implementation & Testing

## Step 1: Create Development Branch

```bash
git checkout -b dev/{version}
```

If the branch already exists (e.g., resuming work), check it out instead:
```bash
git checkout dev/{version}
```

## Step 2: Create Draft Changelog

Create `docs/drafts/v{version}-draft.md` using the template at [templates/draft-changelog.md](templates/draft-changelog.md).

- Replace `{version}` with the actual version number
- Replace `YYYY-MM-DD` with today's date
- Create the `docs/drafts/` directory if it doesn't exist

## Step 3: Implement Changes

Follow the approved implementation plan from Phase 1. For each change:

1. **Implement** the change
2. **Test** it works (run relevant tests or manual verification)
3. **Commit** with a conventional commit message:
   - `fix: description` - Bug fixes
   - `feat: description` - New features
   - `refactor: description` - Code refactoring (no behavior change)
   - `test: description` - Adding or updating tests
   - `docs: description` - Documentation changes
   - `chore: description` - Maintenance tasks
4. **Update draft changelog** - Mark the item as `[x]` and record files changed

## Step 4: Verify Build & Tests

After all changes are implemented:

```bash
npm test
npm run build
```

- If tests fail, fix the issues and commit the fixes
- If build fails, fix the issues and commit the fixes
- Repeat until both pass cleanly

## Step 5: Final Draft Changelog Update

Ensure every implemented item is marked `[x]` in the draft changelog with accurate file references.

## Commit Guidelines

- **One logical change per commit** - don't mix unrelated changes
- **Use imperative mood** in commit messages: "fix audio latency" not "fixed audio latency"
- **Stage specific files** rather than `git add .` when possible
- **Never commit** `.env`, credentials, or other sensitive files

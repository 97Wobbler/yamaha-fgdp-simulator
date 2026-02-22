---
name: patch-dev
description: Patch version development - from requirements to release in a single linear workflow
disable-model-invocation: true
argument-hint: [version] [requirements-file]
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, Task, AskUserQuestion, EnterPlanMode, ExitPlanMode
---

# Patch Development Workflow

You are executing a **linear patch development workflow**. A single invocation drives the entire process from requirements analysis to release. Minimize user interaction - only pause for plan approval and final merge confirmation.

## Arguments

- `$0` - Version number (e.g., `1.0.5`)
- `$1` - Path to requirements file (e.g., `docs/requirements-v1.0.5.md`)

## Workflow

Execute these phases **sequentially**. Read the corresponding phase file before starting each phase.

### Phase 1: Plan

Read [phase-1-plan.md](phase-1-plan.md) and follow its instructions.

**Input**: Requirements file at `$1`
**Output**: Implementation plan presented to user for approval
**User interaction**: Clarifying questions (only if truly ambiguous), then plan approval

### Phase 2: Implement

Read [phase-2-implement.md](phase-2-implement.md) and follow its instructions.

**Input**: Approved plan from Phase 1
**Output**: Working code on `dev/$0` branch, all tests passing, build succeeding
**User interaction**: None

### Phase 3: Review

Read [phase-3-review.md](phase-3-review.md) and follow its instructions.

**Input**: Completed implementation on `dev/$0` branch
**Output**: Review-approved code with all issues resolved
**User interaction**: None (auto-fix and re-review loop)

After review passes, present the user with a summary of all changes and ask:
> "All changes are implemented and reviewed. Please verify the functionality, then confirm to proceed with merge and release."

Wait for user confirmation before proceeding.

### Phase 4: Release

Read [phase-4-release.md](phase-4-release.md) and follow its instructions.

**Input**: User confirmation to proceed
**Output**: Squash-merged to main, tagged, pushed

## Key Rules

1. **Always read the phase file** before starting that phase - it contains detailed instructions
2. **Minimize user interaction** - only ask when genuinely ambiguous, and batch questions
3. **Commit frequently** during Phase 2 with conventional commit prefixes
4. **Draft changelog** goes in `docs/drafts/v$0-draft.md`
5. **Release CHANGELOG** is user-facing only - no internal implementation details
6. **Never force push** or run destructive git operations without explicit user consent

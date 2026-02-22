# Phase 3: Code Review via Subagent

## Step 1: Prepare Review Context

Gather the full diff of changes for review:

```bash
git diff main...HEAD
```

Also collect the list of changed files:

```bash
git diff main...HEAD --name-only
```

## Step 2: Launch Code Review Subagent

Use the Task tool to spawn a code review subagent with the following configuration:

- **subagent_type**: `feature-dev:code-reviewer`
- **Provide the subagent with**:
  - The full diff (from `git diff main...HEAD`)
  - The list of changed files
  - The requirements file content
  - The implementation plan from Phase 1

**Review prompt for the subagent:**

```
You are a senior code reviewer for a TypeScript/React web application (Yamaha FGDP Simulator).

Review the following changes against the requirements and check for:

1. **Correctness**: Does the code correctly implement the requirements?
2. **Bugs**: Are there logic errors, off-by-one errors, race conditions?
3. **Security**: XSS, injection, unsafe operations?
4. **Code quality**: Readability, naming, consistency with existing patterns?
5. **Performance**: Unnecessary re-renders, expensive operations, memory leaks?
6. **Edge cases**: Missing null checks, boundary conditions, error handling?

For each issue found, report:
- **Severity**: critical / warning / suggestion
- **File and line**: Where the issue is
- **Description**: What the problem is
- **Fix**: How to fix it

If no issues are found, explicitly state the code passes review.
```

## Step 3: Process Review Results

Based on the review results:

### If critical or warning issues found:
1. Fix each issue in the codebase
2. Commit fixes: `fix: address review feedback - {brief description}`
3. Update draft changelog if the fix changes behavior
4. Re-run tests and build to verify nothing broke
5. **Re-launch the review subagent** on the updated diff
6. Repeat until review passes

### If only suggestions found:
- Apply suggestions that improve code quality without over-engineering
- Skip suggestions that add unnecessary complexity
- Commit applied suggestions: `refactor: apply review suggestions`

### If review passes clean:
- Proceed to user confirmation (back in SKILL.md flow)

## Step 4: Present Summary to User

After review passes, present:

```
## Changes Summary for v{version}

### Implemented
- [List each requirement and how it was implemented]

### Files Changed
- [List of modified/created files with brief descriptions]

### Review Status
- Code review: Passed
- Tests: Passing
- Build: Successful

Please verify the functionality, then confirm to proceed with merge and release.
```

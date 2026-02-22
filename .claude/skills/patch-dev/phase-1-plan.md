# Phase 1: Requirements Analysis & Implementation Plan

## Step 1: Read Requirements

Read the requirements file provided by the user. Understand every item thoroughly.

## Step 2: Explore Codebase

Investigate the current codebase to understand:

- **Architecture**: Key directories, component structure, state management patterns
- **Affected files**: Which files need modification for each requirement
- **Existing patterns**: How similar features were previously implemented
- **Dependencies**: What existing code the changes depend on

Use Glob, Grep, and Read tools to explore. Focus on understanding the impact radius of each requirement.

## Step 3: Clarify Ambiguities (only if necessary)

If any requirement is genuinely ambiguous (not just complex), ask the user using AskUserQuestion. Rules:

- **Batch all questions** into a single AskUserQuestion call
- **Provide options** when possible rather than open-ended questions
- **Skip this step** entirely if requirements are clear
- **Do NOT ask** about implementation details you can decide yourself

## Step 4: Create Implementation Plan

Present a structured plan to the user:

```
## Implementation Plan for v{version}

### Changes Overview
For each requirement:
1. **[Requirement title]**
   - Approach: How you will implement it
   - Files to modify: List of files
   - Files to create: List of new files (if any)
   - Risk: Low/Medium/High

### Execution Order
Numbered list of implementation steps in dependency order.

### Test Strategy
How you will verify each change works correctly.
```

Use EnterPlanMode to present the plan. Wait for user approval via ExitPlanMode before proceeding to Phase 2.

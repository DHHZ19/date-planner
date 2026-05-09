---
name: session-summary
description: Summarizes a coding session into a continuation-ready context document covering decisions, generated code, conventions, open items, and optionally a diff summary. Use when the user asks to summarize the session, create handoff context, prepare to continue in a new session, recap work, or capture what changed.
compatibility: opencode
metadata:
  audience: engineering
  workflow: handoff
---

# Session Summary

## What I Do

- Produce a context document that lets a future LLM agent continue the work with minimal re-discovery.
- Capture decisions made, code generated or changed, conventions established, verification run, and remaining open items.
- Include a concise diff summary when it adds useful context.
- Decide whether to inspect git state directly or ask the user first based on session length, available context, and risk.

## When To Use Me

Use this when the user asks for a session summary, handoff document, recap, continuation context, or anything like: "summarize everything we decided", "continue this in a new session", "what changed", or "make a context doc".

## Workflow

1. Review the conversation context first.
2. If code was changed and the summary needs accuracy, inspect git state with non-destructive commands such as `git status --short` and `git diff --stat`.
3. Include `git diff` details when useful, especially for multi-file changes, generated code, refactors, or subtle behavior changes.
4. For short sessions with obvious changes, summarize from context without asking unless git state is ambiguous.
5. Ask one short clarification before inspecting or including diff details when the user asks for a purely conversational recap, when the worktree likely contains unrelated user changes, or when including a diff may expose sensitive content.
6. Never modify files, format code, commit changes, or run the app while summarizing unless explicitly requested.

## Diff Judgment

Include a diff section when:

- The session produced code edits.
- Multiple files changed.
- The future agent needs to understand implementation details.
- The user specifically asks what changed.
- The conversation context is insufficient to know the exact file-level changes.

Ask before adding diff details when:

- The session was mostly planning or discussion.
- The user asks for a brief summary.
- The repo has unrelated dirty changes that could confuse the handoff.
- The diff may include secrets, credentials, or private content.

Skip the diff section when:

- No code was changed.
- The user explicitly asks for a decision-only summary.
- The summary would be clearer without low-level file noise.

## Output Format

Use this structure by default:

```md
# Session Context

## Goal

[What the session was trying to accomplish.]

## Decisions

- [Decision and rationale.]

## Code Generated Or Changed

- `[path]`: [What changed and why.]

## Conventions Established

- [Naming, architecture, style, testing, UX, or process convention established in the session.]

## Diff Summary

- [Small file-level or area-level summary of changed behavior.]

## Verification

- [Commands run and results.]
- [Commands not run and why.]

## Open Items

- [Remaining question, follow-up task, risk, or incomplete work.]

## Continuation Notes

- [Specific guidance for the next agent, including where to start and what not to redo.]
```

## Style

- Be factual and specific.
- Prefer file paths, function names, route names, command names, and exact decisions over vague descriptions.
- Mark uncertainty explicitly instead of inventing details.
- Keep the document concise enough to paste into a new session.
- Do not include irrelevant transcript detail, pleasantries, or hidden chain-of-thought.

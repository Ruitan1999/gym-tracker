---
description: Replace the agent team's goal, reset plan state, and engage the PM subagent for iteration 1
argument-hint: <new goal description>
---

The user wants to give the agent team a new goal: **$ARGUMENTS**

## Step 1 — Prep state

Do these file operations without asking for confirmation:

1. If `.agent/done.md` exists, delete it.
2. If `.agent/blockers.md` exists, delete it.
3. Overwrite `.agent/goal.md` with the new goal. Structure it: `# Goal`, `## Core features`, `## Constraints`, `## Out of scope`. Infer reasonable constraints/scope from the text; keep it concise — the architect fleshes it out.
4. Delete `.agent/plan.md` and `.agent/state.json` so the PM replans. Keep `.agent/log.md` for history.

## Step 2 — Engage the project-manager subagent

Use the **Task tool** with `subagent_type: "project-manager"` to run iteration 1. Pass this prompt to it:

> Run one iteration of the project manager Ralph loop. Working directory is the repo root. State lives in `.agent/` — `goal.md` has just been rewritten by the user; `plan.md` and `state.json` have been cleared so this is a bootstrap iteration. Follow your prompt strictly: read goal, delegate ONE task (typically to the architect for initial decomposition), write state, exit. Do not write code. Report what you did in 2–3 lines.

## Step 3 — Report back

In 3–5 lines tell the user:
- The new goal (one sentence)
- What the PM did this iteration (read from its return + `.agent/log.md`)
- Next step: run `/new-goal` again won't continue — to keep going, either invoke the PM subagent directly (`Run one iteration of the project manager loop`) or start the bash autopilot in a terminal:
  ```bash
  while [ ! -f .agent/done.md ] && [ ! -f .agent/blockers.md ]; do
    claude -p "Run one iteration of the project manager loop." \
      --allowed-tools "Read,Write,Edit,Bash,Task"
    sleep 2
  done
  ```

If the `project-manager` subagent isn't found (e.g. Claude Code hasn't registered it yet after a recent install), tell the user to restart Claude Code once — the slash command can't invoke a subagent that isn't loaded.

---
description: Append a change request to the goal and engage the PM subagent for the next iteration
argument-hint: <what to add or change>
---

The user wants to add a change request: **$ARGUMENTS**

## Step 1 — Prep state

1. If `.agent/done.md` exists, delete it.
2. If `.agent/blockers.md` exists, delete it.
3. Append a new section to `.agent/goal.md` (do NOT overwrite). Use today's date:

   ```
   ## Change request (YYYY-MM-DD)
   <the request>
   ```

4. Do NOT delete `plan.md` or `state.json` — the PM will plan only the delta.

## Step 2 — Engage the project-manager subagent

Use the **Task tool** with `subagent_type: "project-manager"` and this prompt:

> Run one iteration of the project manager Ralph loop. A new change request has just been appended to `.agent/goal.md`. Existing `plan.md` and `state.json` are intact. Re-read the goal, decide whether the plan needs new tasks to cover the change, update `state.json` accordingly, and perform one atomic action (typically: add the new tasks, then delegate one of them — or delegate an in-flight task if the change doesn't block it). Report in 2–3 lines.

## Step 3 — Report back

Tell the user in 3–5 lines: what was appended, what the PM did, and how to continue (invoke PM again or start the bash autopilot).

If the `project-manager` subagent isn't registered, tell the user to restart Claude Code once.

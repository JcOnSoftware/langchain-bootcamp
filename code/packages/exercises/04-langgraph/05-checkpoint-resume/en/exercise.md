# 05 · Checkpoint + resume: interrupt, inspect, Command({resume})

## Goal

Practice the full pause/inspect/resume cycle with a 3-step graph and a `MemorySaver`. No LLM — this is pure plumbing, to isolate the mechanics.

## Context

This is the production pattern for any workflow with human-in-the-loop or manual approvals:

1. The graph runs until a node calls `interrupt(...)`.
2. The checkpointer (`MemorySaver`, Postgres, Redis, whatever you use in prod) persists partial state indexed by `thread_id`.
3. Your code queries state via `graph.getState({ configurable: { thread_id } })` — you get `.next` (pending nodes), `.values` (current state), `.tasks[*].interrupts` (interrupt info).
4. The human responds (UI, Slack, email, whatever).
5. Your code invokes again with `graph.invoke(new Command({ resume: <human_value> }), thread)` — the graph RESUMES from the same node, and the `interrupt(...)` returns `<human_value>`.

## CRITICAL WARNING

**Never wrap `graph.invoke` in `try/catch`.** `GraphInterrupt` propagates via exception; catching it silences the checkpoint. This exercise shows it explicitly — see the solution comments.

## What to complete

Open `starter.ts`. Two TODOs:

1. **The 3 nodes**:
   - `step1_prepare`: `() => ({ prepared: true })`
   - `step2_pause`: `() => { const approval = interrupt({ question: "proceed?" }); return { approval: String(approval) }; }`
   - `step3_finalize`: `() => ({ finalized: true })`
2. **The graph**: add the 3 nodes + linear edges `START → step1 → step2 → step3 → END`. Compile with `{ checkpointer: new MemorySaver() }`.

Then in `run()`:

1. First `graph.invoke({}, thread)` → the graph runs until `step2_pause`, throws `interrupt`, and **halts**.
2. `const pre = await graph.getState(thread);` → `pre.next` should be `["step2_pause"]` or similar (the pending node).
3. Second `graph.invoke(new Command({ resume: "go" }), thread)` → the graph resumes. `interrupt(...)` in step2 returns `"go"`, which is stored in `approval`. Then runs `step3_finalize` and ends.
4. `const post = await graph.getState(thread);` → `post.next` empty, `post.values` carries all three final flags.

## How to verify

From `code/`:

```bash
lcdev verify 05-checkpoint-resume --solution   # no API key needed
lcdev run    05-checkpoint-resume --solution   # inspect the flow
```

## Success criteria

- Zero model calls.
- `preResumeNext.length >= 1` — graph is paused.
- `postResumeNext.length === 0` — completed after resume.
- `resumedWith === "go"` — the value passed via `Command({ resume })`.
- `final.prepared === true && final.approval === "go" && final.finalized === true`.

## Hint — `thread_id`

If you change `thread_id` between the first and second invoke, you lose state. They're separate sessions. Use the same string in both.

## Hint — `Command({ resume })`

`Command` is the mechanism to RESUME a paused execution. When you invoke with a `Command({ resume: X })`:

- LangGraph looks up the last checkpoint for that `thread_id`.
- Finds the node where `interrupt` was thrown.
- Resumes the node function from the `interrupt(...)` call — which now returns `X`.
- Continues with the remaining nodes.

# 03 · Subagents + human-in-the-loop (interrupt / resume)

## Goal

Combine two powerful LangGraph patterns: **graph composition** (a small graph as a node of another) and **HITL** (interrupt + Command to pause until a human responds).

## Context

A **subgraph** is compiled separately and passed as a node of the outer graph. State fields are shared **by key name**: if your outer state has `plan: Annotation<string>` and the subgraph also declares `plan`, updates flow between both.

An **interrupt** is LangGraph's HITL primitive. When you call `interrupt({ question: "..." })` inside a node, the graph:

1. Throws a special `GraphInterrupt` that propagates to the root.
2. The checkpointer (MemorySaver) saves partial state.
3. `invoke` returns — the graph is PAUSED.
4. You inspect with `graph.getState(thread)` and see `.next` with pending nodes.
5. When the human responds, you call `graph.invoke(new Command({ resume: "approved" }), thread)`.
6. The `resume` value becomes the return value of `interrupt(...)` — the paused node function continues from there.

## CRITICAL WARNING

**NEVER wrap `graph.invoke(...)` in `try/catch`.** `GraphInterrupt` uses the exception mechanism to propagate upward; catching it silences the pause and the checkpointer never persists anything. This is by design.

## What to complete

Open `starter.ts`. Three TODOs:

1. **Subgraph** — one node `buildPlan` that returns `{ plan: "Step 1: ... Step 2: ..." }`. `START → buildPlan → END`.
2. **`decideNode`** — calls `interrupt({ question })` to pause, and later returns `{ approval, result: "..." }` using the value from `resume`.
3. **Outer graph** — add the subgraph as a node (`addNode("planStage", subgraph)`) + `decideNode`. Edges: `START → planStage → decide → END`. Compile with `MemorySaver`.

Then in `run()`:

1. First invoke: `await graph.invoke({}, thread)` — should halt at `decide` due to the interrupt.
2. Inspect with `graph.getState(thread)` — `state.next` should have pending nodes.
3. Second invoke: `await graph.invoke(new Command({ resume: "approved" }), thread)` — completes the graph.

## How to verify

From `code/`:

```bash
lcdev verify 03-subagents-hitl --solution   # reference (no API key needed)
lcdev run    03-subagents-hitl --solution   # inspect final state
```

## Success criteria

- Zero model calls (this exercise is pure plumbing).
- `interrupted === true` (first invoke paused).
- `resumed === true` (second invoke completed the graph).
- `final.plan` non-empty, `final.approval === "approved"`, `final.result` non-empty.

## Hint — thread_id

`configurable.thread_id` is the KEY for persistence. Two invokes with the same `thread_id` share state; with different `thread_id`s they're independent sessions. Forgetting it throws.

## Hint — detecting an interrupt

The most portable way to detect the graph is paused:

```ts
const state = await graph.getState(thread);
const pausedNodes = Array.from(state.next ?? []);
// pausedNodes.length > 0 ⇒ graph has pending work
```

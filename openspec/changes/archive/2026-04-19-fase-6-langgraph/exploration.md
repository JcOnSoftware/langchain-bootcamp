# Exploration: fase-6-langgraph (5 exercises)

## Current State

- `@langchain/langgraph@1.2.9` is installed and heavily used in Fase 5. Fase 5 used `createReactAgent` (prebuilt); Fase 6 goes one layer deeper into raw `StateGraph`.
- All necessary APIs are in the root export: `StateGraph`, `Annotation`, `MessagesAnnotation`, `START`, `END`, `interrupt`, `Command`, `MemorySaver`, `messagesStateReducer`/`addMessages`, `getStore`, `task`, `entrypoint`.
- Harness (`BaseChatModel.prototype.invoke` patch) captures every chat-model invocation from graph nodes — confirmed by Fase 5's live-API smoke.
- No runner / CLI / dep changes expected.

## Affected Areas

- `code/packages/exercises/04-langgraph/{01..05}/` — 5 new exercise dirs (~30 files)
- `code/packages/runner/` — untouched
- `code/packages/exercises/package.json` — untouched
- `docs/EXERCISE-CONTRACT.md` — optional short §Graphs section (non-blocking)
- `openspec/specs/track-langgraph/spec.md` — new

## Approaches

### 1. Exercise Lineup

Locked per PLAN.md Fase 6:

| # | id | Focus | Key API |
|---|---|---|---|
| 1 | `01-state-graph-basics` | Two-node graph with typed state via `Annotation.Root`; manual `addNode` + `addEdge(START, "n1")` + `addEdge("n1", "n2")` + `addEdge("n2", END)`. No LLM. | `StateGraph`, `Annotation.Root`, `START`, `END` |
| 2 | `02-react-as-graph` | Reimplement a tool-using agent as an EXPLICIT graph (contrast with Fase 5's `createReactAgent` prebuilt). Two nodes: `agent` (model) + `tools` (ToolNode-equivalent); conditional edge routes to `tools` when `tool_calls` present. | `StateGraph<MessagesAnnotation>`, `addConditionalEdges`, custom tool-call dispatcher |
| 3 | `03-subagents-hitl` | A main graph calls a subgraph as a node (composition) and uses `interrupt()` to pause for "human approval" before taking a mutating action; resumes with `Command({ resume: "approved" })`. | `StateGraph.compile()` as subgraph node, `interrupt`, `Command`, `MemorySaver` |
| 4 | `04-event-streaming` | Invoke graph with `graph.streamEvents(input, { version: "v2" })` (or `graph.stream(..., { streamMode: ["values","updates"] })`) and collect events by type. | `graph.streamEvents` / `graph.stream` |
| 5 | `05-checkpoint-resume` | Graph with `MemorySaver` checkpointer; interrupt in middle of a 3-step flow; resume from checkpoint with different `thread_id` scenarios. | `MemorySaver`, `graph.getState`, `Command`, `thread_id` |

**Effort: High**. LangGraph exercises are denser than previous tracks — each has ~60-100 LoC of graph wiring beyond tool/prompt code. Also highest conceptual load for learners.

### 2. State Schema Style

Two ways to define state in LC 1.x JS:

- **A**: `Annotation.Root({...})` with per-key `Annotation<T>()` + optional reducers. Structural, canonical for LangGraph 1.x.
- **B**: Zod schema (`z.object(...)`) + `StateGraph<zodSchema>`. Newer but partial adoption.

**Decision**: A. `Annotation.Root` is what all LangGraph docs + examples use. Stick to it.

### 3. HITL (03-subagents-hitl)

Two sub-concerns:

- **Subagent composition**: compile a small graph, pass the compiled instance as a node in the outer graph. Demonstrates state-sharing across graph levels.
- **Interrupt + resume**: `interrupt({ question: "Approve?" })` throws `GraphInterrupt`; outer code catches via `isGraphInterrupt` OR `graph.getState(thread)` shows `tasks: [{ interrupts: [...] }]`. Resume with `graph.invoke(new Command({ resume: "approved" }), { configurable: { thread_id } })`.

The exercise shows BOTH in ONE flow: `main_graph` has 2 nodes — `plan` (subagent graph) then `execute` (uses `interrupt` before acting).

Gotcha: `interrupt` propagates via a special error class. Student MUST NOT wrap the graph invoke in `try/catch` — the runtime's checkpointer handles it. Document in the exercise.md.

**Decision**: explicit example with both subgraph-as-node AND interrupt/resume, invoked via two separate `.invoke()` calls against the same `thread_id`.

### 4. Event Streaming (04)

Two native APIs:

- `graph.stream(input, { streamMode })` — yields state snapshots or updates per step. Similar to Fase 5 exercise 05.
- `graph.streamEvents(input, { version: "v2" })` — yields typed events (`on_chain_start`, `on_chat_model_stream`, `on_tool_start`, etc.). Lower-level, more detail.

For pedagogical contrast with Fase 5 (which used `streamMode: "values"`), **use `streamEvents` here**. It's a distinct skill, and learners who've done 05 will see the difference between coarse snapshots and fine-grained events.

**Decision**: `graph.streamEvents(input, { version: "v2" })`. Collect events, count by type, return `{ eventTypes: Record<string, number>, totalEvents: number }`.

### 5. Checkpoint + Resume (05)

Simple 3-step graph (generate → pause → finalize). Checkpointer is `MemorySaver`. Flow:

1. `await graph.invoke(input, { configurable: { thread_id: "x" } })` — runs through `generate`, hits `interrupt()` at `pause`, graph halts.
2. Inspect state via `await graph.getState({ configurable: { thread_id: "x" } })` — shows pending interrupt + partial state.
3. Resume with `await graph.invoke(new Command({ resume: "go" }), { configurable: { thread_id: "x" } })` — runs `finalize`, returns final state.

Return `{ preResumeState, postResumeState, resumedWith: "go" }`.

**Decision**: yes, as above. Keep LLM out of exercise 05 — focus is purely on checkpoint semantics. Nodes can be deterministic state mutations.

### 6. Tool Dispatching in 02-react-as-graph

Two ways:

- Use `ToolNode` from `@langchain/langgraph/prebuilt` — canonical, 1 line.
- Hand-roll the tool dispatch in a node: iterate `state.messages.at(-1).tool_calls`, call tool fns, produce `ToolMessage[]`, return `{ messages: [...] }`.

**Decision**: hand-roll. The POINT of 02 is to see under the hood of `createReactAgent`. Using `ToolNode` would be cheating pedagogically.

### 7. Assertion Strategy

Each exercise's `tests.test.ts`:

- **01**: no LLM → `result.calls.length === 0`; assert `userReturn.final` has both node's contributions merged.
- **02**: LLM present → `result.calls.length >= 2` (decide + answer); `result.lastCall.response.tool_calls` populated at least once; `userReturn.messages` has ≥3 entries.
- **03**: first invoke interrupts → `userReturn.interrupted === true`; second invoke resumes → `userReturn.resumed === true` and `userReturn.final` is non-empty.
- **04**: `userReturn.eventTypes` has `"on_chat_model_start"` or `"on_chain_start"` with count ≥1; `userReturn.totalEvents >= 3`.
- **05**: `userReturn.preResumeState.next` (or `.tasks[0].interrupts`) has interrupt info; `userReturn.postResumeState` has next=[] (graph done); `resumedWith === "go"`.

No arg-value asserts; no text-content asserts. Shape-only (calls count, event counts, state keys presence).

## Risks

- **`interrupt()` + try/catch pitfall**: students may wrap graph invoke in `try { } catch { }` and swallow `GraphInterrupt`. Document prominently in 03 and 05 exercise.md.
- **`thread_id` requirement**: checkpointers only work with `configurable.thread_id`. Missing it throws. Tests assert thread_id presence in the state.
- **API drift between langgraph minor versions**: `Annotation.Root` + `StateGraph` + `interrupt` all stable since 1.0. If 1.3 lands mid-development, pin exact if anything breaks.
- **Graph nondeterminism for 02-react-as-graph**: same as Fase 5 agents — use `>=` lower-bound asserts on call counts.
- **`streamEvents` output volume**: large for even small graphs (30+ events for a single call). Tests cap count with `totalEvents >= 3` not an exact number.
- **Voseo drift**: rg guard unchanged.

## Recommendation

1. lineup as above (5 exercises, no LLM in 01 and 05; LLM in 02, 03, 04)
2. `Annotation.Root` for state schema
3. Hand-roll tool dispatch in 02 (pedagogical depth)
4. `streamEvents` in 04 (contrast with Fase 5's streamMode)
5. Explicit `interrupt` + `Command({ resume })` flow in 03 and 05
6. Shape-only asserts

## Ready for Proposal

**Yes**. Scope bounded, APIs confirmed, no deps, no runner changes. Next: `sdd-propose` with change-name `fase-6-langgraph`.

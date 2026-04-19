# Track LangGraph Specification

## Purpose

Defines the 5 exercises of track `04-langgraph` and their expected capture + state + event shapes.

## Requirements

### Requirement: Track Lineup

Track `04-langgraph` MUST contain exactly these 5 exercises in order:

| # | id | Focus |
|---|---|---|
| 1 | `01-state-graph-basics` | Two-node `StateGraph` with typed `Annotation.Root` state, manual edges, no LLM |
| 2 | `02-react-as-graph` | Explicit graph reimplementing `createReactAgent` (hand-rolled tool dispatch, NOT `ToolNode`) |
| 3 | `03-subagents-hitl` | Subgraph as node + `interrupt`/`Command({ resume })` with `MemorySaver` |
| 4 | `04-event-streaming` | `graph.streamEvents(input, { version: "v2" })` consumed + counted by type |
| 5 | `05-checkpoint-resume` | 3-step graph with `interrupt` + `MemorySaver`; `getState` inspection + `Command({ resume })`; no LLM |

#### Scenario: track listed with 5 entries

- GIVEN all 5 exercise directories exist with valid `meta.json`
- WHEN `lcdev list` runs
- THEN 5 entries under `04-langgraph` appear in both `--locale es` and `--locale en`

### Requirement: Exercise 01 — State Graph Basics

`01-state-graph-basics` MUST define a state schema via `Annotation.Root({...})` with at least 2 typed fields, build a `StateGraph`, add ≥2 nodes, wire `START → n1 → n2 → END`, compile, and `graph.invoke(initialState)`. Return `{ final: State, nodesVisited: string[] }`.

#### Scenario: no LLM calls; both nodes contribute to final state

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.calls.length === 0`
- AND `result.userReturn.final` is a non-null object with EVERY annotation key populated
- AND `result.userReturn.nodesVisited.length >= 2`

### Requirement: Exercise 02 — React As Graph

`02-react-as-graph` MUST build a `StateGraph` over `MessagesAnnotation` with two nodes — `agent` (calls the chat model) and `tools` (hand-rolled: iterates `state.messages.at(-1).tool_calls`, invokes tool functions, produces `ToolMessage[]`) — connected by a conditional edge that routes to `tools` when the last AI message has `tool_calls`. Invoke with a user question that forces tool use. Return `{ answer: string, messages: BaseMessage[] }`.

#### Scenario: graph performs ≥2 chat calls and routes through tool node

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 2`
- AND at least one captured call's `response.tool_calls.length >= 1`
- AND `result.userReturn.answer` is a non-empty string

### Requirement: Exercise 03 — Subagents + HITL

`03-subagents-hitl` MUST build a main `StateGraph` where one node is itself a compiled subgraph, and another node calls `interrupt({...})` to pause. The exercise invokes twice against the same `thread_id`: first invoke reaches the interrupt, second invoke resumes via `Command({ resume: <value> })`. Return `{ interrupted: boolean, resumed: boolean, final: unknown }`.

#### Scenario: first invoke interrupts, second invoke resumes

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.userReturn.interrupted === true`
- AND `result.userReturn.resumed === true`
- AND `result.userReturn.final` is truthy (graph completed after resume)

### Requirement: Exercise 04 — Event Streaming

`04-event-streaming` MUST invoke `graph.streamEvents(input, { version: "v2" })` and iterate the async iterable to completion, collecting events into a count-by-`event` map. Return `{ eventTypes: Record<string, number>, totalEvents: number }`.

#### Scenario: at least 3 distinct events observed, common types present

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.userReturn.totalEvents >= 3`
- AND `result.userReturn.eventTypes` has at least one key starting with `on_` (e.g., `on_chain_start`, `on_chat_model_start`, `on_chain_end`)

### Requirement: Exercise 05 — Checkpoint + Resume

`05-checkpoint-resume` MUST build a 3-step graph (no LLM required) compiled with `MemorySaver`. Steps: `step1_prepare → step2_pause (calls interrupt) → step3_finalize`. First invoke with `{ configurable: { thread_id: "t" } }` hits interrupt. `graph.getState({ configurable: { thread_id: "t" } })` shows pending interrupt. Second invoke with `Command({ resume: "go" })` completes. Return `{ preResumeNext: string[], postResumeNext: string[], resumedWith: "go", final: State }`.

#### Scenario: state inspection shows pause, resume completes the graph

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.calls.length === 0` (no LLM)
- AND `result.userReturn.preResumeNext.length >= 1` (graph is paused — next steps pending)
- AND `result.userReturn.postResumeNext.length === 0` (graph is done after resume)
- AND `result.userReturn.resumedWith === "go"`

### Requirement: Graph-Interrupt Safety

Every `starter.ts` and `solution.ts` that uses `interrupt()` or invokes a graph with a checkpointer MUST NOT wrap the graph invocation in a `try/catch` block. `GraphInterrupt` propagates by design; wrapping it silences the pause mechanism.

#### Scenario: code review of 03 and 05

- GIVEN a reviewer scans `03-subagents-hitl` and `05-checkpoint-resume` solutions
- WHEN they search for `try {` blocks wrapping `graph.invoke` or `graph.stream*`
- THEN no such wrappings are present

### Requirement: Shape-Only Assertion Discipline

`tests.test.ts` MUST NOT assert on LLM text content, model argument values for tool calls, or text inside `ToolMessage`s. Assertions MUST use: call counts (lower-bound `>=`), `userReturn` structural keys, event-type presence, boolean flags (`interrupted`, `resumed`), and `.name` on tool_calls where applicable.

#### Scenario: no text-value assertions

- GIVEN a review of any `04-langgraph/*/tests.test.ts`
- WHEN a reviewer scans for `.toBe("some literal text")` on AIMessage content or ToolMessage content
- THEN no such assertions exist

# Track Agents-Tools Specification

## Purpose

Defines the 5 exercises of track `03-agents-tools` and the expected captured-call + userReturn shapes.

## Requirements

### Requirement: Track Lineup

Track `03-agents-tools` MUST contain exactly these 5 exercises in order:

| # | id | Focus |
|---|---|---|
| 1 | `01-bind-tools` | Manual `.bindTools()` + inspect `AIMessage.tool_calls` (no agent) |
| 2 | `02-react-agent` | One-shot `createReactAgent({ llm, tools })` |
| 3 | `03-multi-tool-recovery` | ≥3 tools, one deliberately throws; agent recovers via error-message reroute |
| 4 | `04-agent-memory` | `MemorySaver` + `thread_id` config; two invokes share state |
| 5 | `05-streaming-steps` | `agent.stream(..., { streamMode: "values" })`, accumulate snapshots |

#### Scenario: track listed with 5 entries

- GIVEN all 5 exercise directories exist with valid `meta.json`
- WHEN `lcdev list` runs
- THEN 5 entries under `03-agents-tools` appear in both `--locale es` and `--locale en`

### Requirement: Exercise 01 — Bind Tools

`01-bind-tools` MUST bind at least one `tool()` (Zod-schema) to a chat model via `.bindTools()` and invoke with a prompt that forces tool selection. Return `{ tool_calls: ToolCall[], finalMessage: AIMessage }`.

#### Scenario: tool_calls populated on the captured AIMessage

- GIVEN the exercise solution runs with a live API key
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 1`
- AND `result.lastCall?.response.tool_calls` is an array of length >= 1
- AND the first tool_call has `.name` equal to the bound tool's declared name

### Requirement: Exercise 02 — React Agent

`02-react-agent` MUST use `createReactAgent({ llm, tools })` with 1-2 tools, invoke with a user question that requires tool use, and return `{ answer: string, messages: BaseMessage[] }` where `answer` is the final AI message content.

#### Scenario: agent performs at least 2 model calls (tool decision + answer)

- GIVEN the exercise solution runs
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 2`
- AND at least one captured call has a non-empty `response.tool_calls`
- AND `result.userReturn.answer` is a non-empty string

### Requirement: Exercise 03 — Multi-Tool Recovery

`03-multi-tool-recovery` MUST define ≥3 tools where one ALWAYS throws (or returns an error string) on invocation. The agent MUST eventually produce a final answer; the error MUST NOT crash the chain. Return `{ answer: string, errorSeen: boolean }`.

#### Scenario: agent returns a final answer despite one failing tool

- GIVEN the exercise solution runs
- WHEN `runUserCode` returns
- THEN no exception escapes `runUserCode`
- AND `result.userReturn.answer` is a non-empty string
- AND `result.userReturn.errorSeen` is `true` (the failing tool path was exercised)

### Requirement: Exercise 04 — Agent Memory

`04-agent-memory` MUST configure `createReactAgent({ checkpointer: new MemorySaver(), … })` and invoke twice with the same `{ configurable: { thread_id: "…" } }`. The second invoke's input MUST be a follow-up that relies on first-invoke context. Return `{ turn1: string, turn2: string }`.

#### Scenario: two turns share state via thread_id

- GIVEN the exercise solution runs with a live API key
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 2` (at minimum one model call per turn; likely more due to agent iterations)
- AND both `turn1` and `turn2` are non-empty strings
- AND the `es`/`en` exercise.md explicitly documents the `thread_id` requirement

### Requirement: Exercise 05 — Streaming Steps

`05-streaming-steps` MUST invoke `agent.stream({ messages }, { streamMode: "values" })` and iterate the async generator to completion. Return `{ snapshotCount: number, finalMessages: BaseMessage[] }`.

#### Scenario: stream yields >= 2 snapshots and the final snapshot contains the accumulated trace

- GIVEN the exercise solution runs
- WHEN `runUserCode` returns
- THEN `result.userReturn.snapshotCount >= 2`
- AND `result.userReturn.finalMessages` has length >= 2 (user + ai messages, possibly tool messages)

### Requirement: Assert-on-Tool-Call-Name Discipline

`tests.test.ts` MUST NOT assert on tool-call argument VALUES (those are model-chosen and nondeterministic). It MAY assert on tool-call NAMES, counts, and presence of tool-use in captured AIMessages.

#### Scenario: test asserts on name not args

- GIVEN a review of any `03-agents-tools/*/tests.test.ts`
- WHEN a reviewer scans for `.args` assertions like `.toBe({ city: "Lima" })`
- THEN no such assertions exist
- AND name-based assertions use `.name`, presence-based use length/truthy checks

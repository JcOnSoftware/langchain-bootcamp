# Exploration: fase-5-agents-tools (5 exercises)

## Current State

- Harness captures EVERY `BaseChatModel.invoke` through the prototype patch. Agent loops go through the patch automatically: each iteration of `createReactAgent` calls the chat model via `.invoke()` → captured → `response.tool_calls` populated from the `AIMessage`.
- Runner exports `createChatModel` and `createEmbeddings`. No tool/agent factory yet.
- `@langchain/langgraph@1.2.9` is installed. `createReactAgent` is at `@langchain/langgraph/prebuilt`.
- `@langchain/langgraph-checkpoint@1.0.1` exposes `MemorySaver` — the in-memory checkpointer.
- `tool()` helper at `@langchain/core/tools` — accepts Zod v3 or v4 schemas; returns a `DynamicStructuredTool`.
- `zod@^3.25.0` already in exercises deps.
- No new deps required.

## Affected Areas

- `code/packages/exercises/03-agents-tools/{01..05}/` — 5 new exercise dirs (~30 files)
- `code/packages/runner/` — no changes (harness already covers agent loops via chat-model invocations)
- `code/packages/exercises/package.json` — no changes (zod + langgraph already present)
- `docs/EXERCISE-CONTRACT.md` — may append a short §Agents + tool_calls assertions section (optional)
- `openspec/specs/` — new `track-agents-tools` spec; maybe new `tool-factory` spec if we introduce a helper

## Approaches

### 1. Exercise Lineup

Locked per PLAN.md Fase 5:

| # | id | Focus | Key API |
|---|---|---|---|
| 1 | `01-bind-tools` | Manual tool-calling loop — `.bindTools()` + one model round-trip + inspect `AIMessage.tool_calls` | `tool()`, `model.bindTools([...])`, raw `model.invoke()` |
| 2 | `02-react-agent` | One-shot `createReactAgent` with 1-2 tools | `createReactAgent({ llm, tools })`, `agent.invoke({ messages })` |
| 3 | `03-multi-tool-recovery` | Agent with ≥3 tools, one deliberately fails; agent must recover and still produce a final answer | `tool()` that throws; react agent |
| 4 | `04-agent-memory` | Agent with `MemorySaver` + `thread_id` config; two invocations remember context | `MemorySaver`, `createReactAgent({ checkpointer })`, `{ configurable: { thread_id } }` |
| 5 | `05-streaming-steps` | `agent.stream(...)` iterated to collect intermediate step events (tool call, tool result, model message) | `agent.stream({ messages }, { streamMode: "values" })` |

**Effort: Medium-High** — agent exercises are more code than composition. Each tool adds ~10 lines; each exercise gets 2-4 tools typically.

### 2. Tool Factory?

Should the runner expose `createTool()` / a helper? Options:

- **A**: No helper. Exercises import `tool` from `@langchain/core/tools` directly + Zod for schemas. Idiomatic, zero abstraction debt.
- **B**: Thin `createTool({ name, description, schema, func })` wrapper in `@lcdev/runner`.

**Decision**: A. Exercises should use canonical LangChain `tool()`. Bootcamp teaches the real API — no detour through our wrapper.

### 3. Agent Factory?

Should runner expose `createAgent()` helper? Same tradeoff. **Decision**: No — `createReactAgent` is the canonical surface. Import directly from `@langchain/langgraph/prebuilt`.

### 4. Error Recovery (03-multi-tool-recovery) shape

Two ways an agent recovers from a throwing tool:

- **Prompt-level**: the tool catches the error and returns an error message as its output. Agent sees the tool output, decides to try again or give final answer.
- **Runtime-level**: tool throws; LangGraph catches and passes an error ToolMessage back to the agent. Agent sees it and proceeds.

Both work with `createReactAgent`. The simpler teaching pattern is the first — `try { realWork() } catch (e) { return `Error: ${e.message}. Try a different approach.` }`. Students see explicit recovery.

**Decision**: prompt-level recovery. Tool wraps its body in try/catch and returns an error string on failure. Agent gets a "Tool Y failed: …" message, reroutes via LLM.

### 5. Step Streaming (05-streaming-steps)

`agent.stream({ messages }, { streamMode: "values" })` yields full state snapshots per step. `streamMode: "updates"` yields incremental diffs. For a pedagogical exercise, `values` is easier to assert on (each yielded snapshot is a `{ messages: BaseMessage[] }` with the accumulated trace).

**Decision**: `streamMode: "values"`. `userReturn.steps = []` accumulates the snapshot count; `userReturn.finalMessages` is the last snapshot's messages.

### 6. Assert-on-Shape Discipline

For every exercise:

- `result.calls.length === expectedChatInvocations` (varies — agent usually does 2+ model calls: one to decide on tool, one to summarize)
- `result.lastCall?.response.tool_calls` — array when present; tests assert `.length`, `.name`, but NOT on arg values (those are model-dependent)
- `result.userReturn` — structural keys documented per exercise

No assertions on tool-call argument VALUES — models pick them. Only assert on tool-call NAMES + count.

### 7. Corpus/Fixture Data

Agents need tool implementations, not corpora. Tools are:
- `getWeather(city: string)` — deterministic stub returning "Sunny in {city}" (or similar)
- `calculator(a, b, op)` — deterministic math
- `searchDocs(query)` — returns hardcoded entry (for multi-tool recovery this one throws sometimes)

Keep tool bodies inline in `solution.ts` / `starter.ts`. Same self-contained convention as RAG.

## Approaches Summary

Approach 1 (lineup) + 2A (no tool helper) + 3 (no agent helper — import canonical) + 4 (prompt-level recovery) + 5 (streamMode: values) + 6 (shape only) + 7 (inline tool bodies).

## Risks

- **Model refusal to call tool**: small models sometimes bypass tools and answer directly. Mitigation: prompts make tool-calling explicit ("Use the weather tool to…"); asserts allow for 0-or-more tool calls per exercise where appropriate.
- **Provider tool-calling parity**: Anthropic, OpenAI, Gemini all support tool-calling in LC 1.x but the message format + metadata fields differ slightly. Tests assert on the LC-normalized `AIMessage.tool_calls` which is provider-agnostic.
- **Agent step count nondeterminism**: the LLM may call the same tool twice, or skip. Asserts on `calls.length >= N` (lower bound) rather than strict equality, except 02-react-agent where we ensure ≥2 calls (one tool decision + one answer).
- **`MemorySaver` thread_id semantics**: each invocation needs `{ configurable: { thread_id: "x" } }` config. Missing it re-initializes state. Test uses same thread_id twice to prove memory works.
- **Streaming state accumulation**: `streamMode: "values"` emits one state snapshot per step; the FINAL snapshot contains the full conversation. Students iterate + count + return the last snapshot.
- **Voseo drift**: same rg guard.

## Ready for Proposal

**Yes**. APIs confirmed, no new deps, scope bounded. Next: sdd-propose with change-name `fase-5-agents-tools`.

# Exploration: fase-8-observability (5 exercises)

## Current State

- Tracks 01–05 shipped. Track 06 (`06-observability/`) does NOT exist yet — this fase creates it.
- Harness (`BaseChatModel.prototype.invoke` + `._streamIterator`) patches are stable; `CapturedCallLangChain` carries `{ model, input, response: { content, tool_calls, usage, response_metadata }, run_id, durationMs, streamed }`.
- `usage` is already normalized: `{ input_tokens, output_tokens, total_tokens }` from `AIMessage.usage_metadata` — confirmed in `harness-langchain.ts:buildCapture()`.
- Installed/locked versions confirmed from `bun.lock`:
  - `@langchain/core@1.1.40`
  - `@langchain/anthropic@1.3.26`
  - `@langchain/openai@1.4.4`
  - `@langchain/google-genai@1.0.3`
  - `@langchain/langgraph@1.2.9`
  - `langsmith@0.5.20` — **transitive dep of `@langchain/core`** (listed in `@langchain/core`'s `dependencies`). Available without adding it to `exercises/package.json`.
  - `zod@3.25.76`
- `cost.ts` exists at `code/packages/cli/src/cost.ts` with a full `estimateCost(model, usage)` function covering all 3 providers (Anthropic, OpenAI, Gemini). Price table is current (lastUpdated: 2026-04).
- `ConsoleCallbackHandler` confirmed at `@langchain/core/tracers/console`.
- `LangChainTracer` confirmed at `@langchain/core/tracers/tracer_langchain` — depends on `langsmith` internally.
- `RunCollectorCallbackHandler` confirmed at `@langchain/core/tracers/run_collector`.
- `BaseCallbackHandler` + all lifecycle methods confirmed at `@langchain/core/callbacks/base`.
- `streamEvents({ version: "v2" })` confirmed on `Runnable.prototype` in `@langchain/core/dist/runnables/base.d.ts` (lines 257–263).
- `getGraph()` confirmed on `Runnable.prototype` (returns `Graph` from `@langchain/core/runnables/graph`).
- `withRetry({ stopAfterAttempt })` and `withFallbacks({ fallbacks })` already used in track 05.
- No new dependencies required for any of the 5 exercises.

## Affected Areas

- `code/packages/exercises/06-observability/{01..05}/` — 5 new exercise dirs (~30 files total)
- `code/packages/runner/` — untouched (harness already covers all observability patterns)
- `code/packages/exercises/package.json` — untouched (no new deps; `langsmith` is a transitive dep of `@langchain/core`)
- `openspec/specs/track-observability/spec.md` — new spec file
- `openspec/changes/fase-8-observability/` — this SDD cycle

## Exercise Lineup (Locked)

| # | slug | Focus | Key API |
|---|---|---|---|
| 1 | `01-langsmith-tracing` | LangSmith auto-tracing via env vars; `LangChainTracer` programmatic config; `RunCollectorCallbackHandler` for run capture without hitting server | `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LangChainTracer`, `RunCollectorCallbackHandler` |
| 2 | `02-custom-callbacks` | `BaseCallbackHandler` subclass; lifecycle hooks (`handleLLMStart`, `handleLLMEnd`, `handleChainStart`); attach via `callbacks` option in `.invoke()` | `BaseCallbackHandler`, `callbacks: [handler]` in invoke options |
| 3 | `03-cost-tracking` | Build a cost calculator from `CapturedCallLangChain.response.usage`; `estimateCost`-style logic; provider-agnostic rates from the existing `cost.ts` pattern | `usage.input_tokens`, `usage.output_tokens`, price table, cost formula |
| 4 | `04-debug-chains` | `streamEvents({ version: "v2" })` on an LCEL chain; collect and classify events; `getGraph()` for topology inspection; `ConsoleCallbackHandler` for verbose output | `chain.streamEvents({ version: "v2" })`, `chain.getGraph()`, `ConsoleCallbackHandler` |
| 5 | `05-production-checklist` | Wrap a chain with production hardening: `.withRetry()`, `.withFallbacks()`, error-boundary callback, cost-tracking callback, structured logging callback; tests assert wrappers are in place | `withRetry`, `withFallbacks`, `BaseCallbackHandler` subclass, `RunCollectorCallbackHandler` |

## API Investigation Results

### 1. LangSmith Tracing (`01-langsmith-tracing`)

**How tracing is enabled**:
- **Env-var-based auto-tracing**: set `LANGCHAIN_TRACING_V2=true` + `LANGCHAIN_API_KEY=<key>` → `@langchain/core` internally creates a `LangChainTracer` and adds it to the default callback manager. Zero code changes needed.
- **Programmatic**: pass `LangChainTracer` in `callbacks` option or use `withConfig({ callbacks: [new LangChainTracer()] })`.

**`LangChainTracer`** confirmed at `@langchain/core/tracers/tracer_langchain`:
- Constructor: `new LangChainTracer({ projectName?, client?, tags?, metadata? })`.
- Uses `langsmith` client internally (transitive dep, already available).
- `getRun(id)` → `Run | undefined` — fetch a run by ID after execution.

**`RunCollectorCallbackHandler`** confirmed at `@langchain/core/tracers/run_collector`:
- Collects `tracedRuns: Run[]` without sending to LangSmith server.
- Perfect for testing/asserting WITHOUT a real `LANGCHAIN_API_KEY`.

**LangSmith constraint resolution**:
- The exercise MUST be testable without a LangSmith account.
- Strategy: the exercise uses `RunCollectorCallbackHandler` (no API key needed) to demonstrate the callback-based run capture pattern. The exercise.md ALSO documents the env-var approach for real LangSmith tracing.
- Test `skipIf`: if `LANGCHAIN_API_KEY` is set, an optional second test block verifies the `LangChainTracer` is configured correctly. If not set, that block is skipped — NOT failed.
- What we assert without hitting server: `collector.tracedRuns.length >= 1`; `tracedRuns[0].run_type === "llm"` or `"chain"`; `tracedRuns[0].inputs` is a non-null object.

**No new dep needed**: `langsmith@0.5.20` is already a transitive dep of `@langchain/core@1.1.40` (confirmed in bun.lock). Import directly: `import { RunCollectorCallbackHandler } from "@langchain/core/tracers/run_collector"`.

### 2. Custom Callbacks (`02-custom-callbacks`)

**`BaseCallbackHandler`** confirmed at `@langchain/core/callbacks/base`:
- Abstract class; extend and override lifecycle methods.
- Key lifecycle methods for a chat-model + chain exercise:
  - `handleLLMStart(llm, prompts, runId, ...)` — fires when model starts
  - `handleLLMEnd(output: LLMResult, runId, ...)` — fires when model finishes
  - `handleChatModelStart(llm, messages, runId, ...)` — fires specifically for chat models (more useful than `handleLLMStart` for our case)
  - `handleChainStart(chain, inputs, runId, ...)` — fires for LCEL chain start
  - `handleChainEnd(outputs, runId, ...)` — fires for LCEL chain end
  - `handleToolStart`, `handleToolEnd` — for tool runs

**Attachment patterns** (three approaches):
- **Instance-scope via invoke options** (RECOMMENDED for pedagogy): `model.invoke(input, { callbacks: [handler] })` or `chain.invoke(input, { callbacks: [handler] })`.
- **Model-level at construction**: `new ChatAnthropic({ callbacks: [handler] })` — applies to all calls on this model instance.
- **Global via CallbackManager**: sets up project-wide callbacks — too heavy for an exercise.

**Pedagogical decision**: Instance-scope via `callbacks` option in `.invoke()`. Cleanest — shows the learner exactly where callbacks attach. Applies to both model and chain level.

**Exercise shape**:
```ts
class EventRecorder extends BaseCallbackHandler {
  name = "event_recorder";
  events: string[] = [];
  override handleChatModelStart() { this.events.push("llm_start"); }
  override handleLLMEnd() { this.events.push("llm_end"); }
  override handleChainStart() { this.events.push("chain_start"); }
  override handleChainEnd() { this.events.push("chain_end"); }
}
export default async function run() {
  const recorder = new EventRecorder();
  const chain = prompt.pipe(model).pipe(parser);
  await chain.invoke({ question: "..." }, { callbacks: [recorder] });
  return { events: recorder.events };
}
```

**Assert strategy**:
- `userReturn.events` is an array
- `userReturn.events.includes("llm_start")` — true
- `userReturn.events.includes("llm_end")` — true
- `userReturn.events.includes("chain_start")` — true
- `result.calls.length >= 1` — harness still captures the model call

### 3. Cost Tracking (`03-cost-tracking`)

**Captured usage already normalized**: confirmed in `harness-langchain.ts:buildCapture()` (lines 93–98). `usage_metadata` on `AIMessage` becomes `{ input_tokens, output_tokens, total_tokens }` on `CapturedCallLangChain.response.usage`.

**`cost.ts` in `@lcdev/cli`**: full `estimateCost(model, usage)` already exists with price tables for Anthropic (haiku/sonnet/opus), OpenAI (gpt-4.1 family, gpt-4o), and Gemini (2.5-flash, 2.5-pro). The exercise does NOT import from `@lcdev/cli` (that's a CLI concern). Instead, the exercise BUILDS its own cost calculator from the captured usage — same pattern, different educational value.

**Exercise shape**:
```ts
// Exercise: implement calculateCost(model, usage) using a price table
function calculateCost(model: string, usage: { input_tokens: number; output_tokens: number }): number {
  // learner builds price lookup + formula
}
export default async function run() {
  const result = await runUserCode(...); // or just invoke directly
  const model = createChatModel();
  const response = await model.invoke("...");
  // usage comes from response.usage_metadata
  const cost = calculateCost(/* ... */);
  return { cost, inputTokens, outputTokens };
}
```

**Assert strategy**:
- `userReturn.cost` is a number > 0
- `userReturn.cost` is approximately within expected range given known rates (fuzzy range: within 10× of expected — avoids brittleness from token count variation)
- `userReturn.inputTokens` is a number > 0
- `userReturn.outputTokens` is a number > 0
- `result.calls.length >= 1`

**Key pedagogical point**: The exercise teaches that `AIMessage.usage_metadata` (exposed via `CapturedCallLangChain.response.usage`) gives normalized token counts across providers — the same `input_tokens`/`output_tokens` shape regardless of Anthropic/OpenAI/Gemini.

### 4. Debug Chains (`04-debug-chains`)

**`streamEvents({ version: "v2" })`** confirmed on `Runnable.prototype`:
- Signature: `streamEvents(input, { version: "v2" }, streamOptions?)` → `IterableReadableStream<StreamEvent>`.
- Event types (from type docs): `on_chat_model_start`, `on_chat_model_stream`, `on_chat_model_end`, `on_chain_start`, `on_chain_stream`, `on_chain_end`, `on_tool_start`, `on_tool_end`, `on_prompt_start`, `on_prompt_end`.
- Each event: `{ event: string, name: string, run_id: string, tags: string[], metadata: Record, data: Record }`.

**`getGraph()`** confirmed on `Runnable.prototype`:
- Returns `Graph` from `@langchain/core/runnables/graph`.
- `graph.toJSON()` returns a serializable DAG description.
- `graph.nodes` and `graph.edges` are accessible.
- Useful for introspecting which runnables are in a chain.

**`ConsoleCallbackHandler`** confirmed at `@langchain/core/tracers/console`:
- Drop-in debug handler — logs all lifecycle events to console.
- Good pedagogical complement to `streamEvents` (shows verbose output).

**Exercise approach**: Use `streamEvents` as the primary debug mechanism. The learner collects events from a prompt+model+parser chain and returns them as structured data.

**Assert strategy**:
- `userReturn.events` is an array with `length > 0`
- At least one event has `event === "on_chat_model_start"`
- At least one event has `event === "on_chat_model_end"`
- At least one event has `event === "on_chain_start"`
- `userReturn.graphNodes` is an array with `length >= 2` (at minimum: model node + chain node)
- `result.calls.length >= 1`

**Harness interaction**: `streamEvents` calls `_streamIterator` internally for the model → harness captures it. `result.streamed` may be `true` or `false` depending on whether the chain streams internally. Shape-only.

### 5. Production Checklist (`05-production-checklist`)

**The challenge**: This exercise is conceptually a "checklist" — but needs testable assertions. Approach: learner wraps a stub chain with concrete production hardening, and tests verify the wrappers are in place.

**5 production wrappers the learner must apply**:
1. `.withRetry({ stopAfterAttempt: 3 })` — resilience against transient failures
2. `.withFallbacks({ fallbacks: [fallbackModel] })` — provider-level fallback
3. Cost-tracking callback (custom `BaseCallbackHandler` subclass that logs token usage)
4. Error-boundary callback (custom handler that calls `handleLLMError` / `handleChainError`)
5. `RunCollectorCallbackHandler` — run capture for audit trail

**What we can assert without a real API call to an unreachable endpoint**:
- The chain returned by `run()` is a `Runnable` instance (verifiable via `typeof chain.invoke === "function"`)
- `chain` is or contains a `RunnableWithFallbacks` (verifiable: `chain.constructor.name.includes("Fallback") || chain instanceof RunnableWithFallbacks`)
- `chain` is or contains a `RunnableRetry` (verifiable: `chain.constructor.name.includes("Retry")`)
- The `callbacks` array passed by the learner includes instances of the expected handler types

**Alternative approach** (simpler): The learner produces a structured config object showing what wrappers were applied, and tests verify the structure. But the runnable-inspection approach is more authentic.

**Recommended approach**: The exercise invokes the chain with a real model call. The test asserts on `userReturn.wrapperTypes` (an array of strings the learner returns like `["retry", "fallbacks", "cost_tracker", "error_boundary", "run_collector"]`), PLUS `result.calls.length >= 1` to confirm the chain was actually invoked. This avoids reflection/introspection complexity while still verifying meaningful work.

**Assert strategy**:
- `userReturn.wrapperTypes` includes `"retry"`, `"fallbacks"`, `"cost_tracker"`, `"error_boundary"`, `"run_collector"`
- `userReturn.callSucceeded === true`
- `result.calls.length >= 1`
- `userReturn.tracedRuns.length >= 1` (from `RunCollectorCallbackHandler`)

## Harness Compatibility

The current `harness-langchain.ts` patches `BaseChatModel.prototype.invoke` + `._streamIterator` — covers ALL 5 exercises WITHOUT modification:

| Exercise | Harness coverage |
|---|---|
| `01-langsmith-tracing` | Model invoke is patched → captured; `RunCollectorCallbackHandler` works alongside harness (both observe the same call) |
| `02-custom-callbacks` | Model invoke is patched → captured; custom callbacks fire at the LangChain layer BEFORE harness capture happens; no conflict |
| `03-cost-tracking` | Model invoke → captured; `usage` already normalized on `CapturedCallLangChain.response.usage` |
| `04-debug-chains` | `streamEvents` calls `_streamIterator` → harness captures aggregated chunk; `result.streamed === true` |
| `05-production-checklist` | `.withRetry`/`.withFallbacks` wrap the model but ultimately call `BaseChatModel.invoke` → harness captures each attempt |

**No runner changes needed.**

## Open Questions Resolved

| Question | Resolution |
|---|---|
| Is `langsmith` installed? | YES — transitive dep of `@langchain/core@1.1.40`, already in bun.lock as `langsmith@0.5.20` |
| LangSmith: what do we assert without hitting server? | Use `RunCollectorCallbackHandler` which collects `tracedRuns[]` locally; assert `tracedRuns.length >= 1` and `tracedRuns[0].run_type` is correct. Skip (not fail) if `LANGCHAIN_API_KEY` absent for `LangChainTracer` test. |
| Does `cost.ts` already exist? | YES — `code/packages/cli/src/cost.ts` has full `estimateCost()` with 3-provider price table. Exercise builds its OWN calculator to teach the skill, does NOT import from cli |
| Is usage normalized across providers? | YES — `harness-langchain.ts:buildCapture()` reads `AIMessage.usage_metadata` → `{ input_tokens, output_tokens, total_tokens }` |
| Debugging exercise: what exactly is asserted? | `streamEvents v2` event types seen (shape-only: at least `on_chat_model_start`, `on_chat_model_end`, `on_chain_start`); `getGraph()` node count |
| Production checklist: option (a/b/c)? | Option (b): learner applies wrappers, returns `wrapperTypes[]` + real call result; tests verify presence of wrappers + successful invocation |
| `setVerbose`/`setDebug` from `@langchain/core/globals`? | NOT found in `@langchain/core@1.1.40` dist. Use `ConsoleCallbackHandler` instead for verbose debug output. |

## Approaches

### 1. LangSmith Exercise — Testing Without Server

**Option A**: Use `RunCollectorCallbackHandler` for assertions; document `LangChainTracer` in exercise.md; skip `LangChainTracer` test if key absent.
- Pros: Testable without LangSmith account; teaches both approaches; consistent with provider-guard precedent (extended-thinking).
- Cons: The "real" LangSmith assertion only runs for learners who have a key.
- Effort: Low

**Option B**: Mock the LangSmith HTTP endpoint (nock/fetch mock).
- Pros: Always runs.
- Cons: Complex mock setup; teaches mock plumbing, not observability. Out of scope for this bootcamp.

**Decision**: Option A. Same pattern as `04-extended-thinking` in Fase 7 (skipIf + guard).

### 2. Cost Tracking — Use Existing `cost.ts` or Build Fresh

**Option A**: Import `estimateCost` from `@lcdev/cli/src/cost.ts` in the exercise.
- Pros: DRY.
- Cons: Creates an exercises → cli dependency (bad architecture); defeats the learning goal.

**Option B**: Exercise builds its own minimal cost calculator from scratch using `CapturedCallLangChain.response.usage`.
- Pros: Learner understands the pattern; no cross-package deps; pedagogically valuable.
- Cons: Slight duplication of logic.

**Decision**: Option B. The learning goal IS building the cost calculator. The existing `cost.ts` is the reference/inspiration, not a shared dep.

### 3. Debugging Exercise — `streamEvents` vs `setVerbose`

**Option A**: `streamEvents({ version: "v2" })` — collect typed events from LCEL chain.
- Pros: Official LangChain v1 API; structured events; testable assertions on event types; shows "inside the pipe".
- Cons: More complex to explain for first-timers.
- Effort: Medium

**Option B**: `setVerbose(true)` — enable verbose console logging.
- Pros: Simpler.
- Cons: `setVerbose` NOT found in `@langchain/core@1.1.40` dist — may have been removed. Not testable (side effect only). Would fail typecheck.

**Decision**: Option A — `streamEvents v2`. It's the canonical modern debug API and is fully testable.

### 4. Production Checklist — Wrapper Verification Strategy

**Option A**: Learner returns `wrapperTypes: string[]` explicitly + real call result.
- Pros: Simple to test; avoids reflection/instanceof complexity; learner demonstrates understanding by naming the wrappers.
- Cons: Slightly "game-able" (learner could return hardcoded strings without applying wrappers).

**Option B**: Test inspects the wrapped chain via `chain.constructor.name` or `instanceof` checks.
- Pros: More authentic verification.
- Cons: Constructor names can differ per LangChain version; brittle to internal changes.

**Decision**: Option A, but the exercise ALSO invokes the chain (real API call), so `result.calls.length >= 1` provides an authentic "it ran" assertion. The combination is sufficient pedagogically.

## Recommendation

1. Lineup locked as above (5 exercises, naming confirmed).
2. No runner changes — harness covers all observability patterns.
3. No new dependencies — `langsmith@0.5.20` already transitive via `@langchain/core`.
4. Exercise 01 (LangSmith tracing) uses `RunCollectorCallbackHandler` for assertions; skip (not fail) `LangChainTracer` test when `LANGCHAIN_API_KEY` absent.
5. Exercise 03 builds its own cost calculator from `CapturedCallLangChain.response.usage` — does NOT import from `@lcdev/cli`.
6. Exercise 04 uses `streamEvents({ version: "v2" })` + `getGraph()` — NOT `setVerbose` (not found in 1.1.40).
7. Exercise 05 returns `wrapperTypes[]` + real invocation result; tests assert wrapper presence + `result.calls.length >= 1`.
8. Shape-only asserts throughout — no literal text checks.
9. Provider-agnostic exercises 01–05; exercise 01 has optional `LangChainTracer` block guarded by `LANGCHAIN_API_KEY` presence.

## Risks

- **`setVerbose` missing**: Confirmed NOT present in `@langchain/core@1.1.40`. Exercise 04 MUST use `streamEvents v2` or `ConsoleCallbackHandler` — not `setVerbose`. Already accounted for in lineup.
- **`streamEvents v2` event count variability**: Number and order of events varies slightly by model and chain shape. Assert event TYPE presence (not count or order).
- **`LangChainTracer` + langsmith version drift**: `langsmith@0.5.20` is a transitive dep (locked in bun.lock). If the minor is bumped, `LangChainTracer`'s constructor may change. Use `@langchain/core/tracers/tracer_langchain` import (stable re-export from core) rather than direct `langsmith` import.
- **`RunCollectorCallbackHandler` schema changes**: Uses `langsmith/schemas` internally (per `run_collector.d.ts`). Tested import path is `@langchain/core/tracers/run_collector` (stable).
- **Cost tracking: token count variability across providers**: Gemini's `usage_metadata` is confirmed normalized by harness. OpenAI uses `input_tokens` already (standardized in `@langchain/core@1.1.40` via `AIMessage.usage_metadata`). Assert `cost > 0`, not exact value.
- **Production checklist exercise: RunnableWithFallbacks inspection**: If tests need to assert on chain type, constructor names are internal. Using learner-reported `wrapperTypes[]` avoids this brittleness.
- **Voseo drift**: rg guard in PR CI catches it.

## Ready for Proposal

**Yes**. Scope bounded, all APIs confirmed in `@langchain/core@1.1.40` + `langsmith@0.5.20`, no new deps, no runner changes, 5 slugs locked:

1. `01-langsmith-tracing`
2. `02-custom-callbacks`
3. `03-cost-tracking`
4. `04-debug-chains`
5. `05-production-checklist`

Next: `sdd-propose` with change-name `fase-8-observability`.

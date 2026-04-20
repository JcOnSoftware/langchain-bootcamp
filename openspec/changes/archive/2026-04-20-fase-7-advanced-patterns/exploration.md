# Exploration: fase-7-advanced-patterns (5 exercises)

## Current State

- Tracks 01–04 shipped. Track 05 (`05-advanced-patterns/`) does NOT exist yet — this fase creates it.
- Harness (`BaseChatModel.prototype.invoke` + `._streamIterator`) captures every chat-model call. Patches are stable, no runner extension needed.
- `CapturedCallLangChain` carries `{ model, input, response: { content, tool_calls, usage, response_metadata }, run_id, durationMs, streamed }`.
- Installed versions confirmed: `@langchain/core@1.1.40`, `@langchain/anthropic@^1.0.0`, `@langchain/langgraph@^1.0.0`, `zod@3.25.76`.
- `zod-to-json-schema` is NOT installed. Use `toJsonSchema` from `@langchain/core/utils/json_schema` instead (already available).
- No new deps required for any of the 5 exercises.

## Affected Areas

- `code/packages/exercises/05-advanced-patterns/{01..05}/` — 5 new exercise dirs (~30 files total)
- `code/packages/runner/` — untouched (harness already covers all patterns)
- `code/packages/exercises/package.json` — untouched (no new deps)
- `openspec/specs/track-advanced-patterns/spec.md` — new spec file
- `openspec/changes/fase-7-advanced-patterns/` — this SDD cycle

## Exercise Lineup (Locked)

| # | slug | Focus | Key API |
|---|---|---|---|
| 1 | `01-structured-output-zod` | `model.withStructuredOutput(zodSchema)` → typed object response; compare Zod v3 vs JSON schema input | `model.withStructuredOutput(schema)`, Zod v3 schema, `StructuredOutputMethodOptions` |
| 2 | `02-fallback-retry` | `.withFallbacks([fallbackModel])` + `.withRetry({ stopAfterAttempt })` on a chain | `Runnable.withFallbacks`, `Runnable.withRetry`, `RunnableWithFallbacks` |
| 3 | `03-streaming-json` | LCEL pipe `model | JsonOutputParser` + stream partial JSON accumulation via `.stream()` | `JsonOutputParser`, `model.stream()`, partial JSON accumulation |
| 4 | `04-extended-thinking` | `ChatAnthropic` with `thinking: { type: "enabled", budgetTokens }` — thinking blocks in `AIMessage.content` | `ChatAnthropic({ thinking })`, `content` as array with `{ type: "thinking" }` blocks |
| 5 | `05-tool-schema-validation` | `tool()` with Zod schema — validation happens at call time; `ToolInputParsingException` on bad input; `toJsonSchema` for inspection | `tool()`, `DynamicStructuredTool`, `ToolInputParsingException`, `toJsonSchema` |

## API Investigation Results

### 1. Structured Output (`01-structured-output-zod`)

**`model.withStructuredOutput(schema, config?)`** is confirmed on `BaseChatModel` in `@langchain/core@1.1.40`.

- Accepts: `ZodV3Like`, `ZodV4Like`, `SerializableSchema`, or raw JSON Schema `Record<string, any>`.
- Config options: `{ name?, method?: "functionCalling" | "jsonMode" | "jsonSchema", includeRaw?, strict? }`.
- `strict?: boolean` — currently only enforced by OpenAI models.
- Returns a `Runnable<BaseLanguageModelInput, RunOutput>` — NOT a chat model — so it is NOT patched by the harness (no capture via `BaseChatModel.prototype.invoke`).
- **Harness implication**: `model.withStructuredOutput(...)` wraps the model in a `RunnableSequence`. The underlying `BaseChatModel.invoke` IS called internally → harness captures it. `result.calls.length >= 1`.
- Zod v3 schema works directly (installed version: 3.25.76). No conversion needed.
- `includeRaw: true` → response is `{ raw: AIMessage, parsed: T }` — useful for teaching.

**Exercise shape**:
```ts
export default async function run() {
  const schema = z.object({ capital: z.string(), population: z.number() });
  const structured = model.withStructuredOutput(schema, { name: "country_info" });
  const result = await structured.invoke("Tell me about France");
  return { capital: result.capital, population: result.population };
}
```

**Assert strategy**: `result.calls.length >= 1`; `userReturn.capital` is a non-empty string; `userReturn.population` is a number > 0. No literal value checks.

### 2. Fallback + Retry (`02-fallback-retry`)

**`.withFallbacks(fields)`** confirmed on `Runnable.prototype` in `@langchain/core@1.1.40`.
- Signature: `withFallbacks(fields: { fallbacks: Runnable[] } | Runnable[])` — accepts both object and direct array (confirmed by inspecting implementation).
- Returns `RunnableWithFallbacks` — wraps primary + fallbacks.
- When primary throws, fallback is tried in order.

**`.withRetry(fields?)`** confirmed on `Runnable.prototype`.
- Signature: `withRetry({ stopAfterAttempt?: number, ...})` → returns `RunnableRetry`.
- On each failure, re-invokes the bound runnable up to `maxAttemptNumber` times.

**Pedagogical scenario decision**: The best scenario for a bootcamp exercise is **combining both** on a chain:
1. Create a "flaky" primary runnable (a `RunnableLambda` that throws on first N calls).
2. Wrap with `.withRetry({ stopAfterAttempt: 2 })` — tests that retry works.
3. Create a fallback model (cheaper/weaker) and wrap with `.withFallbacks([fallbackModel])`.
4. Demonstrate that when retry exhausts, fallback kicks in.

**Alternative rejected**: Using two real models (expensive, provider-specific). Better to use a deterministic `RunnableLambda` that simulates a failing primary.

**Assert strategy**: Return `{ retriedCount, usedFallback, finalAnswer }`. Tests assert `retriedCount >= 1`, `usedFallback === true`, `finalAnswer` is a non-empty string.

**Harness implication**: If fallback is also a chat model, harness captures both attempted calls. `result.calls.length >= 1`.

### 3. Streaming JSON (`03-streaming-json`)

**`JsonOutputParser`** confirmed at `@langchain/core/output_parsers`. It extends `BaseCumulativeTransformOutputParser<T>` and has `parsePartialResult()`.

**`parsePartialJson`** utility confirmed at `@langchain/core/utils/json`.

**Streaming pattern**:
```ts
import { JsonOutputParser } from "@langchain/core/output_parsers";
const parser = new JsonOutputParser();
const chain = model.pipe(parser);
const stream = await chain.stream(prompt);
const chunks: unknown[] = [];
for await (const chunk of stream) {
  chunks.push(chunk);
}
// chunks contains partial JSON objects as they accumulate
return { chunks, final: chunks.at(-1) };
```

**Key insight**: `JsonOutputParser` with `.stream()` yields incrementally accumulated partial JSON (partial strings → partial objects → final complete object). Each `chunk` is the CUMULATIVE parse result so far, not a delta. The last chunk is the complete JSON.

**Harness implication**: `harness-langchain.ts` patches `_streamIterator`. When `.stream()` is called on the chain (`model | JsonOutputParser`), the model's `_streamIterator` is invoked → harness captures the aggregated AIMessageChunk at stream end. `result.streamed === true`, `result.calls.length === 1`.

**Assert strategy**:
- `result.calls.length === 1` and `result.calls[0].streamed === true`
- `userReturn.chunks.length > 1` (partial steps visible — confirms real streaming)
- `userReturn.final` matches expected shape (object with known keys — NOT literal values)

### 4. Extended Thinking (`04-extended-thinking`)

**`ChatAnthropic({ thinking: { type: "enabled", budgetTokens: N } })`** confirmed in `@langchain/anthropic@^1.0.0`.

- Constructor field: `thinking?: AnthropicThinkingConfigParam` — maps to `Anthropic.ThinkingConfigParam`.
- `AnthropicThinkingConfigParam` = `{ type: "enabled" | "adaptive", budgetTokens?: number }`.

**Where thinking blocks appear in `AIMessage`**:
- When thinking is enabled AND there are tools/thinking params: `AIMessage.content` is an **array**.
- Thinking blocks in the array: `{ type: "thinking", thinking: "..." }`.
- Text blocks: `{ type: "text", text: "..." }`.
- In the harness: `CapturedCallLangChain.response.content` = this array.

**Provider restriction**: Extended thinking only works with `ChatAnthropic`. Other providers (OpenAI, Gemini) will throw or ignore the parameter.

**Provider guard approach**: Exercise uses `createChatModel()` from `@lcdev/runner` which creates the configured provider model. The test must skip (or guard) when provider is NOT Anthropic. Precedent: Fase 3 RAG exercises guard with `beforeAll` API key check. Here we add a provider check:

```ts
beforeAll(async () => {
  const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
  if (provider !== "anthropic") {
    console.log("Skipping: extended thinking requires Anthropic provider");
    return;
  }
  result = await runUserCode(EXERCISE_FILE);
});
```

**Minimum budget_tokens**: Extended thinking requires `budget_tokens >= 1024`. Use 1024 in the exercise.

**Model requirement**: Extended thinking requires `claude-3-7-sonnet` or later. Use `claude-3-7-sonnet-20250219` or let the configured model be used (the exercise will fail gracefully if model doesn't support thinking).

**Live vs mock decision**: Run LIVE. Mock defeats the purpose — the whole point is seeing thinking blocks in the response. The test is guarded by provider check + API key guard. The budget is low (1024 tokens) to keep cost acceptable.

**Assert strategy**:
- `result.calls.length >= 1`
- `result.calls[0].response.content` is an array (not a string)
- At least one content block has `type === "thinking"` 
- At least one content block has `type === "text"`
- The thinking block's `.thinking` field is a non-empty string

### 5. Tool Schema Validation (`05-tool-schema-validation`)

**`tool(func, { name, description, schema })`** confirmed in `@langchain/core/tools`.

- Accepts Zod v3 schema (`ZodObjectV3`), Zod v4 schema, or `JsonSchema7Type`.
- Validation happens in `StructuredTool.call()` via `interopParseAsync(this.schema, input)`.
- On validation failure: throws `ToolInputParsingException`.

**`toJsonSchema(zodSchema)`** from `@langchain/core/utils/json_schema` — confirmed available, no extra package needed.

**`zod-to-json-schema` package**: NOT installed. Use `toJsonSchema` from `@langchain/core/utils/json_schema` instead.

**Exercise concept**: Demonstrate the FULL lifecycle of tool schema validation:
1. Define a Zod schema with constraints (e.g., `z.object({ age: z.number().min(0).max(150), email: z.string().email() })`).
2. Create a tool with that schema.
3. Inspect the JSON schema representation via `toJsonSchema(schema)`.
4. Call tool with valid input → succeeds.
5. Call tool with invalid input → catches `ToolInputParsingException`.
6. Bind tool to model via `.bindTools([myTool])` — model receives JSON schema description.

**Where validation is enforced**: LangChain-side (in `StructuredTool.call()`), NOT model-side. Models receive the JSON schema description only. OpenAI's `strict` mode adds server-side enforcement, but that's provider-specific. This exercise focuses on LangChain's client-side validation.

**Assert strategy**:
- `userReturn.validCallResult` is the expected return value
- `userReturn.invalidCallError` is a non-empty string (the caught error message)
- `userReturn.jsonSchema.type === "object"`
- `userReturn.jsonSchema.required` includes the required field names
- `result.calls.length >= 1` (model was invoked to inspect tool binding)

## Harness Compatibility

The current `harness-langchain.ts` (patches `BaseChatModel.prototype.invoke` + `._streamIterator`) covers ALL 5 exercises WITHOUT modification:

| Exercise | Harness coverage |
|---|---|
| `01-structured-output-zod` | `withStructuredOutput` internally calls `BaseChatModel.invoke` → captured |
| `02-fallback-retry` | Both primary and fallback are chat models → captured on each attempt |
| `03-streaming-json` | `_streamIterator` patch aggregates streamed chunks → `result.streamed === true` |
| `04-extended-thinking` | `invoke` is patched → `content` array with thinking blocks available via `result.calls[0].response.content` |
| `05-tool-schema-validation` | Tool validation happens in `StructuredTool.call()`, NOT in `BaseChatModel`. Model is invoked for tool-binding demonstration → captured. Tool calls: harness captures them via `response.tool_calls` |

**No runner changes needed.**

## Open Questions Resolved

| Question | Resolution |
|---|---|
| Does `withStructuredOutput` capture in harness? | YES — the chain calls `BaseChatModel.invoke` internally |
| Extended thinking: `response_metadata` or `content`? | `AIMessage.content` as array with `{ type: "thinking" }` blocks |
| Streaming JSON: what does harness capture? | Final aggregated `AIMessageChunk` — `streamed: true`, `content` has the raw model output; `JsonOutputParser` downstream output is in `userReturn` |
| Fallback scenario: real models or deterministic? | Deterministic `RunnableLambda` for primary (simulates failure), real model as fallback |
| Tool schema validation: LangChain-side or model-side? | LangChain-side via `interopParseAsync` in `StructuredTool.call()` |
| `zod-to-json-schema` needed? | NO — use `toJsonSchema` from `@langchain/core/utils/json_schema` |
| Extended thinking: live or mock? | LIVE, guarded by provider check (skip if not Anthropic) |

## Approaches

### 1. Exercise 04 — Provider Guard Strategy

**Option A**: Skip test if provider !== "anthropic" via `test.skip`.
- Pros: Clean, no test failure on non-Anthropic config.
- Cons: Silent pass on OpenAI/Gemini setups.

**Option B**: Always run with `ChatAnthropic` directly (hardcode provider, ignore `createChatModel`).
- Pros: Always tests the real thing.
- Cons: Breaks if `ANTHROPIC_API_KEY` not set; inconsistent with other exercises.

**Decision**: Option A — `beforeAll` checks `LCDEV_PROVIDER`. If not anthropic, mark all tests as skipped with a clear message. Same pattern as API key guards in other exercises.

**Effort**: Low

### 2. Exercise 02 — Fallback Scenario Design

**Option A**: Deterministic `RunnableLambda` as primary (throws on first call), real model as fallback.
- Pros: No extra API cost, deterministic, tests the LangChain wiring cleanly.
- Cons: Primary is not a chat model; slightly artificial.

**Option B**: Two real chat models, one with invalid API key (force failure), fallback with real key.
- Pros: More "real" scenario.
- Cons: Expensive, non-deterministic, fragile.

**Decision**: Option A. The bootcamp teaches LangChain patterns, not provider error handling. A deterministic `RunnableLambda` that throws exactly once is pedagogically cleaner.

**Effort**: Low

### 3. Exercise 03 — Streaming JSON Depth

**Option A**: Simple prompt asking for a JSON object → pipe through `JsonOutputParser` → stream.
**Option B**: Complex nested JSON → demonstrate partial parse states clearly.

**Decision**: Option A. Simplicity wins. Ask for a small structured response (e.g., `{ name, category, rating }`). The pedagogical point is the STREAMING behavior, not the complexity of the JSON.

## Recommendation

1. Lineup locked as above (5 exercises, naming confirmed).
2. No runner changes — harness covers all patterns.
3. No new dependencies — use existing `zod@3.25.76` + `toJsonSchema` from `@langchain/core`.
4. Exercise 04 (extended thinking) guarded with provider check — skip silently on non-Anthropic.
5. Exercise 02 uses deterministic `RunnableLambda` as primary (throws once), real model as fallback.
6. Shape-only asserts throughout — no literal text checks.
7. Provider-agnostic exercises 01, 02, 03, 05; Anthropic-only exercise 04 with guard.

## Risks

- **`withStructuredOutput` output format drift**: `method: "functionCalling" | "jsonMode" | "jsonSchema"` — behavior differs per provider. Tests should NOT assert on the raw `AIMessage` content, only on `userReturn` (the parsed typed result). Already covered by shape-only strategy.
- **Zod v3 vs v4 ambiguity**: `zod@3.25.76` installed. `@langchain/core@1.1.40` supports both `ZodV3Like` and `ZodV4Like`. Exercises import from `zod` (v3) directly — works fine.
- **Extended thinking budget**: `budgetTokens: 1024` is the minimum. If the prompt is too complex, the model may request more tokens. Keep prompts simple (single-step reasoning).
- **`JsonOutputParser` + streaming: chunk count is model-dependent**: Number of partial chunks varies by provider and chunk size. Assert `chunks.length > 1` (not exact count).
- **`ToolInputParsingException` import path**: Lives at `@langchain/core/tools`. Confirm exact named export — confirmed in `dist/tools/index.d.ts` as `ToolInputParsingException`.
- **Voseo drift**: rg guard in PR CI catches it.

## Ready for Proposal

**Yes**. Scope bounded, APIs confirmed in `@langchain/core@1.1.40`, no new deps, no runner changes, 5 slugs locked:

1. `01-structured-output-zod`
2. `02-fallback-retry`
3. `03-streaming-json`
4. `04-extended-thinking`
5. `05-tool-schema-validation`

Next: `sdd-propose` with change-name `fase-7-advanced-patterns`.

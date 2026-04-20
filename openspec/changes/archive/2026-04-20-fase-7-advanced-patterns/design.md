# Design: Fase 7 — Track 05 Advanced Patterns

## Technical Approach

Mismo layout que Fases 3-6. Cada ejercicio importa APIs canónicas de LangChain directamente — sin helpers en `runner/`. Harness intacto: `BaseChatModel.prototype.invoke` y `_streamIterator` (ver `harness-langchain.ts`) cubren `withStructuredOutput`, `withFallbacks`, `.stream`, `thinking`, y `.bindTools`. Tests aseveran shape (`userReturn` parseado, `calls.length`, `streamed`, thinking blocks) — nunca texto literal.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|---|---|---|---|
| Structured output API (01) | `model.withStructuredOutput(zodSchema)` | manual JSON parse + prompt tricks | Canónico LC 1.x; una API tapa los 3 providers |
| 01 assertion surface | `zodSchema.safeParse(userReturn)` | assertar `response_metadata.tool_calls` | Raw shape difiere por provider (functionCalling vs jsonMode vs jsonSchema) |
| Fallback trigger (02) | `RunnableLambda` determinista que tira `Error`, wrapped con `.withFallbacks([realModel])` | Bad model-id en `ChatX` primary | Determinista en test; no depende de HTTP 404; pedagogía clara (lambda throw = simulated failure) |
| 02 primary capture count | Primary NO hace llamada al LLM (lambda tira antes) → `calls.length === 1` (solo fallback) | Primary real model con bad id (contaría) | Coherente con lambda approach: el harness captura solo cuando `BaseChatModel.invoke` corre |
| Streaming parser (03) | `prompt.pipe(model).pipe(new JsonOutputParser()).stream(...)` | Manual chunk accumulation + `JSON.parse` at end | `JsonOutputParser` maneja parse incremental; APIs canónicas |
| 03 chunk assertion | `chunks.length > 1` + última chunk satisface zod shape | `chunks.length === N` fijo | Chunk count no-determinista entre providers/runs |
| Thinking API (04) | `new ChatAnthropic({ model, thinking: { type: "enabled", budgetTokens: 1024 }, maxTokens: 2048 })` | Reasoning models de OpenAI (o1-*) | LangChain 1.x no unifica thinking/reasoning; API-específica por provider |
| 04 provider gating | `it.skipIf(process.env["LCDEV_PROVIDER"] !== "anthropic")` en `tests.test.ts` + nota en `exercise.md` | Polyfill cross-provider | Anthropic-only es honesto; evita falsos pass en OpenAI/Gemini |
| 04 thinking assertion | `AIMessage.content` es array; existe ≥1 `{type:"thinking"}` y ≥1 `{type:"text"}` | Parse `response_metadata` custom | `content` array es estable en SDK; metadata no |
| Tool schema (05) | `tool(fn, { name, description, schema: zodSchema })` + `.bindTools([t])` | `DynamicStructuredTool` legacy | `tool()` es la API 1.x recomendada |
| 05 scope | Happy-path: model llama tool con args válidos; assertar `tool_calls[0].args` matches zod | Happy + error scenario con `ToolInputParsingException` | Scope creep contenido; validación ocurre en el tool runtime — cover en doc, no en test (stretch para learner) |
| Recursion/retry caps | 02 usa `.withRetry({ stopAfterAttempt: 1 })` en primary para forzar fallback rápido | Default retry (6 attempts) | Test cost predictable; pedagogía clara |

## Data Flow

### 01-structured-output-zod
```
  prompt ──▶ model.withStructuredOutput(Schema) ──▶ parsed object (typed)
                         │
                    harness captures invoke() → calls[0]
```

### 02-fallback-retry
```
  primary (RunnableLambda throws) ──X──┐
                                       ▼
                                 fallback (real model) ──▶ AIMessage
                                       │
                              harness captures ONLY fallback → calls.length === 1
```

### 03-streaming-json
```
  prompt ─▶ model ─▶ JsonOutputParser ─▶ async iterator of partial JSON objects
                         │
            harness patches _streamIterator → calls[0].streamed === true
            chunks.length > 1, last chunk ≈ final parsed object
```

### 04-extended-thinking (Anthropic-only)
```
  ChatAnthropic({thinking}) ─▶ invoke(prompt) ─▶ AIMessage with content array
                                                 [{type:"thinking",...}, {type:"text",...}]
```

### 05-tool-schema-validation
```
  ChatX.bindTools([toolWithZod]) ─▶ invoke(prompt) ─▶ AIMessage.tool_calls[0]
                                                       args ← validated shape
```

## File Changes

| File | Action | Description |
|---|---|---|
| `code/packages/exercises/05-advanced-patterns/{01..05}/` | Create | 30 files (5 × {meta.json, starter.ts, solution.ts, tests.test.ts, es/exercise.md, en/exercise.md}) |
| `code/packages/runner/` | Untouched | Harness suficiente |
| `code/packages/exercises/package.json` | Untouched | Deps presentes |
| `openspec/specs/track-advanced-patterns/spec.md` | New at archive | Main spec |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Nota sobre `skipIf` provider-gated tests |

## Interfaces / Contracts

### 02-fallback-retry (solución-sketch)
```ts
import { RunnableLambda } from "@langchain/core/runnables";
const brokenPrimary = RunnableLambda.from(async () => {
  throw new Error("primary intentionally down");
}).withRetry({ stopAfterAttempt: 1 });
const chain = brokenPrimary.withFallbacks([realModel]);
const result = await chain.invoke("ping");
return { text: typeof result.content === "string" ? result.content : "" };
```

### 04-extended-thinking (assertion)
```ts
const last = calls.at(-1)!;
const content = last.response.content;
expect(Array.isArray(content)).toBe(true);
const blocks = content as Array<{ type: string }>;
expect(blocks.some((b) => b.type === "thinking")).toBe(true);
expect(blocks.some((b) => b.type === "text")).toBe(true);
```

### 05-tool-schema-validation (shape)
```ts
const weather = tool(
  async ({ city }) => `Sunny in ${city}`,
  { name: "get_weather", description: "...", schema: z.object({ city: z.string() }) },
);
const bound = model.bindTools([weather]);
const ai = await bound.invoke("Weather in Lima?");
const tc = (ai.tool_calls ?? [])[0];
expect(z.object({ city: z.string() }).safeParse(tc?.args).success).toBe(true);
```

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Integration | Cada `tests.test.ts` vía `runUserCode` con `LCDEV_TARGET=starter\|solution` | `beforeAll` gate sobre API key (fail-fast, igual que tracks previos) |
| Shape | `userReturn` parseado, `calls.length`, `streamed` flag, thinking blocks, tool_calls[0].args | Nunca texto literal |
| Provider gate | 04 usa `it.skipIf(provider !== "anthropic")` | Lee `process.env["LCDEV_PROVIDER"]` |
| Verify | Voseo `rg` guard sobre `packages/exercises/` | Reusa grep existente |
| Smoke | `lcdev list` → 25 entradas; `lcdev verify` por cada ejercicio en provider válido | Manual post-apply |

## Migration / Rollout

Aditivo. Sin migración. Revert por ejercicio: `git rm -r code/packages/exercises/05-advanced-patterns/<id>/`. Sin deps nuevas.

## Open Questions

- [ ] **02 primary capture exact count**: confirmar en apply que `RunnableLambda.withRetry({stopAfterAttempt:1})` + `withFallbacks` produce exactamente 1 captura (solo fallback). Si LangChain bumpea retry internals, ajustar el lower-bound a `>= 1`.
- [ ] **04 thinking block ordering**: el SDK devuelve thinking antes de text en v1.x; si cambia, el test usa `some()` sobre el array, no index fijo — ya cubierto.
- [ ] **05 ToolInputParsingException como stretch**: dejar como nota en `exercise.md` (sección "Bonus"), NO en test obligatorio, para mantener scope.

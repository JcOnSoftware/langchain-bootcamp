# Design: Fase 8 — Track 06 Observability

## Technical Approach

Mismo layout que Fases 3-7. Cada ejercicio importa APIs canónicas de LangChain directamente — sin helpers en `runner/`. Harness intacto: el patch en `BaseChatModel.prototype.invoke` + `_streamIterator` (ver `harness-langchain.ts`) captura `response_metadata` y `usage_metadata` — suficiente para cost, tracing runs y events de todos los casos de Fase 8. Tests aseveran shape (`userReturn` keys, `calls.length`, event-type presence, arithmetic consistency, `wrapperTypes[]` declarativo) — nunca literal text ni conteos exactos.

## Architecture Decisions

| # | Decision | Choice | Alternative | Rationale |
|---|---|---|---|---|
| 01a | Tracing primary (01) | `RunCollectorCallbackHandler` de `@langchain/core/tracers/run_collector` vía `{ callbacks: [collector] }` en invoke options | `langsmith/run_collector_callback_handler` directo | LC core re-exporta — path estable a bumps de `langsmith` transitive |
| 01b | Tracing secundario (01) | `LangChainTracer` de `@langchain/core/tracers/tracer_langchain`, gated `skipIf(!LANGCHAIN_API_KEY)` | Forzar LangSmith HTTP siempre | Path offline siempre verde; integración real demostrada solo si hay key |
| 01c | Assertion (01) | `collectedRuns.length >= 1`; cada run tiene `id`, `name`, `run_type` | Filtrar por `run_type === "llm"` | Collector captura chain + llm; filter inflexible a LCEL wrappers |
| 02a | Handler base (02) | `class MyHandler extends BaseCallbackHandler` con `name = "my-handler"` instancia | `DynamicCallbackHandler` | `BaseCallbackHandler` es el contrato 1.x; `name` es required |
| 02b | Events capturados (02) | Override `handleLLMStart`, `handleLLMEnd`, `handleChainStart`, `handleChainEnd` → push a `events[]` de la instancia | Solo LLM hooks | 4 hooks muestran lifecycle completo LLM + chain — pedagogía |
| 02c | Assertion (02) | `events` incluye los strings que el handler empuja (`llm_start`, `llm_end`) + `events.length >= 2` | Contar events exactos | Sumarios difieren por provider; presencia de tipos es estable |
| 03a | Rate table (03) | Hardcoded inline con comment `// validate 2026-H2`: Haiku 4.5, Sonnet 4.5, GPT-5, Gemini 2.5 Flash | Importar `cli/src/cost.ts` | Learner construye calculador — concepto > reuso; CLI independiente |
| 03b | Usage source (03) | `response.usage_metadata.input_tokens` / `output_tokens` (AIMessage) | `response_metadata.tokenUsage` raw | `usage_metadata` es el campo normalizado LC core@1.x — cross-provider |
| 03c | Assertion (03) | `totalCost > 0`; `totalCost === inputCost + outputCost` (±1e-9); `inputTokens > 0 && outputTokens > 0` | Aritmética exacta por fixture | Token count varía; arithmetic consistency es invariante |
| 04a | Debug primario (04) | `chain.streamEvents({ version: "v2" })` iterado, collect `event` strings | `ConsoleCallbackHandler` | Stdout pollution; pedagogía de stream events v2 |
| 04b | Debug secundario (04) | Spy handler extends `BaseCallbackHandler` con `handleLLMStart/End`, `handleChainStart/End` capturando `{ type, runId }` a array | Tap helpers | Dos angles: events-driven + callback-driven |
| 04c | Assertion (04) | `eventTypes` incluye `on_chat_model_start` y `on_chat_model_end`; `handlerEvents.length >= 2`; `calls.length >= 1` | `on_llm_*` | Chat models emiten `on_chat_model_*` en 1.x; `on_llm_*` es para LLMs clásicos |
| 05a | Capstone (05) | 5 wrappers aplicados a base model: `.withRetry({ stopAfterAttempt: 2 })`, `.withFallbacks([backup])`, cost-callback, error-boundary-callback, `RunCollectorCallbackHandler` | Framework de plugins | 5 primitives core LC — cubre retry, fallback, observability, cost, error |
| 05b | Wrappers declarativos (05) | Solution construye `wrapperTypes: string[]` manualmente en el return | Inspección runtime del chain | Inspección frágil; declaración explícita = contrato con el learner |
| 05c | Assertion (05) | `wrapperTypes.length === 5` + cada expected string presente; `callSucceeded === true`; `tracedRuns.length >= 1`; `calls.length >= 1` | Inspeccionar metadata del chain | Shape-only consistente con Fases 3-7 |
| ALL | Timeout | `test.timeout = 30_000ms` por test (LLM calls lentos) | Default 5s | Cross-provider variance en API latency |

## Data Flow

### 01-langsmith-tracing
```
  prompt ─▶ model.invoke(prompt, { callbacks: [collector, (tracer?)] })
              │
              ├─▶ RunCollectorCallbackHandler.tracedRuns[] (offline, siempre)
              └─▶ LangChainTracer → LangSmith HTTP (si LANGCHAIN_API_KEY)
```

### 02-custom-callbacks
```
  MyHandler extends BaseCallbackHandler
      │
      invoke(prompt, { callbacks: [handler] })
      │
      ├─▶ handleLLMStart → events.push({type:"llm_start"})
      └─▶ handleLLMEnd   → events.push({type:"llm_end"})
```

### 03-cost-tracking
```
  model.invoke(prompt) ─▶ AIMessage.usage_metadata
                              │
                              ▼
                   computeCost(modelId, usage) ─▶ { inputCost, outputCost, totalCost }
```

### 04-debug-chains
```
  chain.streamEvents({version:"v2"})  ─▶ eventTypes: ["on_chat_model_start", ...]
  spyHandler via callbacks            ─▶ handlerEvents: [{type,runId}, ...]
```

### 05-production-checklist (capstone)
```
  base model ─▶ withRetry ─▶ withFallbacks([backup]) ─▶ invoke with callbacks:
                                                         [costCB, errorCB, collector]
                                    │
                                    └─▶ wrapperTypes = ["withRetry","withFallbacks",
                                        "costCallback","errorBoundary","runCollector"]
```

## File Changes

| File | Action | Description |
|---|---|---|
| `code/packages/exercises/06-observability/{01..05}/` | Create | 30 files (5 × {meta.json, starter.ts, solution.ts, tests.test.ts, es/exercise.md, en/exercise.md}) |
| `code/packages/runner/` | Untouched | Harness cubre todos los casos |
| `code/packages/exercises/package.json` | Untouched | `langsmith` ya transitive; zero new deps |
| `code/packages/cli/src/cost.ts` | Untouched | Exercise 03 construye su propio calculator |
| `openspec/specs/track-observability/spec.md` | New at archive | Main spec |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Nota sobre callback attach pattern + streamEvents v2 |

## Interfaces / Contracts

### 01 `userReturn`
```ts
{ collectedRuns: Run[], tracingEnabled: boolean }
```

### 02 `userReturn`
```ts
{ events: Array<{ type: string; payload?: unknown }> }
```

### 03 `userReturn`
```ts
{ modelId: string, inputTokens: number, outputTokens: number,
  inputCost: number, outputCost: number, totalCost: number }
```

### 04 `userReturn`
```ts
{ eventTypes: string[], handlerEvents: Array<{ type: string; runId?: string }> }
```

### 05 `userReturn`
```ts
{ wrapperTypes: string[], callSucceeded: boolean, tracedRuns: Run[] }
// wrapperTypes ∈ ["withRetry","withFallbacks","costCallback","errorBoundary","runCollector"]
```

### 02 handler (sketch)
```ts
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
export class MyHandler extends BaseCallbackHandler {
  name = "my-handler";
  events: Array<{ type: string; payload?: unknown }> = [];
  handleLLMStart() { this.events.push({ type: "llm_start" }); }
  handleLLMEnd()   { this.events.push({ type: "llm_end" }); }
}
```

### 03 cost calc (sketch)
```ts
const RATES = {
  "claude-haiku-4-5":   { input: 1.0, output: 5.0 }, // USD per 1M tokens, validate 2026-H2
  "claude-sonnet-4-5":  { input: 3.0, output: 15.0 },
  "gpt-5":              { input: 2.5, output: 10.0 },
  "gemini-2.5-flash":   { input: 0.075, output: 0.3 },
} as const;
function computeCost(id: keyof typeof RATES, u: { input_tokens: number; output_tokens: number }) {
  const r = RATES[id];
  const inputCost  = (u.input_tokens  / 1_000_000) * r.input;
  const outputCost = (u.output_tokens / 1_000_000) * r.output;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}
```

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Integration | Cada `tests.test.ts` vía `runUserCode` + `LCDEV_TARGET=starter\|solution` | `beforeAll` guarda API key (fail-fast) igual que Fases 3-7 |
| Shape | `userReturn` parseado con zod ad-hoc, `calls.length >= 1`, event-type presence, arithmetic consistency | Nunca literal text |
| Env gate | 01 bloque tracer usa `it.skipIf(!process.env["LANGCHAIN_API_KEY"])` | Collector block siempre runs |
| Timeout | 30_000 ms por test | LLM latency cross-provider |
| Verify | Voseo `rg` guard sobre `06-observability/**/es/*.md` | Reusa grep de Fase 7 |
| Smoke | `lcdev list` → 30 entradas; `lcdev verify <id> --solution` por ejercicio | Manual post-apply |

## Migration / Rollout

Aditivo. Sin migración. Revert por ejercicio: `git rm -r code/packages/exercises/06-observability/<id>/` — cada ejercicio es self-contained. Harness intacto; sin deps runtime nuevas (zero-install Fase 8).

## Open Questions

- [ ] **04 `on_chat_model_*` stability**: confirmar en apply que `streamEvents v2` emite el prefix `on_chat_model_*` para los 3 providers; si Gemini/OpenAI usan `on_llm_*` en lieu, relajar assertion a `(eventTypes.some(e => e.startsWith("on_chat_model_")) || eventTypes.some(e => e.startsWith("on_llm_")))`.
- [ ] **05 error-boundary trigger**: decidir en apply si el error-boundary-callback se dispara con un fallback scenario determinista (RunnableLambda throw en primary) o se limita a `handleLLMError` override sin trigger real. Recomendación: sin trigger — el handler declara presencia, `callSucceeded` captura el happy-path.
- [ ] **03 modelId normalization**: `usage_metadata.modelId` no existe; el learner debe leer `response.response_metadata.model_name` vía harness `call.model` y pasarlo a `computeCost`. Confirmar que el model id devuelto por cada provider matchea las keys de `RATES` (fallback: learner hace normalización explícita).

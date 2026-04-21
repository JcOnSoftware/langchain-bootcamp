# Tasks: Fase 8 — Track 06 Observability

TDD: RED → GREEN → REFACTOR.

## Phase 1: Pre-flight

- [ ] 1.1 Verify `RunCollectorCallbackHandler` resolves from `@langchain/core/tracers/run_collector` (NOT langsmith direct) — `import { RunCollectorCallbackHandler } from "@langchain/core/tracers/run_collector"` in a scratch test
- [ ] 1.2 Verify `LangChainTracer` from `@langchain/core/tracers/tracer_langchain`, `BaseCallbackHandler` from `@langchain/core/callbacks/base`, and `streamEvents({ version: "v2" })` via `chain.streamEvents` all resolve without type errors; `bunx tsc --noEmit` clean
- [ ] 1.3 Probe `on_chat_model_*` vs `on_llm_*` prefix for `streamEvents v2`: run a minimal `chain.streamEvents` call and collect emitted `.event` strings — confirm `on_chat_model_start` / `on_chat_model_end` appear for `ChatAnthropic` / `ChatOpenAI` / `ChatGoogleGenerativeAI`; if only `on_llm_*` emitted, update spec assert accordingly before authoring 04
- [ ] 1.4 Confirm `usage_metadata.input_tokens` is populated in `calls[0].response.usage_metadata` for all 3 providers using existing test captures; confirm `calls[0].model` format matches RATES keys learner will define in 03

## Phase 2: 5 Exercises (TDD per exercise)

For each of `01-langsmith-tracing`, `02-custom-callbacks`, `03-cost-tracking`, `04-debug-chains`, `05-production-checklist`:

- [ ] 2.x.1 Create `code/packages/exercises/06-observability/{id}/` and write `meta.json` — fields: `id`, `track: "06-observability"`, `title`, `version: "0.1.0"`, `valid_until`, `concepts`, `estimated_minutes`, `requires`, `locales: ["es","en"]`
- [ ] 2.x.2 RED: write `tests.test.ts` using `runUserCode(resolveExerciseFile(import.meta.url))` — assertions per spec:
  - 01: main suite always runs — `collectedRuns.length >= 1`, each entry has `id`, `name`, `run_type` keys; inner `it.skipIf(!process.env.LANGCHAIN_API_KEY)` for `LangChainTracer` wired scenario only
  - 02: `events` includes ≥1 `{ type: "handleLLMStart" }` and ≥1 `{ type: "handleLLMEnd" }`; `events.length >= 2`; `calls.length >= 1`
  - 03: `inputTokens > 0`, `outputTokens > 0`, `totalCost > 0`, `Math.abs(totalCost - (inputCost + outputCost)) < 1e-9`; `calls.length >= 1`
  - 04: `eventTypes` includes `"on_chat_model_start"` and `"on_chat_model_end"`; `handlerEvents.length >= 2`; `calls.length >= 1`
  - 05: `wrapperTypes` contains all of `["withRetry","withFallbacks","costCallback","errorBoundary","runCollector"]`; `wrapperTypes.length >= 5`; `callSucceeded === true`; `tracedRuns.length >= 1`; `calls.length >= 1`
- [ ] 2.x.3 GREEN: write `solution.ts` with default async `run()`:
  - 01: `new RunCollectorCallbackHandler()`; invoke chain with `{ callbacks: [collector] }`; if `LANGCHAIN_API_KEY` also push `new LangChainTracer()`; return `{ collectedRuns: collector.tracedRuns.map(r => ({ id: r.id, name: r.name, run_type: r.run_type })), tracingEnabled: !!process.env.LANGCHAIN_API_KEY }`
  - 02: class extending `BaseCallbackHandler` with `name`, `handleLLMStart`, `handleLLMEnd` pushing `{ type }` to `events[]`; invoke chain with handler; return `{ events }`
  - 03: invoke chain; read `response.usage_metadata`; define RATES table inline; compute `inputCost`, `outputCost`, `totalCost`; return `{ modelId, inputTokens, outputTokens, inputCost, outputCost, totalCost }`
  - 04: call `chain.streamEvents(input, { version: "v2" })`; collect `.event` strings into `eventTypes` Set; spy handler collects `{ type, runId }`; return `{ eventTypes: [...eventTypes], handlerEvents }`
  - 05: compose chain with `.withRetry({ stopAfterAttempt: 2 })`, `.withFallbacks([backupModel])`, cost-callback, error-boundary-callback, `RunCollectorCallbackHandler`; declare `wrapperTypes` array; invoke; return `{ wrapperTypes, callSucceeded: true, tracedRuns: collector.tracedRuns }`
- [ ] 2.x.4 REFACTOR: write `starter.ts` = solution structure with implementation replaced by `// TODO:` markers; add `// Docs:` header with canonical LangChain URLs:
  - 01: `https://js.langchain.com/docs/how_to/callbacks/` + `https://js.langchain.com/docs/integrations/providers/langsmith/`
  - 02: `https://js.langchain.com/docs/how_to/custom_callbacks/`
  - 03: `https://js.langchain.com/docs/how_to/callbacks/`
  - 04: `https://js.langchain.com/docs/how_to/streaming/#using-stream-events`
  - 05: `https://js.langchain.com/docs/how_to/callbacks/` (all techniques combined)
- [ ] 2.x.5 Write `es/exercise.md` (peruano neutro tuteo — NO voseo; check: tú/tienes/puedes) + `en/exercise.md`. For 01, note: "El escenario de `LangChainTracer` se omite automáticamente si `LANGCHAIN_API_KEY` no está configurada." 40-80 lines each.

## Phase 3: Cross-cutting

- [ ] 3.1 Verify `code/packages/exercises/src/index.ts` — confirm `06-observability` is auto-discovered (path-based); if explicit registration required, add entry matching pattern of tracks 01–05
- [ ] 3.2 Check `code/packages/cli/src/i18n/en.json` + `es.json` — add track title/description key for `06-observability` if tracks 01–05 have named entries; match key naming pattern exactly
- [ ] 3.3 Confirm `docs/EXERCISE-CONTRACT.md` — append `## LangSmith-gated tests (skipIf)` section if not already present (Fase 7 may have added `provider-gated` section; extend it or add new heading); one short paragraph explaining `skipIf(!LANGCHAIN_API_KEY)` pattern

## Phase 4: Verify

- [ ] 4.1 `bunx tsc --noEmit` from `code/` — zero errors
- [ ] 4.2 `bun test` from `code/` (`LCDEV_TARGET=starter`) — tracks 01–05 unaffected; track 06 starter tests expected to fail (student-authored)
- [ ] 4.3 `LCDEV_TARGET=solution bun test packages/exercises/06-observability` — all 5 solution suites green (with live API key)
- [ ] 4.4 `LCDEV_TARGET=solution bun test` from `code/` — full suite green; zero regressions on tracks 01–05
- [ ] 4.5 Runner untouched: `git diff HEAD code/packages/runner/` → empty diff
- [ ] 4.6 Voseo guard: `rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|ponete)\b' code/packages/exercises/06-observability/` → zero hits
- [ ] 4.7 `skipIf` guard: `rg "skipIf" code/packages/exercises/06-observability/` → ONLY `01-langsmith-tracing/tests.test.ts` matches, and only on the inner `LangChainTracer` block (not the whole suite)
- [ ] 4.8 File count: `fd -t f . code/packages/exercises/06-observability/ | wc -l` → 30
- [ ] 4.9 No new deps: `git diff HEAD code/packages/exercises/package.json` → empty
- [ ] 4.10 Smoke: `lcdev list --locale es` → 30 entries (6 tracks × 5 exercises); `lcdev list --locale en` → 30 entries

## Totals

- Phase 1: 4
- Phase 2: 25 (5 per exercise × 5)
- Phase 3: 3
- Phase 4: 10
- **Total: 42 tasks**

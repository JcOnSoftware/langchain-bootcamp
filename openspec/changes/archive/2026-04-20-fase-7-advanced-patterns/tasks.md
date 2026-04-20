# Tasks: Fase 7 — Track 05 Advanced Patterns

TDD: RED → GREEN → REFACTOR.

## Phase 1: Pre-flight

- [ ] 1.1 Verify imports resolve from installed packages: `withStructuredOutput` (via `BaseChatModel`), `withFallbacks` (via `Runnable`), `JsonOutputParser` from `@langchain/core/output_parsers`, `RunnableLambda` from `@langchain/core/runnables`, `tool` from `@langchain/core/tools`, `ChatAnthropic` from `@langchain/anthropic` (with `thinking` option typings)
- [ ] 1.2 Confirm harness captures streaming flag: call `resolveExerciseFile` in a scratch test using `JsonOutputParser + .stream()` and assert `calls[0].streamed === true` — verify harness `_streamIterator` patch fires
- [ ] 1.3 Resolve open question for 02: confirm that `RunnableLambda.from(async () => { throw ... }).withRetry({ stopAfterAttempt: 1 }).withFallbacks([realModel])` produces exactly 1 capture (harness only sees `BaseChatModel` invoke — lambda doesn't register); if `calls.length === 0` before fallback runs, adjust spec to `>= 1` lower-bound and document

## Phase 2: 5 Exercises (TDD per exercise)

For each of `01-structured-output-zod`, `02-fallback-retry`, `03-streaming-json`, `04-extended-thinking`, `05-tool-schema-validation`:

- [ ] 2.x.1 Create `code/packages/exercises/05-advanced-patterns/{id}/` and write `meta.json` — fields: `id`, `track: "05-advanced-patterns"`, `title`, `version: "0.1.0"`, `valid_until`, `concepts`, `estimated_minutes`, `requires`, `locales: ["es","en"]`
- [ ] 2.x.2 RED: write `tests.test.ts` using `runUserCode(resolveExerciseFile(import.meta.url))` — assertions per spec:
  - 01: `calls.length >= 1`, `userReturn` non-null object, all declared zod schema fields present as keys via `zodSchema.safeParse(userReturn).success === true`
  - 02: `userReturn.usedFallback === true`, `userReturn.result` non-empty string, `calls.length >= 1`
  - 03: `userReturn.chunks.length > 1`, `userReturn.final` is non-null object, top-level keys match prompt schema
  - 04: `it.skipIf(process.env["LCDEV_PROVIDER"] !== "anthropic")` guard; `calls.length >= 1`; `userReturn.hasThinking === true`; `userReturn.hasText === true`; `content` array has ≥1 `{type:"thinking"}` and ≥1 `{type:"text"}` block (use `some()`, never index)
  - 05: `calls.length >= 1`, `userReturn.validResult` truthy, `z.object({...}).safeParse(tc?.args).success === true`, `userReturn.validationError` non-empty string
- [ ] 2.x.3 GREEN: write `solution.ts` with default async `run()`:
  - 01: `model.withStructuredOutput(zodSchema)` where `zodSchema = z.object({...})` ≥2 fields; invoke chain; return parsed object directly
  - 02: `RunnableLambda.from(async () => { throw new Error("primary intentionally down") }).withRetry({ stopAfterAttempt: 1 })` as primary; `.withFallbacks([realModel])`; invoke; return `{ result: string, usedFallback: true }`
  - 03: `prompt.pipe(model).pipe(new JsonOutputParser()).stream(input)`; collect chunks into array; return `{ chunks: unknown[], final: chunks.at(-1) }`
  - 04: `new ChatAnthropic({ model, thinking: { type: "enabled", budgetTokens: 1024 }, maxTokens: 2048 })`; invoke prompt; return `{ content: ai.content, hasThinking: boolean, hasText: boolean }`
  - 05: `tool(async ({ city }) => ..., { name, description, schema: z.object({ city: z.string() }) })`; `model.bindTools([t]).invoke(prompt)`; also attempt direct tool call with invalid args inside `try/catch`; return `{ validResult, validationError }`
- [ ] 2.x.4 REFACTOR: write `starter.ts` = solution structure with implementation replaced by `// TODO:` markers; add `// Docs:` header with canonical LangChain URLs per exercise:
  - 01: `https://js.langchain.com/docs/how_to/structured_output/`
  - 02: `https://js.langchain.com/docs/how_to/fallbacks/`
  - 03: `https://js.langchain.com/docs/how_to/streaming/`
  - 04: `https://js.langchain.com/docs/integrations/chat/anthropic/` (thinking section)
  - 05: `https://js.langchain.com/docs/how_to/tool_calling/`
- [ ] 2.x.5 Write `es/exercise.md` (peruano neutro tuteo — NO voseo; check: tú/tienes/puedes) + `en/exercise.md`. For 04, include explicit note: "Este ejercicio solo corre con `LCDEV_PROVIDER=anthropic`; se omite automáticamente en otros providers." For 05, add "Bonus" section hinting at `ToolInputParsingException` as stretch goal (NOT in tests). 40-80 lines each.

## Phase 3: Cross-cutting

- [ ] 3.1 Verify `packages/exercises/src/index.ts` — confirm track `05-advanced-patterns` is auto-discovered (path-based, no manual registration needed); if explicit registration required, add entry matching pattern of tracks 01–04
- [ ] 3.2 Check `packages/cli/src/i18n/en.json` + `es.json` — add track title/description key for `05-advanced-patterns` if tracks 01–04 have named entries; match key naming pattern exactly
- [ ] 3.3 Confirm `docs/EXERCISE-CONTRACT.md` — append note on provider-gated `skipIf` pattern and when to use it (Anthropic-only exercises); one short paragraph, no structural changes

## Phase 4: Verify

- [ ] 4.1 `bunx tsc --noEmit` from `code/` — zero errors
- [ ] 4.2 `bun test` from `code/` (default starter target, `LCDEV_TARGET=starter`) — tracks 01–04 unaffected; track 05 starter tests expected to fail (student-design)
- [ ] 4.3 `LCDEV_TARGET=solution bun test packages/exercises/05-advanced-patterns` — all 5 solution suites green (with valid API key for provider)
- [ ] 4.4 `LCDEV_TARGET=solution bun test` from `code/` — full suite green; zero regressions on tracks 01–04
- [ ] 4.5 Voseo guard: `rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete|empezá)\b' code/packages/exercises/05-advanced-patterns/` → zero hits
- [ ] 4.6 `skipIf` guard check: `rg "skipIf" code/packages/exercises/05-advanced-patterns/` → only `04-extended-thinking/tests.test.ts` matches
- [ ] 4.7 Runner untouched: `git diff HEAD code/packages/runner/` → empty diff
- [ ] 4.8 File count: `fd -t f . code/packages/exercises/05-advanced-patterns/ | wc -l` → 30
- [ ] 4.9 Smoke: `lcdev list --locale es` → 25 entries (5 tracks × 5 exercises); `lcdev list --locale en` → 25 entries
- [ ] 4.10 Live smoke: `lcdev verify 01-structured-output-zod --solution` green; `lcdev verify 04-extended-thinking --solution` green (with `LCDEV_PROVIDER=anthropic`)

## Totals

- Phase 1: 3
- Phase 2: 25 (5 per exercise × 5)
- Phase 3: 3
- Phase 4: 10
- **Total: 41 tasks**

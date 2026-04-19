# Tasks: Fase 3 — Track 01 Composition

TDD active: RED (failing test) → GREEN (make pass) → REFACTOR. One commit per phase.

## Phase 1: Foundation (render + provider factory)

- [ ] 1.1 RED: add 3 cases to `cli/src/render.test.ts` — `isAIMessage` positive (`_getType === "ai"`), `isAIMessage` rejects `_getType === "human"`, `extractAIText` on string content + on mixed-blocks array
- [ ] 1.2 GREEN: implement `isAIMessage` + `extractAIText` + priority branch in `cli/src/render.ts` (AIMessage check BEFORE existing SDK shape detectors)
- [ ] 1.3 REFACTOR: confirm `renderReturn` reads naturally; inline the AIMessage branch docstring pointing at spec `render-ai-message`
- [ ] 1.4 RED: add `provider.test.ts` case asserting `createChatModel("anthropic", "sk-ant-x")._llmType()` returns expected anthropic type (1 case per provider = 3 cases)
- [ ] 1.5 GREEN: implement `createChatModel(provider, apiKey, opts?)` in `cli/src/provider/index.ts` returning `ChatAnthropic` / `ChatOpenAI` / `ChatGoogleGenerativeAI` with cheap default models (haiku / gpt-4o-mini / gemini-2.5-flash)
- [ ] 1.6 Resolve open-question: export `createChatModel` via workspace path; update `cli/package.json` exports map if subpath needed

## Phase 2: Exercises (TDD per exercise — repeat for each)

For each of `01-hello-chain`, `02-sequential`, `03-branch`, `04-custom-runnable`, `05-batch`:

- [ ] 2.x.1 Create dir `packages/exercises/01-composition/{id}/` and write `meta.json` (`locales: ["es","en"]`, `track: "01-composition"`, `estimated_minutes`, `concepts`, `model_cost_hint`)
- [ ] 2.x.2 RED: write `tests.test.ts` using `runUserCode(resolveExerciseFile(import.meta.url))` — shape asserts per track-composition spec (call count, model id regex, usage > 0, LCEL-specific shape)
- [ ] 2.x.3 GREEN: write `solution.ts` — default async `run()` using `createChatModel` + LCEL constructs specific to the exercise
- [ ] 2.x.4 REFACTOR: write `starter.ts` = solution with the LCEL wiring replaced by `// TODO:` markers; add `// Docs:` header anchored to canonical LangChain 1.0 URL
- [ ] 2.x.5 Write `es/exercise.md` (peruano neutro tuteo — NO voseo) and `en/exercise.md`. Include: goal, what to complete, how to verify, success criteria

Special note 2.3.3: lock `03-branch` routing on input-length (deterministic, 1 model call per invocation) — matches design's deferred decision.

## Phase 3: Integration wiring + rename + docs

- [ ] 3.1 Rename `01-first-call` → `01-hello-chain` in `cli/src/commands/cli.integration.test.ts` (7 spots)
- [ ] 3.2 Run `bun test packages/cli/src/commands/` — the 7 previously-failing cases now pass against real exercise
- [ ] 3.3 Write `docs/EXERCISE-CONTRACT.md` — port from sibling, replace SDK-level assert examples with LangChain-level (captured AIMessage, usage_metadata, tool_calls)

## Phase 4: Verify + Docs polish

- [ ] 4.1 Run full `bun test` — expect all green (105 + 4 new harness tests now + new exercise + integration) 
- [ ] 4.2 Run `bunx tsc --noEmit` — expect clean
- [ ] 4.3 Voseo guard: `rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete)\b' code/packages/exercises/` — expect zero hits; fix any in place
- [ ] 4.4 Smoke: `lcdev list --locale es` shows 5 entries under `01-composition`; `lcdev list --locale en` same
- [ ] 4.5 Live smoke (if ANTHROPIC_API_KEY present): `lcdev verify 01-hello-chain --solution` green; `lcdev run 01-hello-chain --solution` prints text content (not JSON blob)
- [ ] 4.6 Update root `README.md` + `README.es.md` with one-liner advertising track 01 as available

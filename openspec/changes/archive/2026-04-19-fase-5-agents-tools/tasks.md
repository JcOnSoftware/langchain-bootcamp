# Tasks: Fase 5 — Track 03 Agents & Tools

TDD active: RED → GREEN → REFACTOR.

## Phase 1: Pre-flight

- [ ] 1.1 Verify `@langchain/langgraph`, `@langchain/langgraph-checkpoint`, `@langchain/core/tools`, `zod` are all importable from exercises package (they already are — this is just a sanity touch before writing exercises)
- [ ] 1.2 Resolve open questions at apply:
  - (a) tool_choice forcing for 01-bind-tools — prefer explicit system prompt for cross-provider portability
  - (b) 03-multi-tool-recovery `errorSeen` — use module-level flag in tool closure, not count comparison

## Phase 2: Exercises (TDD per exercise — repeat for each of 5)

For each of `01-bind-tools`, `02-react-agent`, `03-multi-tool-recovery`, `04-agent-memory`, `05-streaming-steps`:

- [ ] 2.x.1 Create dir `packages/exercises/03-agents-tools/{id}/` and write `meta.json` (locales, track, concepts, estimated_minutes, model_cost_hint, valid_until)
- [ ] 2.x.2 RED: write `tests.test.ts` using `runUserCode(resolveExerciseFile(import.meta.url))` — asserts per `track-agents-tools` spec (lower-bound calls.length, tool_call names, userReturn shape, errorSeen/turn keys where applicable)
- [ ] 2.x.3 GREEN: write `solution.ts` — default async `run()` with:
  - createChatModel from @lcdev/runner
  - tool() from @langchain/core/tools + Zod schemas (inline tool bodies)
  - createReactAgent from @langchain/langgraph/prebuilt (exercises 2-5)
  - MemorySaver from @langchain/langgraph-checkpoint (exercise 4 only)
  - agent.stream (exercise 5 only)
- [ ] 2.x.4 REFACTOR: write `starter.ts` = solution with agent/tool wiring replaced by `// TODO:` markers + `// Docs:` header (canonical LangChain URLs: langgraph prebuilt, core tools, checkpointer docs)
- [ ] 2.x.5 Write `es/exercise.md` (peruano neutro tuteo — NO voseo) + `en/exercise.md`. Cover: goal, concepts, what to complete, how to verify, success criteria, hints. 40-80 lines.

## Phase 3: Docs (optional)

- [ ] 3.1 Append a short §Agents & tool_calls assertions section to `docs/EXERCISE-CONTRACT.md` — restate the NAME-not-ARGS discipline + `calls.length >= N` lower-bound convention

## Phase 4: Verify + polish

- [ ] 4.1 Full `bun test` from `code/` — expect Fase 3 + Fase 4 solution-target tests remain green; Fase 5 tests gated on chat-provider key with fail-fast
- [ ] 4.2 `LCDEV_TARGET=solution bun test` from `code/` (with .env loaded) — expect all solutions green including Fase 5
- [ ] 4.3 `bunx tsc --noEmit` — expect clean
- [ ] 4.4 Voseo guard: `rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete|empezá|cancelá)\b' code/packages/exercises/` → zero hits
- [ ] 4.5 Smoke: `lcdev list --locale {es,en}` → 15 entries total (5 × 3 tracks)
- [ ] 4.6 Live smoke: `lcdev verify 02-react-agent --solution` green; `lcdev run 02-react-agent --solution` prints readable final answer
- [ ] 4.7 Count: `fd -t f . code/packages/exercises/03-agents-tools/ | wc -l` → 30

## Totals

- Phase 1: 2
- Phase 2: 25 (5 per exercise × 5)
- Phase 3: 1 (optional)
- Phase 4: 7
- **Total: 35 tasks**

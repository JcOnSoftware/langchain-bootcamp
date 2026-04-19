# Tasks: Fase 6 — Track 04 LangGraph

TDD: RED → GREEN → REFACTOR.

## Phase 1: Pre-flight

- [ ] 1.1 Verify imports from `@langchain/langgraph` root: `StateGraph`, `Annotation`, `MessagesAnnotation`, `START`, `END`, `interrupt`, `Command`, `MemorySaver`
- [ ] 1.2 Resolve open questions at apply:
  - (a) Subgraph state-key sharing in 03 → overlapping annotation keys between subgraph + outer
  - (b) `addConditionalEdges` signature → pragmatic `(sourceNode, routerFn, allowedDestinations[])` — verify by reading installed types

## Phase 2: 5 Exercises (TDD per exercise)

For each of `01-state-graph-basics`, `02-react-as-graph`, `03-subagents-hitl`, `04-event-streaming`, `05-checkpoint-resume`:

- [ ] 2.x.1 Create `code/packages/exercises/04-langgraph/{id}/` and write `meta.json` (locales, track, concepts, estimated_minutes, model_cost_hint for LLM exercises)
- [ ] 2.x.2 RED: write `tests.test.ts` using `runUserCode(resolveExerciseFile(import.meta.url))` — asserts per `track-langgraph` spec (call count, userReturn keys, flags, event types). 01 and 05 DON'T need API-key fail-fast since no LLM.
- [ ] 2.x.3 GREEN: write `solution.ts` with default async `run()`:
  - 01: Annotation.Root state + 2 nodes + START/END edges, no LLM
  - 02: StateGraph<MessagesAnnotation> + agent + hand-rolled tools node + conditional edge, with createChatModel
  - 03: main graph with subgraph-as-node + interrupt + Command({resume}) + MemorySaver
  - 04: `graph.streamEvents(input, { version: "v2" })` + count-by-event, with createChatModel
  - 05: 3-step graph + MemorySaver + interrupt + Command({resume}) + getState inspection, no LLM
- [ ] 2.x.4 REFACTOR: write `starter.ts` = solution with graph wiring replaced by `// TODO:` markers + `// Docs:` header pointing to canonical LangGraph URLs (StateGraph, Annotation, interrupt, MemorySaver)
- [ ] 2.x.5 Write `es/exercise.md` (peruano neutro tuteo — NO voseo) + `en/exercise.md`. For 03 and 05, EXPLICITLY warn against wrapping `graph.invoke` in `try/catch` (GraphInterrupt propagates by design). 40-80 lines each.

## Phase 3: Docs

- [ ] 3.1 (Optional) Append §Graphs & interrupts section to `docs/EXERCISE-CONTRACT.md` — restate the no-try/catch rule + shape-only discipline for graph exercises

## Phase 4: Verify

- [ ] 4.1 `bunx tsc --noEmit` from `code/` — clean
- [ ] 4.2 `bun test` from `code/` (default starter target) — expect Fase 3+4+5 starters behave as before; Fase 6 starter fails are student-experience by design
- [ ] 4.3 `LCDEV_TARGET=solution bun test` from `code/` — expect all solutions green; total ~209 tests
- [ ] 4.4 Voseo guard: `rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete|empezá|cancelá)\b' code/packages/exercises/` → zero hits
- [ ] 4.5 Smoke: `lcdev list --locale {es,en}` → 20 entries total (4 tracks × 5)
- [ ] 4.6 Live smoke: `lcdev verify 02-react-as-graph --solution` green (with live API); `lcdev verify 05-checkpoint-resume --solution` green (no API needed)
- [ ] 4.7 File count: `fd -t f . code/packages/exercises/04-langgraph/ | wc -l` → 30

## Totals

- Phase 1: 2
- Phase 2: 25 (5 per exercise × 5)
- Phase 3: 1 (optional)
- Phase 4: 7
- **Total: 35 tasks**

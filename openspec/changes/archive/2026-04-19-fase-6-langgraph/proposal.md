# Proposal: Fase 6 — Track 04 LangGraph (5 exercises)

## Intent

Deliver PLAN.md Fase 6: the LangGraph track. Composition (Fase 3) showed chains; agents (Fase 5) showed model-driven control flow via a prebuilt React agent. This track goes one layer deeper — the explicit state-graph primitive that ALL LangChain agents compile into. Learners who've done Fase 5 see `createReactAgent`'s insides; learners building production workflows get the HITL + checkpoint/resume primitives they actually need.

## Scope

### In Scope
- `packages/exercises/04-langgraph/` with 5 exercises: `01-state-graph-basics`, `02-react-as-graph`, `03-subagents-hitl`, `04-event-streaming`, `05-checkpoint-resume`.
- Each: `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `es/exercise.md`, `en/exercise.md`.
- Canonical `StateGraph` + `Annotation.Root` pattern; NO runner helpers.
- Hand-rolled tool dispatch in 02 (not `ToolNode`) for pedagogical depth.

### Out of Scope
- `Pregel` low-level primitive exposure — deferred to v0.2.
- Functional API (`entrypoint`, `task`) — imperative StateGraph is more teachable for a first exposure.
- Persistent checkpointers (SQLite, Postgres, Redis) — `MemorySaver` only.
- Distributed / multi-process graphs — single-process only.
- Human-in-the-loop via external queues (Slack, email) — synchronous `interrupt`/`Command` only.

## Capabilities

### New Capabilities
- `track-langgraph`: the 5 graph exercises, expected chat-call counts (lower bounds where LLM present), expected graph-state snapshot/event shapes, interrupt/resume semantics.

### Modified Capabilities
None. `exercise-contract` already covers inline fixtures + shape-assert discipline.

## Approach

Reuse the exercise layout proven in Fases 3-5. Each exercise imports directly from `@langchain/langgraph`:
- `StateGraph`, `Annotation`, `START`, `END` for graph construction
- `interrupt`, `Command` for HITL
- `MemorySaver` for checkpointing
- `MessagesAnnotation` + `addMessages` reducer for message-oriented graphs (02, 03)

Harness unchanged — `BaseChatModel.invoke` patch captures every model call inside a graph node, exactly like in Fase 5. Tests assert on `calls.length >= N` (lower bound), `result.userReturn` shape keys, and state/event counts.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/exercises/04-langgraph/**` | New | 30 files (5 exercises × 6 files) |
| `code/packages/runner/` | Untouched | Harness already sufficient |
| `code/packages/exercises/package.json` | Untouched | langgraph, langgraph-checkpoint, zod already present |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Short §Graphs section (non-blocking) |
| `openspec/specs/track-langgraph/spec.md` | New | Delta spec |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Students wrap graph invoke in `try/catch`, swallowing `GraphInterrupt` | High | Document prominently in 03 + 05 exercise.md; starter comments warn explicitly |
| Missing `thread_id` in config on checkpointer graphs → runtime error | Med | Tests assert thread_id presence; exercise.md calls it out |
| Small models skip tools in 02-react-as-graph | Med | Explicit system prompt requiring tool use; `>=` asserts on call count |
| `streamEvents` event-type count varies across providers | Low-Med | Tests use `>= 3` lower bound + presence of a couple of stable event types |
| Graph recursion depth exceeded | Low | `recursionLimit` option set in invocations where loops possible |
| Voseo drift in es/exercise.md | Med | `rg` guard unchanged |
| Cost: graph-based agents take more model calls than Fase 5 agents | Low | Still <$0.003 per verify run on cheap defaults |

## Rollback Plan

Each exercise is self-contained under its own directory. `git rm -r code/packages/exercises/04-langgraph/<id>/` reverts one. No runner/CLI changes; no deps to unwind.

## Dependencies

Already installed: `@langchain/core`, `@langchain/langgraph`, `@langchain/langgraph-checkpoint`, `@langchain/{anthropic,openai,google-genai}`, `@langchain/classic`, `zod`.

API keys: chat-provider key only (no embeddings in this track).

## Success Criteria

- [ ] `bun test` → Fase 3 + 4 + 5 solution-target tests remain green; Fase 6 tests gated on chat key with fail-fast.
- [ ] `LCDEV_TARGET=solution bun test` → all solutions pass live (expect 189 + ~20 new = ~209 pass).
- [ ] `bunx tsc --noEmit` clean.
- [ ] `lcdev list` shows 20 entries total (4 tracks × 5).
- [ ] `lcdev verify 02-react-as-graph --solution` green against a real provider.
- [ ] `lcdev verify 05-checkpoint-resume --solution` green (no LLM needed).
- [ ] Voseo `rg` guard returns zero hits.
- [ ] `lcdev run 02-react-as-graph --solution` prints a readable final answer.

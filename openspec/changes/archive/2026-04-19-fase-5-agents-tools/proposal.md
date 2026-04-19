# Proposal: Fase 5 — Track 03 Agents & Tools (5 exercises)

## Intent

Deliver PLAN.md Fase 5: the agents track. After composition (Fase 3) and retrieval (Fase 4), this is the third learnable track and the first where the model itself decides control flow — tool selection, multi-step reasoning, state across turns. Agents are the most-asked-about LangChain feature from senior-dev learners; without this track the bootcamp still looks like "chain toy".

## Scope

### In Scope
- `packages/exercises/03-agents-tools/` with 5 exercises: `01-bind-tools`, `02-react-agent`, `03-multi-tool-recovery`, `04-agent-memory`, `05-streaming-steps`.
- Each exercise: `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `es/exercise.md`, `en/exercise.md`.
- Inline tool definitions per exercise (deterministic stubs — weather/calculator/lookup style).
- No new runner exports; no new deps.

### Out of Scope
- Custom agent executors — `createReactAgent` only.
- External tool integrations (real weather APIs, real web search) — all deterministic stubs.
- Human-in-the-loop interrupts — deferred to track 04 LangGraph (Fase 6).
- Persistent checkpointers (SQLite, Postgres) — MemorySaver only.
- Tool streaming from inside the tool — not covered at v0.1.

## Capabilities

### New Capabilities
- `track-agents-tools`: the 5 agent exercises, expected chat-call counts (lower bounds), expected `tool_calls` name/shape patterns, userReturn shapes.

### Modified Capabilities
None. The `exercise-contract` spec already covers inline fixtures and the shape-assert discipline; no additions required.

## Approach

Copy the exercise-layout pattern from Fases 3-4. Each exercise uses:
- `createChatModel(provider, key)` from `@lcdev/runner` (existing)
- Canonical `tool()` from `@langchain/core/tools` with Zod schemas (NO `@lcdev/runner` wrapper)
- `createReactAgent({ llm, tools })` from `@langchain/langgraph/prebuilt`
- `MemorySaver` from `@langchain/langgraph-checkpoint` (04 only)

Tests assert on `result.calls.length >= N` (lower bound due to agent nondeterminism) + `result.lastCall?.response.tool_calls` shape (names, not argument values) + `userReturn` structural fields. The harness already captures every `BaseChatModel.invoke` during agent loops — no runner changes needed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/exercises/03-agents-tools/**` | New | 30 files (5 exercises × 6 files) |
| `code/packages/runner/` | Untouched | Harness already sufficient for agent loops |
| `code/packages/exercises/package.json` | Untouched | langgraph + langgraph-checkpoint + zod already present |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Short §Agents section on tool_calls assertions (non-blocking) |
| `openspec/specs/track-agents-tools/spec.md` | New | Delta spec |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Small models skip tools and answer directly | Med | Explicit tool-calling prompts; lower-bound `>=` asserts where possible; `tool_choice: "required"` on `bindTools` in 01 |
| Agent step count nondeterminism across providers | Med | Asserts use `>=` with sensible lower bounds; tool-call NAME checks, not arg values |
| Provider tool-format mismatch | Low | LC normalizes to `AIMessage.tool_calls`; tests target normalized field only |
| `MemorySaver` thread_id missing in config | Low | Exercise 04 docs + test assertion on `thread_id` presence |
| Voseo drift in es/exercise.md | Med | Verify-phase `rg` guard fails suite on voseo tokens |
| Cost: agents take multiple model calls per exercise | Med | Anthropic haiku / GPT-4o-mini / Gemini flash defaults keep each `lcdev verify` under ~$0.002 |

## Rollback Plan

Each exercise is self-contained under its own dir. `git rm -r code/packages/exercises/03-agents-tools/<id>/` reverts one. No runner or CLI changes to revert. No deps to unwind.

## Dependencies

- Already installed: `@langchain/core@^1.1`, `@langchain/langgraph@^1`, `@langchain/langgraph-checkpoint@^1`, `zod@^3.25`, chat providers, `@langchain/classic` (from Fase 4).
- API keys: chat-provider key only (agents don't use embeddings). Anthropic users do NOT need OpenAI key for this track.

## Success Criteria

- [ ] `bun test` → all Fase 3 + Fase 4 solution-target tests remain green (167 pass baseline); Fase 5 exercise tests gated on chat-provider key with fail-fast.
- [ ] `LCDEV_TARGET=solution bun test` → all solutions pass against live APIs.
- [ ] `bunx tsc --noEmit` clean.
- [ ] `lcdev list` shows 15 entries total (5 composition + 5 retrieval-rag + 5 agents-tools) in both locales.
- [ ] `lcdev verify 02-react-agent --solution` green against a real provider.
- [ ] Voseo guard returns zero hits.
- [ ] `lcdev run 02-react-agent --solution` prints the final agent answer as readable text.

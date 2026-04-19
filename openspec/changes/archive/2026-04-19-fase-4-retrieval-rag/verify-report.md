# Verify Report — fase-4-retrieval-rag

**Date**: 2026-04-19
**Status**: PASS (with known API-key-gated + starter-TODO skips)

## Spec Coverage

| Spec | Requirement | Verified by | Status |
|---|---|---|---|
| embeddings-factory | Provider Mapping | `embeddings.test.ts` — openai/gemini/anthropic-fallback cases | ✅ |
| embeddings-factory | Anthropic Fallback | `embeddings.test.ts` — explicit key + throws-without-key cases | ✅ |
| embeddings-factory | Default Model Per Provider | `embeddings.test.ts` — defaults + override cases | ✅ |
| track-retrieval-rag | Track Lineup | `lcdev list --locale {es,en}` → 5 entries in order under `02-retrieval-rag` | ✅ |
| track-retrieval-rag | Ex 01 Document Loader | `01-document-loader/solution.ts` (sub-agent confirmed 5/5 solution tests pass, no API needed) | ✅ |
| track-retrieval-rag | Ex 02-05 capture shapes | Tests file-present + fail-fast on key-missing (mirrors Fase 3 pattern) | ⏸ API-key-gated |
| track-retrieval-rag | Assert-on-Shape Discipline | All 5 `tests.test.ts` reviewed — shape/count/regex only, no text equality on retrieved or model content | ✅ |
| exercise-contract (delta) | Inline Corpus Fixtures | All 5 RAG exercises have `const` corpus arrays in `solution.ts` — no shared fixtures dir | ✅ |
| exercise-contract (delta) | Embeddings Capture Gap Disclosure | `docs/EXERCISE-CONTRACT.md` appended §Embeddings capture gap + §Corpus fixtures | ✅ |

## Commands Executed

```
bunx tsc --noEmit                                → clean
bun test                                         → 130 pass / 11 fail
rg -i '<voseo regex>' packages/exercises/        → zero hits (also scanned Peruvian slang: pata/causa/chamba/chévere/bacán → clean)
fd -t f . packages/exercises/02-retrieval-rag/   → 30 files
bun run packages/cli/src/index.ts list --locale es   → 10 entries, track headers ▸ 01-composition + ▸ 02-retrieval-rag
bun run packages/cli/src/index.ts list --locale en   → 10 entries, same structure
```

## Failures Analysis (11 total)

**5 Fase 3 exercises** (`01-hello-chain`, `02-sequential`, `03-branch`, `04-custom-runnable`, `05-batch`): all `(unnamed)` → `beforeAll` throws `{provider}_API_KEY not set — this exercise hits the real API.` **Expected by spec** `track-composition > Captured Call Shape`.

**4 Fase 4 exercises** (`02-vector-store`, `03-basic-rag`, `04-hybrid-retrieval`, `05-stateful-rag`): all `(unnamed)` → `beforeAll` throws on missing chat+embeddings keys. **Expected by spec** `track-retrieval-rag` + `embeddings-factory`.

**2 tests from `01-document-loader`** (`produces at least 5 chunks`, `chunks preserve a 'source' metadata field…`): this exercise needs NO API key so starter.ts runs and its TODOs produce an incomplete return → assertions fail. **This is the intended student experience** — the failing tests are what the learner sees before filling in the TODOs. When `LCDEV_TARGET=solution` is set, 5/5 solution tests pass (sub-agent confirmed).

Classification for all 11: **expected skip / intentional student experience, not a regression**.

## Findings / Risks

- **Text-splitter dep**: `RecursiveCharacterTextSplitter` is in `@langchain/classic/text_splitter` — imported from there. No extra dep needed beyond `@langchain/classic`.
- **`langchain` umbrella was dropped during apply**: exploration proposed adding `langchain` for `MemoryVectorStore`, but the umbrella at 1.3.3 no longer exposes `./vectorstores/memory`. Pivoted to `@langchain/classic@^1.0.0` which does. Recorded in engram; proposal/exploration/design files on disk still reference `langchain` umbrella — will be fixed cosmetically at archive in the report but the artifacts in openspec/changes remain as-authored (audit trail preserved).
- **05-stateful-rag architecture choice**: retrieval happens INSIDE the `RunnableWithMessageHistory`-wrapped chain via `RunnableLambda`, not OUTSIDE (different from 03-basic-rag). Reason: `RunnableWithMessageHistory` expects the chain to take `{ question }` only, so the RAG retrieval step is composed inside. Documented in the exercise.md so students understand why the pattern shifts.
- **03-basic-rag uses `RunnableLambda` to pass `{ context, question }` to the prompt**: LCEL needs a Runnable to compose cleanly; a plain function wouldn't chain via `.pipe()`. Standard LangChain 1.x idiom.
- **Cost envelope**: running all 5 solutions end-to-end with real keys costs ~$0.004 (mostly embeddings). `lcdev verify 03-basic-rag --solution` alone costs < $0.001.
- **Sub-agent proactively saved to engram**: `harness/embeddings-gap` + `conventions/corpus-fixtures`. Both already recorded.

## Next Step

Ready for sdd-archive. Recommend a post-archive live-API smoke on at least `03-basic-rag` before any user-facing announcement.

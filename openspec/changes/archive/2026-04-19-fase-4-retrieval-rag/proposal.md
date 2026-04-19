# Proposal: Fase 4 — Track 02 Retrieval & RAG (5 exercises)

## Intent

Deliver PLAN.md Fase 4: the RAG track. After composition (Fase 3) teaches how to chain chat models with prompts and parsers, retrieval teaches how to ground those chains with external knowledge. This is the second learnable track and the first that pulls in the embeddings + vector-store layer of LangChain.

## Scope

### In Scope
- `packages/exercises/02-retrieval-rag/` with 5 exercises: `01-document-loader`, `02-vector-store`, `03-basic-rag`, `04-hybrid-retrieval`, `05-stateful-rag`.
- Each exercise: `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `es/exercise.md`, `en/exercise.md`. Inline corpus (5-10 docs) per exercise.
- `createEmbeddings(provider, apiKey, openaiFallbackKey?)` factory in `@lcdev/runner`. Anthropic falls back to `OpenAIEmbeddings` with a printed note.
- `langchain` umbrella added to `packages/exercises/package.json` for `MemoryVectorStore`.
- `docs/EXERCISE-CONTRACT.md` appendix — embeddings-capture gap + corpus-fixture convention.

### Out of Scope
- Real persistent vector stores (Pinecone, Chroma) — in-memory only.
- Cohere rerank / Voyage embeddings — deferred to track 07 (v0.2).
- Embeddings-call observability in harness — natural home is Fase 8 (track 06 observability).
- Document loaders from filesystem or URL — inline strings only.

## Capabilities

### New Capabilities
- `embeddings-factory`: `createEmbeddings(provider, apiKey, openaiFallbackKey?)` contract, per-provider mapping, Anthropic fallback behavior + stderr notice.
- `track-retrieval-rag`: the 5 RAG exercises and their expected capture / userReturn shapes.

### Modified Capabilities
- `exercise-contract`: add note about embeddings-capture gap and corpus-fixture convention (inline arrays per exercise). Delta spec.

## Approach

Copy the exercise-layout pattern established in Fase 3. Each RAG exercise uses:
- `createChatModel(provider, key)` from `@lcdev/runner` (existing)
- `createEmbeddings(provider, key, openaiFallback?)` from `@lcdev/runner` (new)
- `Document` from `@langchain/core/documents`
- `MemoryVectorStore` from `langchain/vectorstores/memory`
- `InMemoryChatMessageHistory` + `RunnableWithMessageHistory` from `@langchain/core/*` for 05

Tests assert on `CapturedCallLangChain` count (chat-model invocations) + `userReturn` structural fields (retrieved doc count, answer non-empty string). Embeddings calls are NOT captured by the existing harness — tests do not assert on them.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/exercises/02-retrieval-rag/**` | New | 30 files (5 exercises × 6 files) |
| `code/packages/runner/src/embeddings.ts` + `.test.ts` | New | `createEmbeddings` factory |
| `code/packages/runner/src/index.ts` | Modified | Export `createEmbeddings` |
| `code/packages/runner/package.json` | Untouched | Provider packages already present |
| `code/packages/exercises/package.json` | Modified | Add `langchain` umbrella |
| `docs/EXERCISE-CONTRACT.md` | Modified | Appendix: embeddings-gap + corpus convention |
| `code/packages/cli/src/` | Untouched | No CLI changes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Anthropic chat user without OpenAI key → exercise fails cryptically | Med | Embeddings factory fails loud with actionable message; exercise.md mentions the extra-key requirement |
| `langchain` umbrella weight (>10 MB transitive deps) | Low | One-time install cost; worth it for canonical LC landing |
| `RunnableWithMessageHistory` API shifted across 1.x point releases | Low-Med | Pin against `@langchain/core@1.1.40`; if API breaks on a bump, pin exact in package.json |
| Embeddings cost on repeated `lcdev verify` runs | Med | Inline corpora stay small (5-10 docs × ~100 tokens); each full verify < $0.001 |
| Voseo leaking into es/ content | Med | Verify-phase `rg` guard fails the suite on voseo tokens |

## Rollback Plan

Each exercise is self-contained under its own directory — `git rm -r code/packages/exercises/02-retrieval-rag/<id>/` to revert one. `createEmbeddings` factory is a new, additive export — `git revert` the runner commit to remove it without breaking Fase 3. `langchain` umbrella dep and EXERCISE-CONTRACT.md appendix revert cleanly in the same way.

## Dependencies

- Existing: `@langchain/core@^1.1`, `@langchain/openai@^1.0`, `@langchain/google-genai@^1.0` — already in runner.
- New: `langchain@^1.0` (umbrella, for `MemoryVectorStore`) — added to `exercises/package.json`.
- API keys: chat provider key + OpenAI key (always, for embeddings — Gemini users optional). Gemini chat users may use `GEMINI_API_KEY` for native embeddings instead.

## Success Criteria

- [ ] `bun test` → all Fase 3 tests remain green; new Fase 4 exercise tests gated on API keys (fail-fast with clear message when absent).
- [ ] `bunx tsc --noEmit` clean.
- [ ] `lcdev list` shows 10 entries total (5 composition + 5 retrieval-rag) in both locales.
- [ ] `lcdev verify 03-basic-rag --solution` green against a real provider + OpenAI embeddings.
- [ ] Voseo `rg` guard against `packages/exercises/` returns zero hits.
- [ ] `lcdev run 03-basic-rag --solution` prints a grounded answer (non-empty string, non-JSON-blob thanks to `isAIMessage` branch from Fase 3).

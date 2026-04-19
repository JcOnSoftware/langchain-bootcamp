# Exploration: fase-4-retrieval-rag (5 exercises)

## Current State

- Harness patches `BaseChatModel.prototype.invoke` + `_streamIterator`. **It does NOT patch `Embeddings.prototype.embedDocuments` or `.embedQuery`** — embedding calls are invisible to the existing capture. Every RAG exercise will hit the embeddings API at least once (at indexing time) plus once per query.
- `@lcdev/runner` exports `createChatModel(provider, apiKey, opts?)`. No embeddings factory yet.
- Exercises package currently has `@langchain/{anthropic,openai,google-genai,core,langgraph}` but NOT the `langchain` umbrella. `MemoryVectorStore` lives in `langchain/vectorstores/memory`, not in `@langchain/core/vectorstores` (which only exports the abstract `VectorStore`).
- No corpus / fixture pattern established. First RAG exercise defines the shape.

## Affected Areas

- `code/packages/exercises/02-retrieval-rag/{01..05}/` — 5 new exercise dirs, ~6 files each = ~30 files
- `code/packages/runner/src/embeddings.ts` (NEW) + `.test.ts` — `createEmbeddings(provider, apiKey)` factory
- `code/packages/runner/src/index.ts` — export `createEmbeddings`
- `code/packages/runner/package.json` — maybe add `langchain` umbrella (if exercises import `MemoryVectorStore` from it; alternative: write a small custom store)
- `code/packages/exercises/package.json` — same dep addition
- `openspec/specs/` — new specs for `track-retrieval-rag` + `embeddings-factory` domains; reuse existing `exercise-contract` spec unchanged

## Approaches

### 1. Exercise Lineup

Locked per PLAN.md Fase 4 description:

| # | id | Focus | Key API |
|---|---|---|---|
| 1 | `01-document-loader` | Load in-memory strings into `Document[]` + inspect chunking | `Document`, `RecursiveCharacterTextSplitter` |
| 2 | `02-vector-store` | Embed + index + similarity search | `MemoryVectorStore.fromDocuments`, `.similaritySearch(k)` |
| 3 | `03-basic-rag` | Retriever → prompt → model → parser | `vectorStore.asRetriever({ k: 3 })` + LCEL |
| 4 | `04-hybrid-retrieval` | Dense (vector) + keyword filter combined | `MMR` search OR custom `RunnableLambda` post-rank |
| 5 | `05-stateful-rag` | RAG chain with chat history across multiple turns | `InMemoryChatMessageHistory` + `RunnableWithMessageHistory` |

**Effort: Medium-High** — same 6-file contract per exercise, but each has a tiny inline corpus and more LCEL plumbing than composition exercises.

### 2. Embeddings Strategy

Three approaches:

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| **A: Pin OpenAIEmbeddings always** | One extra key (OPENAI_API_KEY); industry baseline; zero new deps | Anthropic users must also have an OpenAI key | ❌ Reject — friction |
| **B: Per-provider native (OpenAI / Gemini native; Voyage for Anthropic)** | Idiomatic; matches real-world practice; exercises show provider parity | Adds `@langchain/community` + `voyageai` deps; 2 more API keys to obtain | ⚠ Partial |
| **C: Per-provider with fallback — native where available, OpenAI as fallback for Anthropic** | Only OpenAI + Gemini keys covered natively; Anthropic users fall back to OpenAIEmbeddings. Single new factory. No community dep. | Still makes an OpenAI key required when chat=anthropic | ✅ Recommended |

**Decision**: Approach C. `createEmbeddings(provider, apiKey, openaiFallbackKey?)`:
- `openai` → `OpenAIEmbeddings` with OPENAI_API_KEY
- `gemini` → `GoogleGenerativeAIEmbeddings` with GEMINI_API_KEY
- `anthropic` → `OpenAIEmbeddings` with OPENAI_API_KEY (fallback, with a console note: "Anthropic doesn't ship native embeddings; using OpenAI embeddings. Production RAG typically pairs embeddings with chat provider via Voyage — covered in track 07 (v0.2).")

Exercises document this explicitly so learners understand the tradeoff. The factory takes a second optional `openaiFallbackKey` for the Anthropic case; exercises read it from `OPENAI_API_KEY` env.

### 3. Vector Store Source

**Option X: `langchain` umbrella** (`MemoryVectorStore` from `langchain/vectorstores/memory`). Canonical. Adds ~30MB umbrella to deps.
**Option Y: Custom minimal store** in `@lcdev/runner/memory-vector-store.ts` implementing `VectorStoreInterface`. No dep. ~40 LOC.

**Decision**: Option X — learners come to see LangChain's batteries, not our hand-rolled workaround. The umbrella is the canonical landing in LC 1.x ecosystem. Add `langchain` to `exercises/package.json`.

### 4. Reranking / Hybrid

`EnsembleRetriever` is Python-dominant; JS support is partial. Options:

- **MMR** (Maximal Marginal Relevance) — built into every `VectorStore` via `.asRetriever({ searchType: "mmr", k, fetchK })`. No extra deps, deterministic, demonstrates diversity-vs-similarity tradeoff.
- **Hybrid keyword+dense** via `RunnableLambda`: take top-k dense results, then boost any doc whose text contains a query keyword.

**Decision**: 04-hybrid uses MMR + a simple keyword-boost post-processor (RunnableLambda). No Cohere rerank API.

### 5. Harness-Capture Gap

Embeddings do NOT go through `BaseChatModel`. Options:

- **Skip asserts**: tests assert on chat-model call count + `userReturn` shape (retrieved docs, final answer). Ignore embeddings entirely.
- **Patch Embeddings**: extend harness to monkey-patch `Embeddings.prototype.embedDocuments` + `.embedQuery`. Needs a new `CapturedEmbeddingsCall` type.

**Decision**: Skip for Fase 4. Cost visibility for embeddings is naturally a track 06 (observability) concern. Document the gap in EXERCISE-CONTRACT.md.

### 6. Corpus Fixtures

Inline arrays per exercise. Each has its own small 5-10 doc corpus defined in `solution.ts` / `starter.ts`. No shared fixtures directory — keeps exercises self-contained.

## Recommendation

Approach 1 + 2C + 3X + 4 (MMR + keyword boost) + 5-skip + 6-inline.

**Scope**:
- Add `createEmbeddings` factory to `@lcdev/runner` (deps: `@langchain/openai`, `@langchain/google-genai` already present)
- Add `langchain` umbrella to `exercises/package.json`
- 5 exercises per contract
- EXERCISE-CONTRACT.md appendix: embeddings-gap note + corpus-fixture convention
- No harness changes

## Risks

- **Embeddings key required in addition to chat key** when chat=anthropic — verify tests fail fast with a clear message.
- **`langchain` umbrella weight** on install — one-time cost; acceptable.
- **Stateful RAG session-state semantics**: `RunnableWithMessageHistory` needs a `sessionId` config; `getMessageHistory` callback. Exercise 05 must scope this clearly — single-session for tests.
- **LangChain 1.x minor bumps**: `RunnableWithMessageHistory` API has shifted across versions. Verify import path against `@langchain/core@1.1.40`.
- **Voseo in Spanish content**: same risk as Fase 3. Keep the rg guard in verify.

## Ready for Proposal

**Yes**. Scope bounded, strategy locked on each of the 5 open questions. Next: `sdd-propose` with change-name `fase-4-retrieval-rag`.

# Design: Fase 4 — Track 02 Retrieval & RAG

## Technical Approach

Follow the exercise layout pattern from Fase 3 (track 01-composition). Add one runner export (`createEmbeddings`) and one umbrella dep (`langchain`). Each RAG exercise is self-contained with an inline corpus. Tests assert on chat-call count + `userReturn` structural fields. No harness changes.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|---|---|---|---|
| Vector store class | `MemoryVectorStore` from `langchain/vectorstores/memory` | Custom in-runner class (~40 LOC) | Canonical LC landing — bootcamp teaches LangChain, not our workarounds |
| Umbrella dep location | `packages/exercises/package.json` | `packages/runner/package.json` | Runner stays lean (core + providers only); exercises pull the umbrella |
| Embeddings factory placement | `@lcdev/runner/src/embeddings.ts` | `@lcdev/cli/provider/` | Consistency with `createChatModel` — runner is the model-plumbing authority |
| Anthropic embeddings mapping | Fallback to `OpenAIEmbeddings` w/ OPENAI_API_KEY | Voyage via `@langchain/community` | Zero new deps; scope keeps Voyage for v0.2 track 07 |
| Corpus fixtures | Inline arrays per exercise | `fixtures/` subdir shared across exercises | Each exercise stays readable end-to-end; learner sees corpus + chain in one file |
| Hybrid retrieval impl | MMR + keyword-boost via `RunnableLambda` | `EnsembleRetriever` (JS partial) / Cohere rerank (paid) | Deterministic, no extra key, covers "hybrid" concept |
| Stateful RAG wrapper | `RunnableWithMessageHistory` + in-process `Map<sessionId, InMemoryChatMessageHistory>` | Redis-backed history | In-memory fits single-invocation test; persistence is out of v0.1 |
| Embeddings capture | Skip (gap documented) | Extend harness to patch `Embeddings.prototype.embedDocuments` + `embedQuery` | Cost visibility naturally belongs in track 06; scope discipline |

## Data Flow

### 03-basic-rag example

```
corpus (inline)  ──embed──▶  MemoryVectorStore
                                   │
                                   ▼
  query ──────────────▶ vs.asRetriever({ k: 3 })
                                   │ Document[]
                                   ▼
                       ChatPromptTemplate (context + question)
                                   │
                                   ▼
                       BaseChatModel.invoke ◀── harness patch captures
                                   │
                                   ▼
                       StringOutputParser
                                   │
                                   ▼
         { answer: string, sources: Document[] }  → userReturn
```

### Exercise with 0 chat calls (01, 02, 04)

The chain stops before the chat model. Tests assert `result.calls.length === 0` and on `userReturn` shape (chunks / results / reranked).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `code/packages/exercises/02-retrieval-rag/01-document-loader/` | Create | 6 files |
| `code/packages/exercises/02-retrieval-rag/02-vector-store/` | Create | 6 files |
| `code/packages/exercises/02-retrieval-rag/03-basic-rag/` | Create | 6 files |
| `code/packages/exercises/02-retrieval-rag/04-hybrid-retrieval/` | Create | 6 files |
| `code/packages/exercises/02-retrieval-rag/05-stateful-rag/` | Create | 6 files |
| `code/packages/runner/src/embeddings.ts` | Create | `createEmbeddings` factory |
| `code/packages/runner/src/embeddings.test.ts` | Create | 4-5 cases covering provider mapping + fallback |
| `code/packages/runner/src/index.ts` | Modify | Add `createEmbeddings` export |
| `code/packages/exercises/package.json` | Modify | Add `"langchain": "^1.0.0"` |
| `docs/EXERCISE-CONTRACT.md` | Modify | Append §Embeddings capture gap + §Corpus fixtures |

## Interfaces / Contracts

```ts
// runner/src/embeddings.ts
export type EmbeddingsProvider = "anthropic" | "openai" | "gemini";

export interface CreateEmbeddingsOptions {
  model?: string;
}

export function createEmbeddings(
  provider: EmbeddingsProvider,
  apiKey: string,
  openaiFallbackKey?: string,
  opts?: CreateEmbeddingsOptions,
): Embeddings;
```

Notable: signature positions `openaiFallbackKey` as 3rd optional arg (before `opts`) because it's a frequently-needed override specifically for the anthropic fallback path.

Exercise solution shape for RAG (03-basic-rag sketch):

```ts
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  createChatModel,
  createEmbeddings,
  type ChatModelProvider,
} from "@lcdev/runner";

export default async function run() {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const chatKey = process.env[`${provider.toUpperCase()}_API_KEY`] ?? "";
  const openaiFallback = process.env["OPENAI_API_KEY"];

  const embeddings = createEmbeddings(provider, chatKey, openaiFallback);
  const corpus = [/* 5-10 Document instances */];
  const store = await MemoryVectorStore.fromDocuments(corpus, embeddings);
  const retriever = store.asRetriever({ k: 3 });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "Answer using only the provided context."],
    ["human", "Context:\n{context}\n\nQuestion: {question}"],
  ]);
  const model = createChatModel(provider, chatKey);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const question = "…";
  const sources = await retriever.invoke(question);
  const context = sources.map((d) => d.pageContent).join("\n\n");
  const answer = await chain.invoke({ context, question });

  return { answer, sources };
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `createEmbeddings` provider mapping + default models + fallback throw | `embeddings.test.ts` with stub keys (no API calls) |
| Integration | Each exercise's `tests.test.ts` via `runUserCode` | Real provider + real embeddings; gated on `{X}_API_KEY` + `OPENAI_API_KEY` when embeddings needed |
| Verify-phase | Voseo grep over `packages/exercises/` | `rg -i` same pattern as Fase 3 |
| Smoke | `lcdev list` shows 10 entries | Manual CLI check post-apply |

## Migration / Rollout

No migration. Additive track. `createEmbeddings` is a new export — no impact on Fase 3 code.

## Open Questions

- [ ] **Embeddings model for Gemini**: `text-embedding-004` is LangChain's listed default, but `@langchain/google-genai@1.0.3` may support `gemini-embedding-001` (newer). Resolve during apply by reading the installed package's typings; pick the version's actual default or `text-embedding-004` explicitly.
- [ ] **`RunnableWithMessageHistory` import path** on `@langchain/core@1.1.40`: could be `@langchain/core/runnables` or `@langchain/core/chat_history`. Resolve at apply by reading the installed typings.

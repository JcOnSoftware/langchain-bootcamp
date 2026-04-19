# 03 · End-to-end RAG chain

## Goal

Wire your first full RAG chain: corpus → embeddings → vector store → retriever → context injection into the prompt → model → parser. It's the canonical pattern you'll reuse in every RAG system from here on; once you compose it by hand, the higher-level abstractions stop feeling like magic.

## Context

RAG (Retrieval-Augmented Generation) solves a concrete LLM limitation: it doesn't know your private data and doesn't remember anything past its cutoff. Instead of retraining, you hand it relevant context in the prompt, retrieved dynamically via semantic search.

Two phases:

1. **Indexing** (offline, once): embed the corpus and store it in a vector store.
2. **Query** (online, per question): embed the question, pull the top-k nearest docs, inject them into the prompt, call the model.

LCEL is the tool for composing the query phase as a readable chain. `RunnablePassthrough.assign({ ... })` lets you attach derived fields without dropping the originals — key for injecting `context` without breaking the input shape.

## What to complete

Open `starter.ts`. Four TODOs:

1. **Index the corpus**: build `Document[]`, create the `MemoryVectorStore`, request a `retriever = vectorStore.asRetriever({ k: 3 })`.
2. **Build the prompt** with two messages:
   - `"system"`: instruct the model to answer ONLY from `{context}` and admit when info is insufficient.
   - `"human"`: `"{question}"`.
3. **Retrieve sources** via `retriever.invoke(question)`.
4. **Compose the chain**:
   ```
   RunnablePassthrough.assign({ context: (input) => formatDocs(input.sources) })
     .pipe(prompt)
     .pipe(model)
     .pipe(new StringOutputParser())
   ```
   Invoke with `{ question, sources }` and return `{ answer, sources }`.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 03-basic-rag

# Reference solution
lcdev verify 03-basic-rag --solution

# See the answer with its sources
lcdev run 03-basic-rag --solution
```

## Success criteria

- Exactly **one** chat-model call (`result.calls.length === 1`). Retrieval doesn't count — the v0.1 harness doesn't intercept embeddings.
- The model id matches the configured provider (`claude-*`, `gpt-*`, or `gemini-*`).
- Return value is `{ answer, sources }`: non-empty `answer` string + `sources` array with at least one `Document`.
- Every `Document` in `sources` has non-empty `pageContent`.

## Hint

The trick is separating "what you retrieve" from "how you inject it". Retrieve outside the chain (so you can return sources alongside the answer), and inside the chain just derive `context` from those sources:

```ts
const sources = await retriever.invoke(question);

const chain = RunnablePassthrough.assign({
  context: new RunnableLambda({
    func: (input: { question: string; sources: Document[] }) => formatDocs(input.sources),
  }),
})
  .pipe(prompt)
  .pipe(model)
  .pipe(new StringOutputParser());

const answer = await chain.invoke({ question, sources });
```

That way you return `{ answer, sources }` without calling the retriever twice.

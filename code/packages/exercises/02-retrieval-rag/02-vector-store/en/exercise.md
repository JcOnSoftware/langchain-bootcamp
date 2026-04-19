# 02 · Embed a corpus into MemoryVectorStore and query it

## Goal

Embed a small corpus (8 drink descriptions), index it into `MemoryVectorStore`, and retrieve the 3 closest matches for a semantic query. It's the skeleton of any RAG system — nailing this piece in isolation makes the next exercises slot in without friction.

## Context

An **embedding** is a vector of real numbers representing the "meaning" of a text in a high-dimensional space. Texts with similar meaning land close together in that space. A similarity search is literally that: find the vectors nearest (by cosine similarity, by default) to your query vector.

`MemoryVectorStore` is the simplest store: lives in memory, zero infra. Perfect for exercises and prototypes. In production you swap it for pgvector, Qdrant, or whatever — the LangChain API is the same.

**Key note**: Anthropic ships no native embeddings in LangChain 1.x. `createEmbeddings(...)` auto-falls back to `OpenAIEmbeddings`, so you need `OPENAI_API_KEY` if your `LCDEV_PROVIDER` is Anthropic.

## What to complete

Open `starter.ts`. Three TODOs:

1. **Turn `CORPUS` into `Document[]`** with `metadata.source = entry.id`. Same pattern as the previous exercise.
2. **Create the store** with `MemoryVectorStore.fromDocuments(docs, embeddings)`. One line — the factory calls `embeddings.embedDocuments` internally.
3. **Query** with `store.similaritySearch(query, 3)`. Use something like `"a strong, pressurized coffee shot with crema"`; it should put "espresso" in the top 3.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 02-vector-store

# Reference solution
lcdev verify 02-vector-store --solution

# See which docs came back as top-3
lcdev run 02-vector-store --solution
```

## Success criteria

- Zero chat-model calls. `result.calls.length === 0` — the harness does NOT capture `embedDocuments`/`embedQuery` in v0.1. Embeddings observability lands in track 06.
- Return value is `{ results }` with a `Document` array.
- `results.length === 3` (exactly — no more, no fewer).
- Every returned document has non-empty `pageContent`.

## Hint

```ts
const docs = CORPUS.map(
  (e) => new Document({ pageContent: e.text, metadata: { source: e.id } }),
);

const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
const results = await store.similaritySearch("a strong, pressurized coffee shot with crema", 3);
```

If "espresso" doesn't land in the top 3, check that the whole corpus is loaded (all 8 docs) and that your query mentions espresso's semantic attributes (pressure, crema, shot) rather than generic words like "coffee".

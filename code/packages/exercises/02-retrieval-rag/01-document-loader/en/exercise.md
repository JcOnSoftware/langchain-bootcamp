# 01 · Build and split a Document corpus

## Goal

Before embeddings, before vectors, before RAG, there's a boring-but-foundational step: turn plain text into `Document[]` and split it into manageable chunks. In this exercise you build a small support-article corpus and split it with `RecursiveCharacterTextSplitter`. No APIs, no cost.

## Context

A `Document` in LangChain is just `{ pageContent: string, metadata: Record<string, unknown> }`. That's it. The `metadata` is the thread that ties a chunk back to its source article, its URL, its author — whatever you decide to track later.

`RecursiveCharacterTextSplitter` splits text by trying natural separators (paragraphs → sentences → spaces → characters) in that order. The knobs matter:

- `chunkSize`: target max size per chunk.
- `chunkOverlap`: characters repeated between neighboring chunks so context at the boundary isn't lost.

## What to complete

Open `starter.ts`. Three TODOs:

1. **Build the `Document[]`** from the inline `CORPUS`. Each `Document` must carry `metadata: { source: entry.id }` — that `source` is your audit trail later.
2. **Configure the splitter** with `chunkSize: 180` and `chunkOverlap: 20`. The numbers aren't arbitrary: with 200-400-char articles they force the splitter to produce at least one chunk per article.
3. **Call `splitter.splitDocuments(sourceDocs)`** and return it as `chunks`.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 01-document-loader

# Reference solution
lcdev verify 01-document-loader --solution

# See the actual chunks
lcdev run 01-document-loader --solution
```

## Success criteria

- Zero model calls (`result.calls.length === 0`). This exercise is fully local.
- Return value is an object `{ chunks }` with an array.
- At least **5 chunks** produced (one per article, minimum).
- Every chunk has non-empty `pageContent` and a `metadata` object.
- The set of `metadata.source` values covers all 5 original sources.

## Hint

The canonical pattern is short:

```ts
const sourceDocs = CORPUS.map(
  (entry) => new Document({ pageContent: entry.text, metadata: { source: entry.id } }),
);

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 180, chunkOverlap: 20 });
const chunks = await splitter.splitDocuments(sourceDocs);
```

If you want to experiment, drop `chunkSize` to 80 and watch the chunk count grow. That intuition will matter in the next exercise.

# 04 · Hybrid retrieval: MMR + keyword-boost reranking

## Goal

Pure semantic search is powerful but blind to literal matches. This exercise combines two complementary techniques: **MMR** (Maximal Marginal Relevance) to pull relevant-yet-diverse candidates, and a simple **keyword-boost** reranker to push docs containing domain keywords to the top.

## Context

### MMR — relevance with diversity

`similaritySearch` returns the top-k nearest, but those k can be near-duplicates of each other (same idea, different words). MMR fetches more candidates (`fetchK`) and selects `k` that maximize a trade-off between "close to the query" and "far from already-selected". Result: diversity without giving up relevance.

### Keyword-boost — literal matters

When your domain has specific terms (API names, concrete error types, acronyms), an exact match in `pageContent` is often worth more than a fuzzy semantic similarity. A trivial reranker that sorts by "keyword hits" is surprisingly effective.

### `RunnableLambda`

To make your reranker a proper LCEL piece (pipeable, debuggable, composable), wrap it in a `RunnableLambda`. Pure function → `Runnable`. It's the bridge from plain JS to the declarative pipeline.

## What to complete

Open `starter.ts`. Three TODOs:

1. **Implement `keywordBoost(docs)`**: count case-insensitive keyword hits in each `pageContent`, sort DESC by hits. On ties, preserve input order (stable sort).
2. **MMR search**: `vectorStore.maxMarginalRelevanceSearch(QUERY, { k: 4, fetchK: 8 })`. `fetchK: 8` gathers the 8 most relevant; MMR picks the final 4 optimizing for diversity.
3. **Invoke the reranker**: `RunnableLambda` wrapping `keywordBoost`, then `.invoke(raw)`.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 04-hybrid-retrieval

# Reference solution
lcdev verify 04-hybrid-retrieval --solution

# See the reranking effect in practice
lcdev run 04-hybrid-retrieval --solution
```

## Success criteria

- Zero chat-model calls.
- Return value is `{ raw, reranked }` with exactly 4 `Document`s in each array.
- At least one of the top-2 docs in `reranked` contains the literal word `"exception"` in its `pageContent`.
- The set of documents in `reranked` equals the set in `raw` (same members, different order).

## Hint

Stable sort in JS has been free since ES2019. Canonical pattern:

```ts
function keywordBoost(docs: Document[]): Document[] {
  const scored = docs.map((doc) => {
    const text = doc.pageContent.toLowerCase();
    const hits = KEYWORDS.filter((k) => text.includes(k.toLowerCase())).length;
    return { doc, hits };
  });
  scored.sort((a, b) => b.hits - a.hits);
  return scored.map((s) => s.doc);
}
```

`map→sort→map` gives you a pure, testable reranker that's easy to extend: adding a recency or source weight is just adding terms to the score.

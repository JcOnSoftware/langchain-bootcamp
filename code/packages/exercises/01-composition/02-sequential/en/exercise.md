# 02 · Sequential chains: keyword then haiku

## Goal

Chain two model calls inside a single LCEL pipeline: the first extracts a keyword from a sentence, the second writes a haiku about that keyword. This is the classic "output-of-stage-A feeds stage-B" pattern.

## Context

Until now, your chain made a single model call. Real-world flows often need several coordinated calls: one to plan, another to execute; one to extract data, another to summarize. LCEL solves this with `RunnableSequence.from([...])`, which runs each step in order and threads the output of one into the next.

The subtle part is the data shape between stages. Stage 1 returns a `string` (the keyword). Stage 2 expects an object `{ keyword }` because its prompt uses the `{keyword}` variable. Between them you need an adapter: a pure function that converts the string into the object. That's also an implicit Runnable — LCEL coerces it for you.

## What to complete

Open `starter.ts`. Three main TODOs:

1. **Keyword chain (stage 1)** — `ChatPromptTemplate` with a `{sentence}` variable. The system prompt should ask for ONE evocative keyword, no punctuation. Pipe: `prompt → model → parser`.
2. **Haiku chain (stage 2)** — `ChatPromptTemplate` with a `{keyword}` variable. The system prompt should ask for a 3-line haiku (5-7-5). Pipe: `prompt → model → parser`.
3. **Sequential composition** — use `RunnableSequence.from([keywordChain, adapter, haikuChain])`. The adapter is `(keyword: string) => ({ keyword })`.

Then invoke with `{ sentence: "The fog rolled in over the city at dawn." }` and return the haiku.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 02-sequential

# Reference solution
lcdev verify 02-sequential --solution

# See real output
lcdev run 02-sequential --solution
```

## Success criteria

- The chain makes exactly **two** model calls (one per stage).
- Both calls report the same provider family (Anthropic → `claude-*`, OpenAI → `gpt-*`, Gemini → `gemini-*`).
- Input and output tokens are positive on both calls.
- The return value is a non-empty string: the final haiku.

## Hint

If you drop two prompts next to each other with just a comma between them, you'll get a type error: stage 1 outputs a `string`, but stage 2 wants an object. The in-between adapter is what resolves that "shape mismatch":

```ts
const chain = RunnableSequence.from<{ sentence: string }, string>([
  keywordChain,                       // (input) → string
  (keyword: string) => ({ keyword }), // string → { keyword: string }
  haikuChain,                         // { keyword } → string
]);
```

Tiny patterns like this are the heart of LCEL: atomic pieces that compose.

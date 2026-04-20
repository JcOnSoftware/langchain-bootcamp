# 03 · Streaming JSON — incremental parsed objects with JsonOutputParser

## Goal

Stream a JSON response from any model and collect the partial objects as they arrive. You will chain `prompt → model → JsonOutputParser` and call `.stream()` instead of `.invoke()`.

## Context

`JsonOutputParser` does two things: it parses the model's raw text output as JSON, and — when used with `.stream()` — it emits partial, incrementally-assembled objects as tokens arrive. By the time the stream ends, the last chunk is the fully assembled parsed object.

This is particularly useful for UIs that want to render structured data progressively, without waiting for the full response.

## What to complete

Open `starter.ts`. You need to:

1. **Define a `ChatPromptTemplate`** that asks for a JSON object with exactly three fields: `name`, `capital`, `population` for a specific country.
2. **Create a `JsonOutputParser`** instance.
3. **Chain** `prompt.pipe(model).pipe(parser)`.
4. **Stream** with `chain.stream({})` and collect all emitted chunks into an array.
5. **Return** `{ chunks, final: chunks.at(-1) }`.

## How to verify

From `code/`:

```bash
lcdev verify 03-streaming-json              # your code
lcdev verify 03-streaming-json --solution   # reference
lcdev run    03-streaming-json --solution   # inspect chunks
```

## Success criteria

- `result.userReturn.chunks.length > 1` — more than one partial object was emitted.
- `result.userReturn.final` is a non-null object with the expected keys.
- At least one model call is captured with `streamed === true`.

## Hint

Calling `.stream()` triggers `_streamIterator` on the underlying model — the harness captures it with `streamed: true`. The `JsonOutputParser` transforms raw text tokens into partial JSON objects:

```ts
const stream = await chain.stream({});
const chunks: unknown[] = [];
for await (const chunk of stream) {
  chunks.push(chunk);
}
// chunks = [{}, { name: "" }, { name: "Peru" }, { name: "Peru", capital: "" }, ...]
```

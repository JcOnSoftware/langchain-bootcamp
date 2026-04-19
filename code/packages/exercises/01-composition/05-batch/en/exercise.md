# 05 · Parallel invocations with chain.batch

## Goal

Run the same chain over several inputs in parallel using `chain.batch([...])`. It's the idiomatic LCEL way to handle batched workloads without rolling your own `Promise.all`.

## Context

Every LCEL `Runnable` exposes three invocation methods:

- `invoke(input)` — single execution.
- `batch(inputs[])` — multiple executions in parallel (with optional concurrency control).
- `stream(input)` — token-by-token streaming.

`batch` is NOT syntactic sugar over a loop: LCEL parallelizes internally, respects rate limits, and returns results in the same order as the inputs. For workloads like "generate a summary per document" or "translate three versions of the same text", `batch` is your friend.

## What to complete

Open `starter.ts`. Three TODOs:

1. **Prompt** — the exact same one from `01-hello-chain`: system + human with a `{topic}` variable.
2. **Composition** — `prompt.pipe(model).pipe(new StringOutputParser())`.
3. **Batch** — `chain.batch([{ topic: "LCEL" }, { topic: "agents" }, { topic: "RAG" }])` and return the array.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 05-batch

# Reference solution
lcdev verify 05-batch --solution

# See real output
lcdev run 05-batch --solution
```

## Success criteria

- The chain makes exactly **three** model calls (one per batch item).
- Every call uses the configured provider.
- Input and output tokens are positive on all three.
- The return value is an array of three non-empty strings.

## Hint

The difference between a loop and `batch` becomes obvious once you have many items: a loop awaits each promise before firing the next; `batch` fires them in parallel. If you need to cap concurrency:

```ts
await chain.batch(inputs, { maxConcurrency: 5 });
```

Three items in this exercise are fine without worrying about rate limits, but get used to the pattern: `maxConcurrency` is your escape hatch when the provider pushes back.

# 04 · Custom runnables as input adapters

## Goal

Wrap a pure function in `RunnableLambda` to use it as a first-class Runnable inside an LCEL chain. The typical use case: adapt a raw input to the shape the next step expects.

## Context

`RunnableLambda.from(fn)` turns any sync or async function into a Runnable. From there you can `.pipe(...)` it just like any other LCEL component. No magic — this is the mechanism LCEL uses to let you drop your own logic between steps without leaving the pipeline.

The concrete problem here: you want to invoke the chain with a plain string like `"Explain LCEL briefly."`, not an object `{ text: "..." }`. But `ChatPromptTemplate` needs an object with the `{text}` variable. Clean solution: an adapter at the top of the pipe.

```
(string) → adapter → { text } → prompt → model → parser → (string)
```

The adapter is your first hand-written Runnable.

## What to complete

Open `starter.ts`. Four TODOs:

1. **Prompt** with a `{text}` variable.
2. **Adapter** — `RunnableLambda.from<string, { text: string }>((raw) => ({ text: raw }))`.
3. **Composition** — `adapter.pipe(prompt).pipe(model).pipe(new StringOutputParser())`.
4. **Invocation** — call `chain.invoke("Explain LCEL briefly.")` (a plain string) and return the result.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 04-custom-runnable

# Reference solution
lcdev verify 04-custom-runnable --solution

# See real output
lcdev run 04-custom-runnable --solution
```

## Success criteria

- The chain makes exactly **one** model call.
- The returned model id matches the configured provider.
- Input and output tokens are both positive.
- The return value is a non-empty string.

## Hint

`RunnableLambda.from` generics matter for TypeScript to understand the contract:

```ts
const adapter = RunnableLambda.from<string, { text: string }>(
  (raw: string) => ({ text: raw }),
);
```

With that, `adapter.pipe(prompt)` works because the adapter's output is the prompt's input. Skip the generics and you'll see `unknown` propagating down the chain — classic symptom of an LCEL chain that doesn't typecheck.

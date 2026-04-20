# 02 · Fallback and Retry — resilient chains when a primary runnable fails

## Goal

Build a chain that gracefully handles a primary failure by routing to a fallback model. You will use `RunnableLambda` as a deterministic-failure primary and `.withFallbacks([realModel])` to recover automatically.

## Context

Production LLM pipelines fail. Models go down, rate limits hit, API keys expire. LangChain's `.withFallbacks([...])` is the idiomatic way to handle this: define a list of alternatives and LangChain tries them in order when the primary throws.

For pedagogical purposes, you will use a `RunnableLambda` that **always throws** to simulate a broken primary. The fallback is a real model. This keeps the test deterministic and costs minimal API tokens.

Key APIs:

- `RunnableLambda.from(async (input) => { ... })` — wraps any async function as a `Runnable`.
- `.withRetry({ stopAfterAttempt: 1 })` — prevents default retries so the fallback is reached immediately.
- `.withFallbacks([fallback])` — registers fallback runnables.

## What to complete

Open `starter.ts`. You need to:

1. **Define a `brokenPrimary`** using `RunnableLambda.from(...)` that always throws, chained with `.withRetry({ stopAfterAttempt: 1 })`.
2. **Chain it** with `.withFallbacks([fallbackModel])`.
3. **Invoke** the chain and extract the text content from the response.
4. **Return** `{ result: text, usedFallback: true }`.

## How to verify

From `code/`:

```bash
lcdev verify 02-fallback-retry              # your code
lcdev verify 02-fallback-retry --solution   # reference
```

## Success criteria

- `result.userReturn.usedFallback === true`.
- `result.userReturn.result` is a non-empty string.
- At least one model call is captured (the fallback call).

## Hint

The harness only captures `BaseChatModel.invoke()` calls. The `RunnableLambda` throws before reaching any model — so `calls.length` reflects only fallback model invocations.

```ts
const chain = brokenPrimary.withFallbacks([realModel]);
const response = await chain.invoke([new HumanMessage("...")]);
```

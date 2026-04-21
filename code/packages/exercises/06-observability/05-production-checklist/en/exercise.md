# 05 · Production checklist — retry, fallback, cost, error boundary and run collector

## Goal

Combine all 5 production techniques from this track into a single hardened chain: automatic retries, backup model, cost logging, error capture, and run collection. This is the observability capstone exercise.

## Context

In production, a single model call can fail due to rate limits, latency, network errors, or malformed responses. A robust chain has layers of defense:

1. **`withRetry({ stopAfterAttempt: N })`** — automatically retries on transient errors.
2. **`withFallbacks([backupModel])`** — if the primary model exhausts its retries, the backup takes over.
3. **Cost callback** (`BaseCallbackHandler.handleLLMEnd`) — logs token usage for each call.
4. **Error-boundary callback** (`handleLLMError`) — captures errors without crashing the application.
5. **`RunCollectorCallbackHandler`** — collects runs offline for later debugging.

The layers are composed like this:
```ts
const modelWithRetry = primaryModel.withRetry({ stopAfterAttempt: 2 });
const modelWithFallback = modelWithRetry.withFallbacks([backupModel]);
await modelWithFallback.invoke(input, { callbacks: [costCb, errorBoundaryCb, collector] });
```

`wrapperTypes` is a declarative array — you define the names that summarize which techniques you applied. The test verifies that you declare all 5 expected strings.

## What to complete

Open `starter.ts`. You need to:

1. **Create the primary model** with `.withRetry({ stopAfterAttempt: 2 })`.
2. **Chain the fallback** with `.withFallbacks([backupModel])`.
3. **Complete `CostCallbackHandler.handleLLMEnd`**: extract tokens from `output.llmOutput` and push to `this.costLog`.
4. **Complete `ErrorBoundaryHandler.handleLLMError`**: push the error to `this.errors`.
5. **Instantiate all 3 callbacks** and invoke the chain with all of them.
6. **Declare `wrapperTypes`** = `["withRetry", "withFallbacks", "costCallback", "errorBoundary", "runCollector"]`.
7. **Return** the object with `wrapperTypes`, `callSucceeded: true`, `tracedRuns: collector.tracedRuns`.

## How to verify

From `code/`:

```bash
lcdev verify 05-production-checklist              # your code
lcdev verify 05-production-checklist --solution   # reference
lcdev run    05-production-checklist --solution   # inspect the active layers
```

## Success criteria

- At least one model call is captured by the harness.
- `wrapperTypes.length >= 5`.
- `wrapperTypes` contains exactly: `"withRetry"`, `"withFallbacks"`, `"costCallback"`, `"errorBoundary"`, `"runCollector"`.
- `callSucceeded === true`.
- `tracedRuns.length >= 1` — the collector captured at least one run.

## Hint

Layer order matters: retry first, fallback wraps retry. Callbacks go in `invoke`, not in the model constructor:

```ts
const modelWithRetry = createChatModel(provider, apiKey).withRetry({ stopAfterAttempt: 2 });
const modelWithFallback = modelWithRetry.withFallbacks([createChatModel(provider, apiKey) as any]);

await modelWithFallback.invoke(input, {
  callbacks: [costCallback, errorBoundary, collector],
});
```

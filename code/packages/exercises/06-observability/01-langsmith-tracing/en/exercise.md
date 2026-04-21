# 01 · LangSmith tracing — run collection and observability callbacks

## Goal

Instrument a LangChain chain with `RunCollectorCallbackHandler` to capture runs offline, and learn to add `LangChainTracer` when a LangSmith API key is configured.

## Context

LangChain has a callbacks system that fires events at every stage of a call's lifecycle: start, new token, end, error. `RunCollectorCallbackHandler` accumulates all those events in memory — with no LangSmith account required — under `collector.tracedRuns`. It is ideal for local debugging and tests.

`LangChainTracer` does the same but sends runs to the LangSmith platform (when `LANGCHAIN_API_KEY` is set). You can combine both in the same callbacks array: the collector always active, the tracer only when the key is available.

The callbacks array is passed as the second argument to `model.invoke(input, { callbacks })`. Each handler in the array receives the same lifecycle events in parallel.

The `LangChainTracer` scenario is automatically skipped if `LANGCHAIN_API_KEY` is not configured.

## What to complete

Open `starter.ts`. You need to:

1. **Create the collector**: `const collector = new RunCollectorCallbackHandler()`.
2. **Build the callbacks array**: always include `collector`; if `process.env["LANGCHAIN_API_KEY"]` exists, also push `new LangChainTracer()`.
3. **Invoke the model** with a simple message, passing `{ callbacks }` as the second argument.
4. **Return** an object with:
   - `collectedRuns`: `collector.tracedRuns` mapped to `{ id, name, run_type }`.
   - `tracingEnabled`: `boolean` indicating whether `LANGCHAIN_API_KEY` is present.

## How to verify

From `code/`:

```bash
lcdev verify 01-langsmith-tracing              # your code
lcdev verify 01-langsmith-tracing --solution   # reference
lcdev run    01-langsmith-tracing --solution   # inspect the returned object
```

## Success criteria

- At least one model call is captured by the harness.
- `collectedRuns.length >= 1` — the collector captured at least one run.
- Each run has keys `id`, `name`, and `run_type` with string values.
- `tracingEnabled` correctly reflects whether `LANGCHAIN_API_KEY` is in the environment.
- The `LangChainTracer` test is skipped (not failed) when `LANGCHAIN_API_KEY` is absent.

## Hint

The key insight: the callbacks array is built dynamically from the environment. A clean pattern:

```ts
const tracingEnabled = !!process.env["LANGCHAIN_API_KEY"];
const callbacks = tracingEnabled
  ? [collector, new LangChainTracer()]
  : [collector];

await model.invoke([new HumanMessage("...")], { callbacks });
```

After the invoke, `collector.tracedRuns` is already populated. Map it with `.map(r => ({ id: r.id, name: r.name, run_type: r.run_type }))`.

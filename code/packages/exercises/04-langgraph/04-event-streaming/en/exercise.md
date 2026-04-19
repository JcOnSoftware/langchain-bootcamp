# 04 · Event streaming with `graph.streamEvents`

## Goal

Consume the stream of **typed events** a graph emits as it runs. In Fase 5 you saw `agent.stream(..., { streamMode: "values" })` — state snapshots. Now you see the most granular thing LangChain offers: `streamEvents({ version: "v2" })`.

## Context

`streamEvents` emits an event for every milestone inside the graph:

- `on_chain_start` / `on_chain_end` — entry/exit of each node and the overall graph.
- `on_chat_model_start` / `on_chat_model_stream` / `on_chat_model_end` — each chat model call (and its streaming deltas if the model supports it).
- `on_tool_start` / `on_tool_end` — tool calls when tools are present.
- Other LangChain-internal events (LLM, runnable, etc.).

This is the same telemetry LangSmith uses under the hood. For production observability + debugging, it's the canonical API.

## What to complete

Open `starter.ts`. Two TODOs:

1. **`ask` node** — invoke the model with a `HumanMessage` built from `state.topic`. Return `{ reply: stringContent }`.
2. **Consume the stream** — `graph.streamEvents({ topic }, { version: "v2" })` returns an async iterable. Iterate with `for await (const evt of stream)`, count `evt.event` in `eventTypes[...]` and sum `totalEvents`.

## How to verify

From `code/`:

```bash
lcdev verify 04-event-streaming --solution   # with API key
lcdev run    04-event-streaming --solution   # inspect the event map
```

## Success criteria

- At least **one** chat model call captured by the harness.
- `totalEvents >= 3` — even a small graph emits several events (graph start + node + model + node end + graph end, at minimum).
- `eventTypes` has at least one key starting with `on_` (every LangChain event follows that pattern).

## Hint

```ts
const stream = graph.streamEvents({ topic: "X" }, { version: "v2" });
for await (const evt of stream) {
  eventTypes[evt.event] = (eventTypes[evt.event] ?? 0) + 1;
  totalEvents++;
}
```

`version: "v2"` is REQUIRED — v1 is deprecated and the event schema changed.

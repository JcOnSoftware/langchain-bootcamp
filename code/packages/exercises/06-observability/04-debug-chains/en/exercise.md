# 04 · Debug chains — stream events v2 and spy handler

## Goal

Use `streamEvents({ version: "v2" })` to observe the internal flow of a LangChain chain, and combine that visibility with a spy handler that captures events at the callbacks level.

## Context

`streamEvents` is the LangChain equivalent of a profiler: every node in the chain emits typed events in real time. With `{ version: "v2" }`, events follow the structured format `{ event: string, name: string, run_id: string, data: {...} }`.

For a chat model, the most important events are:
- `on_chat_model_start` — the model received the input.
- `on_chat_model_stream` — a response chunk arrived.
- `on_chat_model_end` — the response is complete.

A spy handler (`BaseCallbackHandler`) complements `streamEvents`: callbacks execute at the model level, before data propagates up to the chain level. Together they give complete visibility.

The pattern is:
```ts
const stream = model.streamEvents(input, { version: "v2", callbacks: [spy] });
for await (const evt of stream) {
  // evt.event is the type, e.g. "on_chat_model_start"
}
```

## What to complete

Open `starter.ts`. You need to:

1. **Complete `SpyHandler`**: in `handleLLMStart` and `handleLLMEnd`, push `{ type, runId }` to `this.handlerEvents`.
2. **Iterate `streamEvents`**: create a `Set<string>()` for `eventTypes` and add `evt.event` on each iteration.
3. **Pass the spy** in `{ callbacks: [spy] }` inside the `streamEvents` options.
4. **Return** `{ eventTypes: [...eventTypes], handlerEvents: spy.handlerEvents }`.

## How to verify

From `code/`:

```bash
lcdev verify 04-debug-chains              # your code
lcdev verify 04-debug-chains --solution   # reference
lcdev run    04-debug-chains --solution   # see what event types are emitted
```

## Success criteria

- At least one model call is captured by the harness.
- `eventTypes` includes at least `on_chat_model_start` or `on_llm_start`.
- `eventTypes` includes at least `on_chat_model_end` or `on_llm_end`.
- `handlerEvents.length >= 2` — the spy captured start and end.
- Each entry in `handlerEvents` has a non-empty string `type`.

## Hint

The event type is in `evt.event`. Use a `Set<string>` to deduplicate — the stream emits many events, some repeated:

```ts
const eventTypes = new Set<string>();
const stream = model.streamEvents(
  [new HumanMessage("...")],
  { version: "v2", callbacks: [spy] },
);
for await (const evt of stream) {
  eventTypes.add(evt.event);
}
// [...eventTypes] → ["on_chat_model_start", "on_chat_model_stream", "on_chat_model_end"]
```

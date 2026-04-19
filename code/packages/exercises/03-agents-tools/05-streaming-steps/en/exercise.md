# 05 · Stream intermediate agent steps

## Goal

Watch the agent live: while it thinks, while it calls tools, and when it emits the final answer. So far you've used `.invoke(...)`, which hands you the final result in a single `await`. Now you'll use `.stream(...)` with `streamMode: "values"` to receive a series of **snapshots** of the graph state. Each snapshot is a full picture of the state at that moment.

## Context

LangGraph supports several streaming modes for the same graph:

- **`values`** (what we use here): each snapshot is the full accumulated graph state after each step. Great for UIs that want to paint "where we are" without manual tracking.
- **`updates`**: only per-node deltas — useful when you have many nodes and don't want to re-render everything.
- **`messages`**: streams `AIMessage` tokens as they arrive (more granular, more noise).

For ReAct agents built with `createReactAgent`, `values` is the reasonable default: you'll see a snapshot after the first model step (with `tool_calls`), another after the tool runs (with the `ToolMessage` appended), and one more with the assistant's final answer. For this simple prompt, that's at least two snapshots; it may be more if the loop iterates.

The harness captures every model call inside the stream exactly like in `invoke`. What changes is your code: instead of a plain `await`, you iterate the stream with `for await`.

## What to complete

Open `starter.ts`. Four TODOs:

1. **Build the agent** with `createReactAgent({ llm: model, tools: [weatherTool] })`.
2. **Stream a single run** with `streamMode: "values"`:
   ```ts
   const stream = await agent.stream(
     { messages: [new HumanMessage("What's the weather in Paris?")] },
     { streamMode: "values" },
   );
   ```
3. **Collect snapshots** with `for await (const snap of stream) { snapshots.push(snap); }`.
4. **Return** `{ snapshotCount: snapshots.length, finalMessages: snapshots.at(-1)?.messages ?? [] }`.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 05-streaming-steps

# Reference solution
lcdev verify 05-streaming-steps --solution

# See snapshots arrive in real time
lcdev run 05-streaming-steps --solution --stream-live
```

## Success criteria

- At least **one** captured model call (`result.calls.length >= 1`).
- The model id matches the configured provider.
- `userReturn.snapshotCount >= 2` — the agent emitted at least two snapshots (initial + one after thinking, usually more).
- `userReturn.finalMessages.length >= 2` — the final state snapshot includes at least the `HumanMessage` and an `AIMessage` (usually more if a tool call happened).

## Hint

The pattern is mechanical:

```ts
const stream = await agent.stream(
  { messages: [new HumanMessage("What's the weather in Paris?")] },
  { streamMode: "values" },
);

const snapshots = [];
for await (const snap of stream) {
  snapshots.push(snap);
  // For visual debugging: console.log(snap.messages.length, "messages so far");
}
```

To see the state grow, log `snap.messages.length` on each iteration: you'll see 1, then 2 (AIMessage appended), then 3 (ToolMessage appended), then 4 (final AIMessage). That MONOTONIC growth is the signature of `streamMode: "values"`.

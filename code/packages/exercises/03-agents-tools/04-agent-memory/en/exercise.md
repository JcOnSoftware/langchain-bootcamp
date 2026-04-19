# 04 · Agent memory with MemorySaver

## Goal

Until now, every agent invocation started from scratch: it didn't remember the previous question or its own answers. To build real conversational assistants you need **state persistence across turns**. LangGraph solves this with **checkpointers**: they save the graph's state after each step and rehydrate it when you invoke again with the same `thread_id`.

## Context

A checkpointer is "graph memory", not "model memory". After each node runs, the graph serializes its full state (messages, auxiliary variables, whatever) and stores it under a key. The key is up to you at invoke time: it's called `thread_id`.

Critical rule: **both turns must share the SAME `thread_id`**. If you use different ids, each call starts a brand-new conversation and the model answers as if it had never seen your first question. The `config` is passed as the second argument to `.invoke(...)`:

```ts
const config = { configurable: { thread_id: "session-1" } };
```

For v0.1 we use `MemorySaver`, the in-memory checkpointer. In production you'd use the SQLite, Postgres, or Redis flavor — but the API is identical, only the class changes.

The harness intercepts every model call as always, so you'll see at least two entries in `result.calls` (one per agent turn). If the agent calls the tool in any turn, you'll see more.

## What to complete

Open `starter.ts`. Five TODOs:

1. **Create the checkpointer**: `const checkpointer = new MemorySaver();`.
2. **Build the agent** with `createReactAgent({ llm, tools: [weatherTool], checkpointer })`.
3. **Define the config with a stable `thread_id`**: `const config = { configurable: { thread_id: "session-1" } };`. BOTH turns must use it.
4. **Invoke twice** with the SAME `config`:
   - Turn 1: `"What's the weather in Lima?"`.
   - Turn 2: `"What about in Cusco? Compare to the previous answer."` (the back-reference forces the model to remember).
5. **Return** `{ turn1, turn2 }` with each final response's `.content` (stringify if not a string).

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 04-agent-memory

# Reference solution
lcdev verify 04-agent-memory --solution

# See both answers
lcdev run 04-agent-memory --solution
```

## Success criteria

- At least **two** model calls (`result.calls.length >= 2`) — one per turn (possibly more if the agent calls tools).
- The model id matches the configured provider (`claude-*`, `gpt-*`, or `gemini-*`).
- `userReturn.turn1` is a non-empty string.
- `userReturn.turn2` is a non-empty string.

## Hint

The canonical pattern:

```ts
const checkpointer = new MemorySaver();
const agent = createReactAgent({ llm: model, tools: [weatherTool], checkpointer });

const config = { configurable: { thread_id: "session-1" } };

const first = await agent.invoke(
  { messages: [new HumanMessage("What's the weather in Lima?")] },
  config,
);

const second = await agent.invoke(
  { messages: [new HumanMessage("What about in Cusco? Compare to the previous answer.")] },
  config,
);
```

Curious about the mechanism? Run `lcdev run 04-agent-memory --solution` and read `turn2`. It should mention Lima or explicitly compare to the previous answer — if not, suspect: you probably passed a different `thread_id` per turn.

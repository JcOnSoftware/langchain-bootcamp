# 02 · ReAct as an explicit graph

## Goal

Reimplement a ReAct agent (think → use tool → respond) as an explicit `StateGraph` with a **hand-rolled** tool dispatcher. In Fase 5 you used `createReactAgent` — now you see what it does under the hood.

## Context

A ReAct agent in LangGraph is really a simple graph:

```
START → agent → [tool_calls?] → tools → agent → END
                                  ▲       │
                                  └───────┘
```

- **`agent` node**: invokes the chat model with the message history. If the model decides to use a tool, the resulting `AIMessage` carries `tool_calls`.
- **`tools` node**: iterates over `tool_calls`, executes each tool, and produces `ToolMessage[]` as the state update.
- **Conditional edge**: after `agent`, if `tool_calls` → go to `tools`; else → `END`.

The loop terminates when the model returns a final response (no `tool_calls`).

## What to complete

Open `starter.ts`. Four TODOs:

1. **`agentNode`** — calls the model with `state.messages`. Return `{ messages: [reply] }`.
2. **`toolsNode`** — read `state.messages.at(-1).tool_calls`, invoke each via `toolsByName[tc.name].invoke(tc.args)`, wrap the output in `ToolMessage({ content, tool_call_id: tc.id })`. Return `{ messages: [...toolMessages] }`.
3. **`routeFromAgent`** — if the last message has `tool_calls`, return `"tools"`; else return `END`.
4. **Graph** — wire up both nodes, the conditional edge, and the `tools → agent` back-edge.

## How to verify

From `code/`:

```bash
lcdev verify 02-react-as-graph --solution   # reference (needs API key)
lcdev run    02-react-as-graph --solution   # inspect the final answer
```

## Success criteria

- The graph makes **at least 2** model calls (one to decide on the tool, one to answer).
- At least one captured call has `response.tool_calls.length >= 1`.
- The tool_call name matches one of the bound tools (`get_weather` or `get_time`).
- `answer` is a non-empty string.
- `messages.length >= 3` (human + ai-with-tool_calls + ai-final, at minimum).

## Hint — `MessagesAnnotation`

`MessagesAnnotation` is a prebuilt that already ships the `addMessages` reducer. Your state is just `messages: BaseMessage[]`; when a node returns `{ messages: [newMsg] }`, the reducer APPENDS to the list instead of replacing it.

## Hint — conditional edge

```ts
.addConditionalEdges("agent", routeFromAgent, ["tools", END])
```

The third argument (`pathMap`) is optional but helps typing — declare the possible destinations the router can return.

## Anti-pattern to avoid

Don't use `ToolNode` from prebuilt. The point of this exercise is to see the dispatcher by hand. You'll use `ToolNode` elsewhere — for now, understand what it does.

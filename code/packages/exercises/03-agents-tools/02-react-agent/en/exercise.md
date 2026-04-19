# 02 · ReAct agent with createReactAgent

## Goal

One level up from exercise 01: instead of binding the tool and reading a single `tool_call`, you'll delegate the full reason ↔ act loop to the agent. `createReactAgent` is LangGraph's prebuilt building block that wires the classic ReAct graph for you (think → call tool → observe → answer). Your job is to hand it the model, the tools, and a question; everything else is internal orchestration.

## Context

ReAct = **Rea**son + **Act**. The model alternates reasoning steps ("to answer this I need X") with action steps ("I'll call tool X"), reads the result, and decides whether to answer or take another step. Hand-rolling this means loops, conditions, and message bookkeeping — `createReactAgent` encapsulates all of it in a `CompiledStateGraph` that responds to `.invoke({ messages: [...] })`.

Two important things:

1. The agent maintains a growing message array. At the end, `result.messages` contains: your `HumanMessage`, one or more `AIMessage`s with `tool_calls`, the `ToolMessage`s with results, and the final `AIMessage` with the natural-language answer.
2. The `@lcdev/runner` harness intercepts EVERY model call during the loop. If the agent iterates twice, you'll see two entries in `result.calls`.

## What to complete

Open `starter.ts`. Four TODOs:

1. **Define two tools**: `get_weather({ city })` and `get_time({ tz })`. Each returns a short string. The descriptions are what the model reads to decide when to call each — be specific.
2. **Build the agent** with `createReactAgent({ llm: model, tools: [weatherTool, timeTool] })`.
3. **Invoke the agent** with a single `HumanMessage`: `"What's the weather in Lima and what time is it there?"`. The question intentionally asks for data from both tools.
4. **Extract the final answer**: it's the last item of `result.messages`. Return `{ answer, messages: result.messages }`.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 02-react-agent

# Reference solution
lcdev verify 02-react-agent --solution

# See the full trace (messages + answer)
lcdev run 02-react-agent --solution
```

## Success criteria

- The agent loop makes at least **two** model calls (`result.calls.length >= 2`): one to decide the tools and one (or more) to compose the answer. Smaller models may iterate more — we use `>=` on purpose.
- The model id matches the configured provider (`claude-*`, `gpt-*`, or `gemini-*`).
- At least **one** captured call has `response.tool_calls` with length `>= 1`.
- `userReturn.answer` is a non-empty natural-language string.
- `userReturn.messages` has at least 3 elements (human + assistant with tool_calls + final assistant; usually more).

## Hint

The canonical form is this short:

```ts
const agent = createReactAgent({ llm: model, tools: [weatherTool, timeTool] });

const result = await agent.invoke({
  messages: [new HumanMessage("What's the weather in Lima and what time is it there?")],
});

const finalMessage = result.messages.at(-1);
const answer = typeof finalMessage?.content === "string"
  ? finalMessage.content
  : JSON.stringify(finalMessage?.content);
```

To see what the agent decided step by step, walk `result.messages` and note each type (`HumanMessage`, `AIMessage` with `tool_calls`, `ToolMessage`). That's your mental map of the loop.

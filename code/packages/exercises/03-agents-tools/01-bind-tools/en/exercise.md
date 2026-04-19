# 01 · Bind a tool and inspect the tool_calls

## Goal

Teach the model to decide, on its own, when a tool is better than answering from memory. You'll define a tool with `tool(...)`, bind it to a chat model with `bindTools([...])`, and read the `AIMessage.tool_calls` produced by the single model call. No agents yet — just step zero.

## Context

A "tool call" is a structured response from the model where, instead of text, it returns `{ name, args, id }`: its intent to execute a function. You choose whether to run it or ignore it. LangChain normalizes this format across all three providers (Anthropic, OpenAI, Gemini), so the same code works with any of them.

`bindTools` returns a new model with the tools registered. The model does NOT execute them: it only proposes them and the consumer decides. That's the heart of the "tool use" pattern and the foundation for the ReAct agents coming in the next exercises.

## What to complete

Open `starter.ts`. Four TODOs:

1. **Fill in `weatherTool`'s body**: takes `{ city }`, returns a string like `` `Sunny in ${city}, 22°C.` ``.
2. **Bind the tool** to the model with `model.bindTools([weatherTool])`.
3. **Invoke the bound model** with two messages:
   - A `SystemMessage` that FORCES tool use: `"You MUST call the get_weather tool for any weather question. Do not answer from your own knowledge."`
   - A `HumanMessage` with the question (`"What's the weather in Lima?"`).
4. **Return** `{ toolCalls: ai.tool_calls ?? [], finalMessage: ai }`.

We don't set `tool_choice` on purpose: it behaves differently across providers and a firm prompt is enough here.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 01-bind-tools

# Reference solution
lcdev verify 01-bind-tools --solution

# See the full AIMessage (content + tool_calls)
lcdev run 01-bind-tools --solution
```

## Success criteria

- Exactly **one** model call (`result.calls.length === 1`). No agent loop — it's a single turn.
- The model decided to call at least one tool (`result.lastCall.response.tool_calls.length >= 1`).
- The invoked tool is named exactly `get_weather` (assert on NAME, not on arg values).
- `userReturn.toolCalls` is an array with at least one element.

## Hint

The pattern is this simple:

```ts
const bound = model.bindTools([weatherTool]);

const ai = (await bound.invoke([
  new SystemMessage("You MUST call the get_weather tool..."),
  new HumanMessage("What's the weather in Lima?"),
])) as AIMessage;

console.log(ai.tool_calls);
// → [{ name: "get_weather", args: { city: "Lima" }, id: "toolu_...", type: "tool_call" }]
```

Important: the harness also captures `tool_calls` at `result.lastCall.response.tool_calls`, so your tests can assert on the tool NAME without depending on the arg values the model chose (which are non-deterministic).

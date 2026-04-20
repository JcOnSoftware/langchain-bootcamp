# 05 · Tool Schema Validation — Zod-enforced args with `tool()` and `bindTools`

## Goal

Define a tool with a Zod schema for its arguments, bind it to a model, verify the model calls it with valid args, and demonstrate that invalid args are rejected by the schema before the function runs.

## Context

`tool()` is the recommended LangChain 1.x API for defining callable tools. When you pass a `schema` option with a Zod object, LangChain validates the args through that schema every time the tool is invoked — whether called by the model via `bindTools` or called directly.

The validation happens inside `tool.invoke()`, not at the model level. The model sends JSON `tool_calls`; LangChain parses the JSON and validates the resulting object through Zod before calling your function.

## What to complete

Open `starter.ts`. You need to:

1. **Add an optional `unit` field** to `WeatherArgsSchema`: `z.enum(["celsius", "fahrenheit"]).optional()`.
2. **Complete the tool function** to return a meaningful weather string.
3. **Invoke the bound model** with a system prompt instructing it to use `get_weather` and a human message asking about a city.
4. **Run the tool** with the args from the model's `tool_calls[0]`.
5. **Demonstrate rejection**: call `weatherTool.invoke()` with invalid args (e.g., `city: 12345`) and catch the error.
6. **Return** `{ validResult, validationError }`.

## How to verify

From `code/`:

```bash
lcdev verify 05-tool-schema-validation              # your code
lcdev verify 05-tool-schema-validation --solution   # reference
lcdev run    05-tool-schema-validation --solution   # inspect tool_calls
```

## Success criteria

- At least one model call captured.
- `validResult` is truthy (tool executed with valid args).
- `WeatherArgsSchema.safeParse(tc?.args).success === true` for the model's tool call.
- `validationError` is a non-empty string.

## Bonus (stretch — not in tests)

LangChain throws a `ToolInputParsingException` when args fail validation. You can catch it specifically:

```ts
import { ToolInputParsingException } from "@langchain/core/tools";
try {
  await weatherTool.invoke({ city: 12345 as unknown as string });
} catch (err) {
  if (err instanceof ToolInputParsingException) {
    console.log("Schema rejected args:", err.message);
  }
}
```

This is useful in production systems where you want to route tool errors differently from model errors.

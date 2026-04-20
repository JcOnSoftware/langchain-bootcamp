# 01 · Structured Output with Zod — typed responses from any model

## Goal

Force any chat model to return a typed, validated object instead of raw text. You will define a Zod schema, pass it to `model.withStructuredOutput(schema)`, and get back a parsed TypeScript object every time.

## Context

LangChain's `withStructuredOutput` wraps the chat model with provider-specific JSON enforcement (function calling, JSON mode, or JSON schema constraints — the correct path is chosen automatically). You write one Zod schema, and LangChain handles the rest across Anthropic, OpenAI, and Gemini.

The return value of `withStructuredOutput(schema).invoke(input)` is already parsed and typed by TypeScript — no `JSON.parse`, no manual validation.

## What to complete

Open `starter.ts`. You need to:

1. **Define `MovieSchema`** — a `z.object({...})` with at least 4 fields: `title`, `year`, `genre`, `summary`.
2. **Wrap the model** with `model.withStructuredOutput(MovieSchema, { name: "movie_recommendation" })`.
3. **Invoke** with a `HumanMessage` asking for a classic sci-fi movie recommendation.
4. **Return** the result directly — it is already the typed object.

## How to verify

From `code/`:

```bash
lcdev verify 01-structured-output-zod              # your code
lcdev verify 01-structured-output-zod --solution   # reference
lcdev run    01-structured-output-zod --solution   # inspect the returned object
```

## Success criteria

- At least one model call is captured.
- `result.userReturn` passes `MovieSchema.safeParse(...)` — all declared fields present with the right types.
- `userReturn.title` is a non-empty string.
- `userReturn.year` is a number.

## Hint

The key insight: `withStructuredOutput` returns a `Runnable<BaseLanguageModelInput, z.infer<Schema>>`, not a `Runnable<..., AIMessage>`. You can chain it with `.pipe(...)` or `.invoke(...)` directly.

```ts
const structured = model.withStructuredOutput(MovieSchema);
const result = await structured.invoke([new HumanMessage("...")]);
// result is typed as { title: string; year: number; genre: string; summary: string }
```

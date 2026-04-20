# 04 · Extended Thinking — reasoning traces with ChatAnthropic

> **Anthropic-only exercise.** This feature is not available on OpenAI or Gemini.
> Run with `LCDEV_PROVIDER=anthropic`.

## Goal

Enable extended thinking on `ChatAnthropic` so the model produces an internal reasoning trace (a "thinking" block) before writing its answer. You will inspect `AIMessage.content` to verify that both a thinking block and a text block are present.

## Context

Extended thinking lets Claude reason out loud before committing to an answer. The `AIMessage.content` field becomes an array of typed content blocks instead of a plain string:

```json
[
  { "type": "thinking", "thinking": "Let me work through this step by step..." },
  { "type": "text", "text": "The answer is 5050." }
]
```

This is Anthropic-specific functionality. LangChain exposes it via the `thinking` option on `ChatAnthropic`.

**Important API note:** The Anthropic API expects `budget_tokens` in snake_case. LangChain passes the `thinking` object verbatim to the underlying SDK, so you must use snake_case:

```ts
thinking: { type: "enabled", budget_tokens: 1024 }
```

## What to complete

Open `starter.ts`. You need to:

1. **Add the `thinking` config** to the `ChatAnthropic` constructor: `{ type: "enabled", budget_tokens: 1024 }`.
2. **Write a prompt** that requires non-trivial step-by-step reasoning (e.g., a math problem, a logic puzzle).
3. **Return** `{ content, hasThinking, hasText }` where the booleans come from scanning the content array.

## How to verify

From `code/` (set `LCDEV_PROVIDER=anthropic` first):

```bash
lcdev verify 04-extended-thinking --solution     # reference
lcdev verify 04-extended-thinking                # your code
```

On non-Anthropic providers the test suite is **skipped** (not failed) automatically.

## Success criteria

- `result.calls.length >= 1`.
- `result.userReturn.hasThinking === true`.
- `result.userReturn.hasText === true`.
- `result.userReturn.content` contains at least one `{ type: "thinking" }` and one `{ type: "text" }` block.

## Hint

`maxTokens` must be greater than `budget_tokens`. A ratio of 2:1 is safe:

```ts
const model = new ChatAnthropic({
  model: "claude-sonnet-4-5",
  apiKey,
  thinking: { type: "enabled", budget_tokens: 1024 },
  maxTokens: 2048,
});
```

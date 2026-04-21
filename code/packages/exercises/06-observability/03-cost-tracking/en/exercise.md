# 03 · Cost tracking — compute token costs from usage_metadata

## Goal

Read `usage_metadata` from the model response, define a per-model-family rate table, and compute the exact cost of each call. This is the foundation of any production spend-monitoring system.

## Context

When you invoke a LangChain chat model, the `AIMessage` response includes `usage_metadata` with token counts: `input_tokens`, `output_tokens`, and sometimes `total_tokens`. This field is normalized by LangChain — all three providers (Anthropic, OpenAI, Gemini) report it in the same shape.

Cost is computed with a rate table: most providers charge differently for input and output tokens. Rates are in USD per million tokens.

```
inputCost = (inputTokens / 1_000_000) * inputRateUSD
outputCost = (outputTokens / 1_000_000) * outputRateUSD
totalCost = inputCost + outputCost
```

The model id comes from `response.response_metadata.model_name` (Anthropic) or `.model` (OpenAI/Gemini). You use it to look up the correct rate in your table.

**Important**: Do NOT import from `@lcdev/runner/cost` or any other CLI module. You define the rate table inline — that is the point of this exercise.

## What to complete

Open `starter.ts`. You need to:

1. **Fill `RATES`**: add entries for the models you use (`haiku`, `sonnet`, `gpt-4o-mini`, `gemini-2.5-flash`). Use regex patterns so the match is resilient to model name variants.
2. **Implement `computeCost`**: find the entry that matches `modelId` and compute `inputCost`, `outputCost`, `totalCost`.
3. **Invoke the model** with a simple message.
4. **Read `usage_metadata`** from the response: `(response as any).usage_metadata`.
5. **Read `modelId`** from `response_metadata.model_name` or `response_metadata.model`.
6. **Return** the complete object with all fields.

## How to verify

From `code/`:

```bash
lcdev verify 03-cost-tracking              # your code
lcdev verify 03-cost-tracking --solution   # reference
lcdev run    03-cost-tracking --solution   # inspect the cost values
```

## Success criteria

- At least one model call is captured by the harness.
- `inputTokens > 0` — the model consumed input tokens.
- `outputTokens > 0` — the model generated output tokens.
- `totalCost > 0` — the model has a matching rate in your table and cost is computed correctly.
- `Math.abs(totalCost - (inputCost + outputCost)) < 1e-9` — the arithmetic is exact.
- `modelId` is a non-empty string.

## Hint

To safely read `usage_metadata` in TypeScript:

```ts
const usageMetadata = (response as { usage_metadata?: Record<string, unknown> }).usage_metadata;
const inputTokens = typeof usageMetadata?.["input_tokens"] === "number"
  ? usageMetadata["input_tokens"]
  : 0;
```

The `modelId` comes from `response_metadata`:

```ts
const responseMetadata = (response as { response_metadata?: Record<string, unknown> }).response_metadata;
const modelId = typeof responseMetadata?.["model_name"] === "string"
  ? responseMetadata["model_name"]
  : (typeof responseMetadata?.["model"] === "string" ? responseMetadata["model"] : "");
```

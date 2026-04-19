# 03 · Conditional routing with RunnableBranch

## Goal

Learn to route inputs to different chains based on a condition. Here you use text length as the discriminator: short text gets a one-sentence summary, long text gets a three-bullet summary.

## Context

`RunnableBranch` is LCEL's "if/else". It takes a list of `[condition, runnable]` pairs plus a default runnable at the end. It evaluates conditions in order and runs the first match; if nothing matches, the default runs.

This is useful for real-world patterns: routing between different prompts per question type, model fallbacks, agent dispatch, and so on. The key concept: the condition is a sync function over the input — it does NOT call the model. The model runs inside each branch.

## What to complete

Open `starter.ts`. Four TODOs:

1. **Two prompts** — one asking for a single-sentence summary, one asking for three bullets.
2. **Two chains** — `shortChain` and `longChain`, each `prompt → model → parser`.
3. **RunnableBranch** — condition: `input.text.length < 50` routes to `shortChain`; default is `longChain`.
4. **Two invocations** — one with a short text, one with a long text. Return `{ short, long }`.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 03-branch

# Reference solution
lcdev verify 03-branch --solution

# See real output
lcdev run 03-branch --solution
```

## Success criteria

- The chain makes exactly **two** model calls (one per invocation).
- Both calls use the configured provider.
- Input and output tokens are positive on both calls.
- The return value is `{ short, long }` where both fields are non-empty strings.

## Hint

The branch signature is `RunnableBranch.from<RunInput, RunOutput>([...branches, defaultBranch])`. The generic matters: set `RunInput` to your input object and `RunOutput` to the final string type.

```ts
const chain = RunnableBranch.from<BranchInput, string>([
  [(input) => input.text.length < 50, shortChain],
  longChain, // default
]);
```

Note the default is NOT wrapped in an array — it's the last loose element. The API has a slightly special shape.

# 01 · Your first LCEL chain

## Goal

Build your first LCEL chain: `prompt → model → parser`. It's the "Hello, world" of LangChain. If you understand how this chain composes, you have 80% of LCEL's mental model.

## Context

LCEL (LangChain Expression Language) lets you compose `Runnable`s with the `.pipe()` operator. Each Runnable takes an input, transforms it, and passes the result to the next. No inheritance, no internal state — pure plumbing.

In this exercise you'll chain three pieces:

1. **`ChatPromptTemplate`** — takes `{ topic }`, returns a formatted message list.
2. **Chat model** — takes the messages, returns an `AIMessage`.
3. **`StringOutputParser`** — takes the `AIMessage`, returns plain text.

## What to complete

Open `starter.ts`. Three TODOs:

1. **Build the prompt** with `ChatPromptTemplate.fromMessages([...])`. Two messages: one `"system"` to set the model's tone, one `"human"` referencing the `{topic}` variable.
2. **Compose the chain** with `.pipe(...)`. Order is `prompt → model → parser`.
3. **Invoke the chain** with `chain.invoke({ topic: "LCEL" })` and return the resulting string.

## How to verify

From the repo root (`cd code/`):

```bash
# Your code
lcdev verify 01-hello-chain

# Reference solution
lcdev verify 01-hello-chain --solution

# See real output
lcdev run 01-hello-chain --solution
```

## Success criteria

- The chain makes exactly **one** model call.
- The returned model id matches the configured provider (Anthropic → `claude-*`, OpenAI → `gpt-*`, Gemini → `gemini-*`).
- Input and output tokens are both greater than zero.
- The return value is a non-empty string (the parser guarantees this if the chain is wired correctly).

## Hint

The canonical pattern is:

```ts
const chain = prompt.pipe(model).pipe(new StringOutputParser());
const answer = await chain.invoke({ topic: "LCEL" });
```

If you prefer the explicit form:

```ts
const chain = RunnableSequence.from([prompt, model, new StringOutputParser()]);
```

Both compile to the same runtime shape.

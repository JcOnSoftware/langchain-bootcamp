# 02 · Custom callbacks — lifecycle event hooks with BaseCallbackHandler

## Goal

Create a custom handler by extending `BaseCallbackHandler` to intercept lifecycle events of a model call. Learn which methods are available and when each one fires.

## Context

`BaseCallbackHandler` is the base class for all LangChain handlers. By extending it and overriding its optional methods, you can execute logic at precise moments in the lifecycle: before the model starts (`handleLLMStart`), when each token arrives (`handleLLMNewToken`), and when the complete response is received (`handleLLMEnd`).

Methods are optional — you only define the ones you need. Each method receives relevant context: `handleLLMStart` gets the model object, the prompts, and the run id; `handleLLMEnd` gets the complete result and the run id.

The handler is passed as a callback in `model.invoke(input, { callbacks: [handler] })`. LangChain invokes its methods automatically in the correct order.

## What to complete

Open `starter.ts`. You need to:

1. **Complete `handleLLMStart`**: push `{ type: "handleLLMStart" }` to `this.events`.
2. **Complete `handleLLMEnd`**: push `{ type: "handleLLMEnd" }` to `this.events`.
3. **Instantiate the handler** and pass it as a callback to the invoke.
4. **Return** `{ events: handler.events }`.

## How to verify

From `code/`:

```bash
lcdev verify 02-custom-callbacks              # your code
lcdev verify 02-custom-callbacks --solution   # reference
lcdev run    02-custom-callbacks --solution   # inspect captured events
```

## Success criteria

- At least one model call is captured by the harness.
- `events.length >= 2` — at least one `handleLLMStart` and one `handleLLMEnd` were fired.
- `events` contains at least one entry with `type === "handleLLMStart"`.
- `events` contains at least one entry with `type === "handleLLMEnd"`.
- Every entry in `events` has a non-empty string `type` field.

## Hint

The class needs a unique name (the `name` property). LangChain uses it internally to identify the handler:

```ts
class MyCallbackHandler extends BaseCallbackHandler {
  name = "my-callback-handler";
  events: Array<{ type: string }> = [];

  override handleLLMStart(_llm: Serialized, _prompts: string[], _runId: string): void {
    this.events.push({ type: "handleLLMStart" });
  }

  override handleLLMEnd(_output: LLMResult, _runId: string): void {
    this.events.push({ type: "handleLLMEnd" });
  }
}
```

The `override` keyword is required — this project has `noImplicitOverride` enabled in TypeScript.

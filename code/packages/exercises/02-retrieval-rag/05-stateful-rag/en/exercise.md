# 05 · Stateful RAG with RunnableWithMessageHistory

## Goal

Wrap a RAG chain with `RunnableWithMessageHistory` so it keeps per-session conversation history. The second turn ("And what if the book is damaged?") only makes sense because the first one established context ("What's the return window?"). Without history, the model is blind to that continuity.

## Context

### Stateful vs stateless

Pure LCEL is stateless: every `invoke` starts from scratch. That scales great but can't handle conversations. `RunnableWithMessageHistory` is the wrapper that lets you add PER-SESSION state without rewriting your chain.

Under the hood:

1. You hand it a `runnable` (your regular RAG chain) and a `getMessageHistory(sessionId)` function that tells it how to load/save history.
2. Before invoking the runnable, it injects past messages into the prompt's `MessagesPlaceholder("history")`.
3. After the response, it stores the (user question, model answer) pair into that session's history.
4. Everything triggers when you invoke with `{ configurable: { sessionId: "..." } }`.

### `InMemoryChatMessageHistory`

In production you'd use Postgres, Redis, or DynamoDB. For exercises and prototypes, `InMemoryChatMessageHistory` lives in an in-memory Map — zero infra, perfect for learning.

## What to complete

Open `starter.ts`. Four TODOs:

1. **Prompt with history slot**: `ChatPromptTemplate.fromMessages([...])` with three slots in this order: `system` (with `{context}`), `MessagesPlaceholder("history")`, and `human` (`{question}`).
2. **Inner RAG chain**: takes `{ question }`, uses `RunnablePassthrough.assign({ context: async (input) => formatDocs(await retriever.invoke(input.question)) })`, then `prompt → model → StringOutputParser`.
3. **Wrap with `RunnableWithMessageHistory`**: use `Map<string, InMemoryChatMessageHistory>` as the backend. `inputMessagesKey: "question"`, `historyMessagesKey: "history"`.
4. **Invoke twice** with the SAME `sessionId`: `"What's the return window?"` then `"And what if the book is damaged?"`. Return `{ turn1, turn2 }`.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 05-stateful-rag

# Reference solution
lcdev verify 05-stateful-rag --solution

# See the two turns in action
lcdev run 05-stateful-rag --solution
```

## Success criteria

- Exactly **two** chat-model calls (one per turn). `result.calls.length === 2`.
- Both calls use the configured provider's model (regex `claude-*`, `gpt-*`, `gemini-*`).
- Return value is `{ turn1, turn2 }` with both strings non-empty.

## Hint

The cleanest pattern:

```ts
const sessions = new Map<string, InMemoryChatMessageHistory>();

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: ragChain,
  getMessageHistory: (sessionId: string) => {
    let h = sessions.get(sessionId);
    if (!h) { h = new InMemoryChatMessageHistory(); sessions.set(sessionId, h); }
    return h;
  },
  inputMessagesKey: "question",
  historyMessagesKey: "history",
});

const config = { configurable: { sessionId: "test-session-1" } };
const turn1 = await chainWithHistory.invoke({ question: "..." }, config);
const turn2 = await chainWithHistory.invoke({ question: "..." }, config);
```

Key: the `sessionId` must be the SAME across both invokes; change it and the second turn starts with empty history, defeating the "inherited context" test.

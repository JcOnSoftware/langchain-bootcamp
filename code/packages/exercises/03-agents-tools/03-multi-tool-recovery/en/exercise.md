# 03 · Recover from a failing tool

## Goal

Real-world tools fail: upstream APIs 500, timeouts trip, databases stop responding. A well-designed agent must NOT explode when that happens — it has to read the error like any other output, pick a plan B, and answer the user with what it could gather. In this exercise you'll model that scenario on purpose: three tools, one guaranteed to fail, and the agent still has to do the job.

## Context

The canonical LangChain pattern for resilient tools is **catch the error INSIDE the tool body and return a string** instead of letting the exception propagate. Like this:

```ts
try {
  throw new Error("Upstream service down");
} catch (err) {
  return `Tool error: ${err.message}`;
}
```

The agent reads that string just like any other result, understands the tool failed, and decides to try another. If you let the error bubble up, the ReAct graph breaks and `invoke()` throws to the caller.

One detail: the tests verify the broken tool was actually called. For that we use a module-level flag (`let brokenInvoked = false`) that the tool flips in its catch. It's the simplest way to confirm "yes, the model chose to call it, and yes, your catch ran".

## What to complete

Open `starter.ts`. Five TODOs:

1. **`lookup_by_id({ id })`**: returns a string simulating an item found (`Item with id "X": {...}`).
2. **`lookup_by_name({ name })`**: returns a string with one or more matches.
3. **`broken_search({ query })`**: `throw new Error("Upstream service down")` inside a `try`, catch it, set `brokenInvoked = true`, return `"Tool error: ${err.message}"`.
4. **Build the agent** with `createReactAgent({ llm, tools: [lookupByIdTool, lookupByNameTool, brokenSearchTool] })`.
5. **Invoke with the forcing prompt**: `"Look up 'product-42' using every available tool; report what you find."` — "every" pushes the model to explore all three tools, including the broken one.

## How to verify

From `code/`:

```bash
# Your code
lcdev verify 03-multi-tool-recovery

# Reference solution
lcdev verify 03-multi-tool-recovery --solution

# See the full trace
lcdev run 03-multi-tool-recovery --solution
```

## Success criteria

- `runUserCode` did NOT throw (the agent recovered and closed the loop cleanly).
- The agent loop made at least **two** model calls (`result.calls.length >= 2`).
- `userReturn.answer` is a non-empty string.
- `userReturn.errorSeen === true` — confirms `broken_search` was invoked and its catch ran. If the flag is false, your prompt didn't push the model to try the broken tool, or the tool was wired wrong.

## Hint

The trick is NOT letting the error escape. The pattern:

```ts
const brokenSearchTool = tool(
  async ({ query }) => {
    try {
      throw new Error("Upstream service down");
    } catch (err) {
      brokenInvoked = true;
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
  { name: "broken_search", description: "...", schema: z.object({ query: z.string() }) },
);
```

To see the full loop, `lcdev run ... --solution` prints `result.messages` — look for the `ToolMessage` with `content: "Tool error: Upstream service down"` and the following `AIMessage` where the agent picks a different tool.

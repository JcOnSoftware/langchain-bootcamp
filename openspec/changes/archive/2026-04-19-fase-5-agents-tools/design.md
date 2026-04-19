# Design: Fase 5 — Track 03 Agents & Tools

## Technical Approach

Reuse the exercise layout from Fases 3-4. Each agent exercise uses canonical LangChain APIs directly — `tool()` + `createReactAgent` + `MemorySaver` — with no runner helpers. Tests assert on `result.calls` count (lower-bound), `tool_calls` names on captured AIMessages, and `userReturn` structural fields. No runner or CLI changes.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|---|---|---|---|
| Tool definition | `tool(fn, { name, description, schema })` from `@langchain/core/tools` | runner wrapper | Bootcamp teaches canonical surface; wrapper adds abstraction debt |
| Agent | `createReactAgent` from `@langchain/langgraph/prebuilt` | hand-rolled agent loop | `createReactAgent` IS the answer learners want to see; hand-rolled is a sibling-level concern |
| Checkpointer (04) | `MemorySaver` from `@langchain/langgraph-checkpoint` | SQLite / custom | In-memory suffices for single-process test; persistent checkpointers out of v0.1 |
| Stream mode (05) | `streamMode: "values"` | `"updates"` / `"messages"` | Snapshot semantics make assertions easier; final snapshot = full trace |
| Error recovery (03) | Tool body `try { … } catch (e) { return errorString }` | LangGraph runtime error handling | Prompt-level recovery is explicit and teachable; runtime handling hides the pattern |
| Assert count | Lower-bound `>=` not strict `===` | Strict count | Agents are nondeterministic — small models may loop; lower-bound matches observable guarantees |
| Tool args assertions | Assert on NAME + presence, never on VALUES | Assert on args | Values are model-chosen; tests would flake |

## Data Flow

### 02-react-agent example

```
 user question                                createReactAgent
     │                                              │
     ▼                                              ▼
 tools = [weatherTool, calcTool]         state graph: START → agent → tools? → agent → END
                                                    │
                                                    ▼
                                         each agent node step:
                                         model.invoke(accumulated messages)  ← harness captures
                                                    │
                                                    ▼
                                         if tool_calls present: execute, loop back
                                         else: END with final AIMessage
                                                    │
                                                    ▼
                                         userReturn = { answer: finalMessage.content, messages }
```

### 05-streaming-steps flow

```
  for await (snapshot of agent.stream(input, { streamMode: "values" })) {
    snapshots.push(snapshot);
  }
  // each snapshot = { messages: BaseMessage[] } with full accumulated trace
  userReturn = { snapshotCount: snapshots.length, finalMessages: snapshots.at(-1).messages }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `code/packages/exercises/03-agents-tools/01-bind-tools/` | Create | 6 files |
| `code/packages/exercises/03-agents-tools/02-react-agent/` | Create | 6 files |
| `code/packages/exercises/03-agents-tools/03-multi-tool-recovery/` | Create | 6 files |
| `code/packages/exercises/03-agents-tools/04-agent-memory/` | Create | 6 files |
| `code/packages/exercises/03-agents-tools/05-streaming-steps/` | Create | 6 files |
| `code/packages/runner/` | Untouched | Harness sufficient |
| `code/packages/exercises/package.json` | Untouched | All deps present |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Short §Agents + tool_calls assert guidance (non-blocking) |

## Interfaces / Contracts

Exercise solution shape (02-react-agent sketch):

```ts
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

const weatherTool = tool(
  async ({ city }) => `Sunny in ${city}, 22°C.`,
  { name: "get_weather", description: "Get current weather for a city",
    schema: z.object({ city: z.string() }) },
);

export default async function run() {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] ?? "";
  const model = createChatModel(provider, apiKey);
  const agent = createReactAgent({ llm: model, tools: [weatherTool] });

  const result = await agent.invoke({
    messages: [new HumanMessage("What's the weather in Lima?")],
  });
  const lastMsg = result.messages.at(-1);
  const answer = typeof lastMsg?.content === "string" ? lastMsg.content : "";
  return { answer, messages: result.messages as BaseMessage[] };
}
```

For 04-agent-memory, add `checkpointer: new MemorySaver()` to `createReactAgent` args + pass `{ configurable: { thread_id: "turn-1" } }` on each invoke.

For 01-bind-tools, skip `createReactAgent` entirely — use raw `model.bindTools([weatherTool]).invoke([new HumanMessage("…")])` and inspect `response.tool_calls`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Each exercise `tests.test.ts` via `runUserCode` | Real provider + key gated with fail-fast beforeAll |
| Shape | `calls.length >= N`, `tool_calls[].name === "get_weather"`, userReturn keys/types | No arg-value asserts; no text-content asserts |
| Verify-phase | Voseo grep over `packages/exercises/` | `rg -i` same pattern |
| Smoke | `lcdev list` shows 15 entries; `lcdev verify 02-react-agent --solution` live-green | Manual post-apply |

## Migration / Rollout

No migration. Additive third track. No impact on Fase 3 or Fase 4 code.

## Open Questions

- [ ] **tool_choice forcing on 01-bind-tools**: some providers need `tool_choice: "any"` or `"required"` to force tool selection. Resolve at apply by checking LC 1.x `bindTools` options per provider and using the most portable form (prefer explicit system message over tool_choice if any provider doesn't support it).
- [ ] **03-multi-tool-recovery errorSeen signaling**: how does the solution know the failing tool was invoked? Options: (a) tool closure sets a module-level flag, (b) count tool calls in captures and compare to expected. Resolve at apply — (a) is simpler for a learning exercise.

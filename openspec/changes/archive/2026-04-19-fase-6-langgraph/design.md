# Design: Fase 6 — Track 04 LangGraph

## Technical Approach

Same exercise layout as Fases 3-5. Each exercise imports `@langchain/langgraph` APIs directly — no runner helpers. Harness unchanged: `BaseChatModel.invoke` patch already covers chat calls from graph nodes. Tests assert on shape (state keys, event types, resume flags), never on text content.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|---|---|---|---|
| State schema | `Annotation.Root({ key: Annotation<T>() })` | Zod schema | Canonical; every LC 1.x langgraph doc uses it |
| Messages-aware state (02, 03) | `MessagesAnnotation` prebuilt | custom Annotation with `addMessages` reducer | Prebuilt is 1 line; learners still see the pattern |
| 02 tool dispatch | Hand-rolled in a `tools` node (iterate `tool_calls` → invoke fn → emit `ToolMessage[]`) | `ToolNode` from prebuilt | Pedagogical — Fase 5 used prebuilt; Fase 6 shows the machinery |
| Conditional routing (02, 03) | `graph.addConditionalEdges(source, fn, { toolsNodeName: "tools", END })` | bare `addEdge` returning `Command` | Conditional edges are the stable, doc-canonical pattern |
| Checkpointer | `MemorySaver` (in-process) | Custom `BaseCheckpointSaver` | Out of scope — MemorySaver is the v0.1 target |
| HITL (03) | `interrupt({...})` inside a node + `Command({ resume })` for second invoke | `NodeInterrupt` subclass / bespoke queue | `interrupt` + `Command` is THE LangGraph 1.x HITL pattern |
| Event streaming (04) | `graph.streamEvents(input, { version: "v2" })` | `graph.stream(..., { streamMode })` | Distinct from Fase 5 (streamMode); shows typed events |
| Cost in 05 | Deterministic node bodies (no LLM) | chat-backed nodes | Isolate the checkpoint/resume concept — no nondeterminism |
| Recursion limit | Set `{ recursionLimit: 15 }` in 02 + 03 invokes | Default (25) | Keeps test cost predictable on loopy graphs; still plenty for healthy agent runs |

## Data Flow

### 02-react-as-graph

```
  START
    │
    ▼
  ┌───────┐     tool_calls?     ┌───────┐
  │ agent │ ───── yes ────────▶ │ tools │
  └───────┘                     └───┬───┘
    │  ▲                            │
    │  └─── messages update ────────┘
    │
    no
    │
    ▼
   END
```

Nodes:
- `agent`: `(state) => { const msg = await model.bindTools(tools).invoke(state.messages); return { messages: [msg] }; }`
- `tools`: `(state) => { const last = state.messages.at(-1); if (!last.tool_calls) return {}; const results = await Promise.all(last.tool_calls.map(tc => invokeTool(tc))); return { messages: results }; }`
- Conditional edge: `(state) => state.messages.at(-1).tool_calls?.length ? "tools" : END`

### 03-subagents-hitl

```
  main_graph:
    START → plan (subgraph_compiled as node) → decide → END
                                                 │
                                                 └── calls interrupt({question}) during exec
                                                     first invoke halts here
                                                     second invoke via Command({resume})
                                                     continues to END
```

Subgraph is compiled independently and referenced as `.addNode("plan", subgraph)`. It contributes state to the outer schema via declared shared keys.

### 05-checkpoint-resume

```
  START → step1_prepare → step2_pause (interrupt) → step3_finalize → END
                             │
                      first invoke halts here
                      getState → { next: ["step2_pause"], tasks: [{ interrupts: […] }] }
                      invoke(Command({ resume: "go" }), { thread_id })
                      continues through finalize to END
```

No LLM in any node body. Each node mutates state by returning a partial annotation update (e.g., `{ preparedAt: Date.now() }`).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `code/packages/exercises/04-langgraph/{01..05}/` | Create | 30 files total |
| `code/packages/runner/` | Untouched | — |
| `code/packages/exercises/package.json` | Untouched | All deps present |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Short §Graphs & interrupts section |
| `openspec/specs/track-langgraph/spec.md` | New (at archive) | Main spec |

## Interfaces / Contracts

Exercise solution sketch (02-react-as-graph):

```ts
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolMessage, type AIMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

const weatherTool = tool(
  async ({ city }) => `Sunny in ${city}, 22°C.`,
  { name: "get_weather", description: "…", schema: z.object({ city: z.string() }) },
);

export default async function run() {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] ?? "";
  const model = createChatModel(provider, apiKey);
  const tools = [weatherTool];
  const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

  const agentNode = async (state: typeof MessagesAnnotation.State) => {
    const msg = await model.bindTools!(tools).invoke(state.messages);
    return { messages: [msg] };
  };

  const toolsNode = async (state: typeof MessagesAnnotation.State) => {
    const last = state.messages.at(-1) as AIMessage;
    const calls = last.tool_calls ?? [];
    const results = await Promise.all(
      calls.map(async (tc) => {
        const t = toolsByName[tc.name]!;
        const output = await t.invoke(tc.args);
        return new ToolMessage({ content: String(output), tool_call_id: tc.id! });
      }),
    );
    return { messages: results };
  };

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", (state) =>
      (state.messages.at(-1) as AIMessage).tool_calls?.length ? "tools" : END
    )
    .addEdge("tools", "agent")
    .compile();

  const result = await graph.invoke(
    { messages: [new HumanMessage("What's the weather in Lima?")] },
    { recursionLimit: 15 },
  );
  const last = result.messages.at(-1);
  const answer = typeof last?.content === "string" ? last.content : "";
  return { answer, messages: result.messages };
}
```

For 05-checkpoint-resume (no LLM):

```ts
const graph = new StateGraph(StateAnnotation)
  .addNode("step1_prepare", (s) => ({ prepared: true }))
  .addNode("step2_pause", (s) => { const approval = interrupt({ question: "proceed?" }); return { approval }; })
  .addNode("step3_finalize", (s) => ({ finalized: true, approval: s.approval }))
  .addEdge(START, "step1_prepare")
  .addEdge("step1_prepare", "step2_pause")
  .addEdge("step2_pause", "step3_finalize")
  .addEdge("step3_finalize", END)
  .compile({ checkpointer: new MemorySaver() });

const thread = { configurable: { thread_id: "demo" } };
await graph.invoke({}, thread);                              // halts at step2_pause
const pre = await graph.getState(thread);
await graph.invoke(new Command({ resume: "go" }), thread);   // resumes
const post = await graph.getState(thread);
return {
  preResumeNext: Array.from(pre.next ?? []),
  postResumeNext: Array.from(post.next ?? []),
  resumedWith: "go",
  final: post.values,
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Each exercise `tests.test.ts` via `runUserCode` | Real provider gated with fail-fast `beforeAll` (01 and 05 have NO live-API gating — they don't hit the model) |
| Shape | calls.length lower-bound, userReturn keys, event-type counts, resume flags | No content asserts |
| Verify-phase | Voseo grep over `packages/exercises/` | rg same pattern |
| Smoke | `lcdev list` shows 20 entries; `lcdev verify 02-react-as-graph --solution` live-green | Manual post-apply |

## Migration / Rollout

Additive track. No migration. Revert per-exercise with `git rm -r`.

## Open Questions

- [ ] **Subgraph state-key sharing in 03**: subgraph + outer graph MUST declare overlapping annotation keys for state to flow. Resolve at apply — most likely `plan` subgraph declares `{ plan_output: Annotation<string> }` which the outer graph also declares, and `decide` node reads it.
- [ ] **`addConditionalEdges` signature** in LC 1.x langgraph: takes either a mapping `{ toolsName: "tools", endName: END }` OR just the source node + router function that returns a node name string. Verify at apply — pragmatic form is `addConditionalEdges("agent", routerFn, ["tools", END])`.

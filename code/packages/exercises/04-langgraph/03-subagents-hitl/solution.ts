// Docs:
//   Subgraphs          — https://docs.langchain.com/oss/javascript/langgraph/subgraphs
//   interrupt / Command — https://docs.langchain.com/oss/javascript/langgraph/interrupt
//   MemorySaver        — https://docs.langchain.com/oss/javascript/langgraph/persistence

import {
  StateGraph,
  Annotation,
  START,
  END,
  MemorySaver,
  Command,
  interrupt,
} from "@langchain/langgraph";

// Subgraph state: just produces a `plan` string.
const SubState = Annotation.Root({
  plan: Annotation<string>,
});

// Outer state: includes `plan` (shared with subgraph via matching key) +
// `approval` (captured from the human) + `result` (final synthesis).
const OuterState = Annotation.Root({
  plan: Annotation<string>,
  approval: Annotation<string>,
  result: Annotation<string>,
});

const subgraph = new StateGraph(SubState)
  .addNode("buildPlan", () => ({
    plan: "Step 1: lookup records. Step 2: execute the change.",
  }))
  .addEdge(START, "buildPlan")
  .addEdge("buildPlan", END)
  .compile();

export default async function run(): Promise<{
  interrupted: boolean;
  resumed: boolean;
  final: unknown;
}> {
  const decideNode = (state: typeof OuterState.State) => {
    // IMPORTANT: do NOT wrap this in try/catch. `interrupt` propagates by
    // design so the checkpointer can pause the graph — catching swallows it.
    const approval = interrupt({ question: `Approve plan?\n${state.plan}` });
    return {
      approval: approval as string,
      result: `Executed with approval='${String(approval)}' on plan='${state.plan}'.`,
    };
  };

  const graph = new StateGraph(OuterState)
    .addNode("planStage", subgraph)
    .addNode("decide", decideNode)
    .addEdge(START, "planStage")
    .addEdge("planStage", "decide")
    .addEdge("decide", END)
    .compile({ checkpointer: new MemorySaver() });

  const thread = { configurable: { thread_id: "hitl-1" } };

  // First invoke: runs planStage, hits interrupt in decide, halts.
  const first = (await graph.invoke({}, thread)) as unknown as {
    __interrupt__?: unknown[];
  };
  const firstHasInterrupt =
    Array.isArray(first.__interrupt__) && first.__interrupt__.length > 0;
  const state1 = await graph.getState(thread);
  const interrupted = firstHasInterrupt || Array.from(state1.next ?? []).length > 0;

  // Second invoke: resume with the human's approval.
  await graph.invoke(new Command({ resume: "approved" }), thread);
  const state2 = await graph.getState(thread);
  const resumed = Array.from(state2.next ?? []).length === 0;

  return {
    interrupted,
    resumed,
    final: state2.values,
  };
}

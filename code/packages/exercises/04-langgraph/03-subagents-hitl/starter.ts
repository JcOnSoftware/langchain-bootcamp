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

const SubState = Annotation.Root({
  plan: Annotation<string>,
});

const OuterState = Annotation.Root({
  plan: Annotation<string>,
  approval: Annotation<string>,
  result: Annotation<string>,
});

// TODO: build the subgraph — one node `buildPlan` that returns
//       { plan: "Step 1: ... Step 2: ..." }. Compile it.
const subgraph = new StateGraph(SubState)
  // TODO
  .compile();

export default async function run(): Promise<{
  interrupted: boolean;
  resumed: boolean;
  final: unknown;
}> {
  // TODO: implement `decideNode` — calls interrupt({ question }) to pause,
  //       then returns { approval, result } once resumed.
  // WARNING: do NOT wrap interrupt() in try/catch — it MUST propagate so the
  //          checkpointer can pause the graph.
  const decideNode = (_state: typeof OuterState.State) => {
    // TODO
    return { approval: "", result: "" };
  };

  // TODO: build the outer graph with the subgraph as a node:
  //   new StateGraph(OuterState)
  //     .addNode("planStage", subgraph)    // subgraph-as-node
  //     .addNode("decide", decideNode)
  //     .addEdge(START, "planStage")
  //     .addEdge("planStage", "decide")
  //     .addEdge("decide", END)
  //     .compile({ checkpointer: new MemorySaver() });
  const graph = new StateGraph(OuterState).compile({ checkpointer: new MemorySaver() });

  const thread = { configurable: { thread_id: "hitl-1" } };

  // TODO: first invoke — should hit the interrupt. Detect it via state.next
  //       being non-empty after invoke.
  await graph.invoke({}, thread);
  const state1 = await graph.getState(thread);
  const interrupted = Array.from(state1.next ?? []).length > 0;

  // TODO: second invoke — resume with Command({ resume: "approved" }).
  // await graph.invoke(new Command({ resume: "approved" }), thread);
  const state2 = await graph.getState(thread);
  const resumed = Array.from(state2.next ?? []).length === 0;

  return { interrupted, resumed, final: state2.values };
}

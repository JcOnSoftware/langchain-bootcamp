// Docs:
//   StateGraph       — https://docs.langchain.com/oss/javascript/langgraph/state-graph
//   Annotation.Root  — https://docs.langchain.com/oss/javascript/langgraph/annotations
//   START / END      — https://docs.langchain.com/oss/javascript/langgraph/edges

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

// TODO: define a state schema via Annotation.Root with two keys:
//   - counter: number with a SUM reducer (existing + update), default 0
//   - log:     string[] with a CONCAT reducer (existing, ...update), default []
const State = Annotation.Root({
  // TODO
});

export default async function run(): Promise<{
  final: { counter: number; log: string[] };
  nodesVisited: string[];
}> {
  const nodesVisited: string[] = [];

  // TODO: write two node functions that return partial state updates:
  //   - n1: adds 10 to counter and appends "n1 ran" to log
  //   - n2: adds 5 to counter and appends "n2 ran" to log
  //   Each node also pushes its name into `nodesVisited`.

  // TODO: build the graph:
  //   new StateGraph(State)
  //     .addNode("n1", n1)
  //     .addNode("n2", n2)
  //     .addEdge(START, "n1")
  //     .addEdge("n1", "n2")
  //     .addEdge("n2", END)
  //     .compile();
  const graph = new StateGraph(State).compile();

  // TODO: invoke with { counter: 0, log: [] } and return the final state
  const final = (await graph.invoke({} as never)) as { counter: number; log: string[] };

  return { final, nodesVisited };
}

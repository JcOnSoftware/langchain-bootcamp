// Docs:
//   StateGraph       — https://docs.langchain.com/oss/javascript/langgraph/state-graph
//   Annotation.Root  — https://docs.langchain.com/oss/javascript/langgraph/annotations
//   START / END      — https://docs.langchain.com/oss/javascript/langgraph/edges

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

const State = Annotation.Root({
  counter: Annotation<number>({
    reducer: (current: number, update: number) => current + update,
    default: () => 0,
  }),
  log: Annotation<string[]>({
    reducer: (current: string[], update: string[]) => [...current, ...update],
    default: () => [],
  }),
});

export default async function run(): Promise<{
  final: { counter: number; log: string[] };
  nodesVisited: string[];
}> {
  const nodesVisited: string[] = [];

  const n1 = () => {
    nodesVisited.push("n1");
    return { counter: 10, log: ["n1 ran"] };
  };

  const n2 = () => {
    nodesVisited.push("n2");
    return { counter: 5, log: ["n2 ran"] };
  };

  const graph = new StateGraph(State)
    .addNode("n1", n1)
    .addNode("n2", n2)
    .addEdge(START, "n1")
    .addEdge("n1", "n2")
    .addEdge("n2", END)
    .compile();

  const final = await graph.invoke({ counter: 0, log: [] });

  return { final, nodesVisited };
}

// Docs:
//   MemorySaver        — https://docs.langchain.com/oss/javascript/langgraph/persistence
//   interrupt / Command — https://docs.langchain.com/oss/javascript/langgraph/interrupt
//   getState           — https://docs.langchain.com/oss/javascript/langgraph/persistence#getting-state

import {
  StateGraph,
  Annotation,
  START,
  END,
  MemorySaver,
  Command,
  interrupt,
} from "@langchain/langgraph";

const State = Annotation.Root({
  prepared: Annotation<boolean>,
  approval: Annotation<string>,
  finalized: Annotation<boolean>,
});

export default async function run(): Promise<{
  preResumeNext: string[];
  postResumeNext: string[];
  resumedWith: string;
  final: { prepared?: boolean; approval?: string; finalized?: boolean };
}> {
  const step1_prepare = () => ({ prepared: true });

  // IMPORTANT: do NOT wrap the graph invoke in try/catch — `interrupt` MUST
  // propagate so the checkpointer can pause execution.
  const step2_pause = () => {
    const approval = interrupt({ question: "proceed?" });
    return { approval: String(approval) };
  };

  const step3_finalize = () => ({ finalized: true });

  const graph = new StateGraph(State)
    .addNode("step1_prepare", step1_prepare)
    .addNode("step2_pause", step2_pause)
    .addNode("step3_finalize", step3_finalize)
    .addEdge(START, "step1_prepare")
    .addEdge("step1_prepare", "step2_pause")
    .addEdge("step2_pause", "step3_finalize")
    .addEdge("step3_finalize", END)
    .compile({ checkpointer: new MemorySaver() });

  const thread = { configurable: { thread_id: "ckpt-1" } };

  // First invoke runs step1, hits interrupt in step2, halts.
  await graph.invoke({}, thread);
  const pre = await graph.getState(thread);
  const preResumeNext = Array.from(pre.next ?? []);

  // Resume with the human's answer.
  await graph.invoke(new Command({ resume: "go" }), thread);
  const post = await graph.getState(thread);
  const postResumeNext = Array.from(post.next ?? []);

  return {
    preResumeNext,
    postResumeNext,
    resumedWith: "go",
    final: post.values as {
      prepared?: boolean;
      approval?: string;
      finalized?: boolean;
    },
  };
}

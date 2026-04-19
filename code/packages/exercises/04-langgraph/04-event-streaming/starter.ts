// Docs:
//   StateGraph        — https://docs.langchain.com/oss/javascript/langgraph/state-graph
//   streamEvents (v2) — https://docs.langchain.com/oss/javascript/langchain/runnables/streaming#streamevents

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

const State = Annotation.Root({
  topic: Annotation<string>,
  reply: Annotation<string>,
});

export default async function run(): Promise<{
  eventTypes: Record<string, number>;
  totalEvents: number;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";
  const model = createChatModel(provider, apiKey);

  // TODO: implement `ask` — call the model with a HumanMessage built from
  //       state.topic. Return { reply: stringContent }.
  const ask = async (_state: typeof State.State) => {
    // TODO
    return { reply: "" };
  };

  const graph = new StateGraph(State)
    .addNode("ask", ask)
    .addEdge(START, "ask")
    .addEdge("ask", END)
    .compile();

  // TODO: invoke graph.streamEvents(..., { version: "v2" }) and iterate with
  //       for await. Count events by evt.event and accumulate totals.
  const eventTypes: Record<string, number> = {};
  const totalEvents = 0;

  // TODO

  return { eventTypes, totalEvents };
}

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

  const ask = async (state: typeof State.State) => {
    const msg = await model.invoke([
      new HumanMessage(`Say one short greeting about ${state.topic}.`),
    ]);
    return {
      reply:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    };
  };

  const graph = new StateGraph(State)
    .addNode("ask", ask)
    .addEdge(START, "ask")
    .addEdge("ask", END)
    .compile();

  const eventTypes: Record<string, number> = {};
  let totalEvents = 0;

  const stream = graph.streamEvents({ topic: "LangGraph" }, { version: "v2" });
  for await (const evt of stream) {
    const kind = evt.event as string;
    eventTypes[kind] = (eventTypes[kind] ?? 0) + 1;
    totalEvents += 1;
  }

  return { eventTypes, totalEvents };
}

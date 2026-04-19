// Docs:
//   StateGraph             — https://docs.langchain.com/oss/javascript/langgraph/state-graph
//   MessagesAnnotation     — https://docs.langchain.com/oss/javascript/langgraph/annotations
//   addConditionalEdges    — https://docs.langchain.com/oss/javascript/langgraph/edges
//   bindTools / tool_calls — https://docs.langchain.com/oss/javascript/langchain/tool-calling

import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  HumanMessage,
  ToolMessage,
  type AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

const weatherTool = tool(
  async ({ city }: { city: string }) => `Sunny in ${city}, 22°C.`,
  {
    name: "get_weather",
    description: "Get current weather for a city",
    schema: z.object({ city: z.string() }),
  },
);

const timeTool = tool(
  async ({ tz }: { tz: string }) => `It is 12:34 in ${tz}.`,
  {
    name: "get_time",
    description: "Get current time for a timezone",
    schema: z.object({ tz: z.string() }),
  },
);

const tools = [weatherTool, timeTool];
const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));

export default async function run(): Promise<{
  answer: string;
  messages: BaseMessage[];
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";
  const model = createChatModel(provider, apiKey);
  const boundModel = model.bindTools!(tools);

  // TODO: implement `agentNode` — calls the model with state.messages, returns
  //       { messages: [reply] }.
  const agentNode = async (_state: typeof MessagesAnnotation.State) => {
    // TODO
    return { messages: [] };
  };

  // TODO: implement `toolsNode` — read state.messages.at(-1).tool_calls,
  //       invoke each tool via toolsByName[tc.name].invoke(tc.args), wrap
  //       the result in ToolMessage({ content, tool_call_id: tc.id }).
  //       Return { messages: [...toolMessages] }.
  const toolsNode = async (_state: typeof MessagesAnnotation.State) => {
    // TODO
    return { messages: [] };
  };

  // TODO: router fn — if last AIMessage has tool_calls, go to "tools", else END.
  const routeFromAgent = (_state: typeof MessagesAnnotation.State) => {
    // TODO
    return END;
  };

  // TODO: build the graph:
  //   new StateGraph(MessagesAnnotation)
  //     .addNode("agent", agentNode)
  //     .addNode("tools", toolsNode)
  //     .addEdge(START, "agent")
  //     .addConditionalEdges("agent", routeFromAgent, ["tools", END])
  //     .addEdge("tools", "agent")
  //     .compile();
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addEdge(START, "agent")
    .compile();

  const result = await graph.invoke(
    { messages: [new HumanMessage("What's the weather in Lima right now?")] },
    { recursionLimit: 15 },
  );

  // TODO: extract the final answer (string) from the last message
  const last = result.messages.at(-1);
  const answer = typeof last?.content === "string" ? last.content : "";

  return { answer, messages: result.messages as BaseMessage[] };
}

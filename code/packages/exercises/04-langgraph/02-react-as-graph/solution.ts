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

  // `bindTools` is typed as optional on the abstract BaseChatModel; every
  // concrete provider class implements it, so the `!` assertion is safe.
  const boundModel = model.bindTools!(tools);

  const agentNode = async (state: typeof MessagesAnnotation.State) => {
    const reply = await boundModel.invoke(state.messages);
    return { messages: [reply] };
  };

  const toolsNode = async (state: typeof MessagesAnnotation.State) => {
    const last = state.messages.at(-1) as AIMessage;
    const calls = last.tool_calls ?? [];
    const results = await Promise.all(
      calls.map(async (tc) => {
        const toolImpl = toolsByName[tc.name] as
          | { invoke: (args: unknown) => Promise<unknown> }
          | undefined;
        if (!toolImpl) {
          return new ToolMessage({
            content: `Unknown tool: ${tc.name}`,
            tool_call_id: tc.id ?? "unknown",
          });
        }
        const output = await toolImpl.invoke(tc.args);
        return new ToolMessage({
          content: typeof output === "string" ? output : JSON.stringify(output),
          tool_call_id: tc.id ?? "unknown",
        });
      }),
    );
    return { messages: results };
  };

  const routeFromAgent = (state: typeof MessagesAnnotation.State) => {
    const last = state.messages.at(-1) as AIMessage;
    return last.tool_calls && last.tool_calls.length > 0 ? "tools" : END;
  };

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolsNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", routeFromAgent, ["tools", END])
    .addEdge("tools", "agent")
    .compile();

  const result = await graph.invoke(
    { messages: [new HumanMessage("What's the weather in Lima right now?")] },
    { recursionLimit: 15 },
  );

  const last = result.messages.at(-1);
  const content = last?.content as unknown;
  const answer =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? (content as Array<{ type?: string; text?: string }>)
            .filter((b) => b.type === "text")
            .map((b) => b.text ?? "")
            .join("\n")
        : "";

  return { answer, messages: result.messages as BaseMessage[] };
}

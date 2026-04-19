// Docs:
//   ReAct agent (prebuilt) — https://docs.langchain.com/oss/javascript/langgraph/prebuilt
//   createReactAgent reference — https://langchain-ai.github.io/langgraphjs/reference/functions/prebuilt.createReactAgent.html
//   Tool definition — https://docs.langchain.com/oss/javascript/langchain/tools

import { tool } from "@langchain/core/tools";
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// TODO 1: Define two tools — `get_weather` and `get_time`.
//         Both return a short string. The agent decides when to call each.
const weatherTool = tool(
  async ({ city }: { city: string }) => {
    void city;
    return "";
  },
  {
    name: "get_weather",
    description: "Get current weather for a city",
    schema: z.object({ city: z.string() }),
  },
);

const timeTool = tool(
  async ({ tz }: { tz: string }) => {
    void tz;
    return "";
  },
  {
    name: "get_time",
    description: "Get the current local time for a timezone (IANA name or city).",
    schema: z.object({ tz: z.string() }),
  },
);

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

  // TODO 2: Build a ReAct agent with `createReactAgent({ llm, tools })`.
  //         Pass BOTH tools so the model can choose which (or both) to call.
  void model;
  void weatherTool;
  void timeTool;
  const agent = {
    invoke: async (_: {
      messages: BaseMessage[];
    }): Promise<{ messages: BaseMessage[] }> => ({ messages: [] }),
  };

  // TODO 3: Invoke the agent with a single user message that requires BOTH tools:
  //         "What's the weather in Lima and what time is it there?"
  const result = await agent.invoke({
    messages: [new HumanMessage("")],
  });

  // TODO 4: The final assistant message is the last item of `result.messages`.
  //         Extract its `.content` as a string and return `{ answer, messages }`.
  const finalMessage = result.messages[result.messages.length - 1];
  const content = finalMessage?.content;
  const answer = typeof content === "string" ? content : JSON.stringify(content);

  return { answer, messages: result.messages };
}

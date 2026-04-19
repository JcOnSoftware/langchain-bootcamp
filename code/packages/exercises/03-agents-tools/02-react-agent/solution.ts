// Docs:
//   ReAct agent (prebuilt) — https://docs.langchain.com/oss/javascript/langgraph/prebuilt
//   createReactAgent reference — https://langchain-ai.github.io/langgraphjs/reference/functions/prebuilt.createReactAgent.html
//   Tool definition — https://docs.langchain.com/oss/javascript/langchain/tools

import { tool } from "@langchain/core/tools";
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
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
  async ({ tz }: { tz: string }) => `12:34 in ${tz}`,
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

  const agent = createReactAgent({
    llm: model,
    tools: [weatherTool, timeTool],
  });

  const result = (await agent.invoke({
    messages: [
      new HumanMessage("What's the weather in Lima and what time is it there?"),
    ],
  })) as { messages: BaseMessage[] };

  const finalMessage = result.messages[result.messages.length - 1];
  const content = finalMessage?.content;
  const answer = typeof content === "string" ? content : JSON.stringify(content);

  return { answer, messages: result.messages };
}

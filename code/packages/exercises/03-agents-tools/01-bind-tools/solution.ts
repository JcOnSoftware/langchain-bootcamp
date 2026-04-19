// Docs:
//   Tool definition — https://docs.langchain.com/oss/javascript/langchain/tools
//   bindTools on chat models — https://docs.langchain.com/oss/javascript/langchain/models#binding-tools
//   Zod schema basics — https://zod.dev/

import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage, type AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

const weatherTool = tool(
  async ({ city }: { city: string }) => {
    return `Sunny in ${city}, 22°C.`;
  },
  {
    name: "get_weather",
    description: "Get current weather for a city",
    schema: z.object({ city: z.string() }),
  },
);

export default async function run(): Promise<{
  toolCalls: NonNullable<AIMessage["tool_calls"]>;
  finalMessage: AIMessage;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);
  const bound = model.bindTools!([weatherTool]);

  const ai = (await bound.invoke([
    new SystemMessage(
      "You MUST call the get_weather tool for any weather question. Do not answer from your own knowledge.",
    ),
    new HumanMessage("What's the weather in Lima?"),
  ])) as AIMessage;

  return {
    toolCalls: ai.tool_calls ?? [],
    finalMessage: ai,
  };
}

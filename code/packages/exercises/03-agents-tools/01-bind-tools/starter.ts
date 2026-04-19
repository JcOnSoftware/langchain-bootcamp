// Docs:
//   Tool definition — https://docs.langchain.com/oss/javascript/langchain/tools
//   bindTools on chat models — https://docs.langchain.com/oss/javascript/langchain/models#binding-tools
//   Zod schema basics — https://zod.dev/

import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage, type AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// TODO 1: Define a tool called `get_weather` that takes `{ city: string }`
//         and returns a short weather string. Use `tool(fn, { name, description, schema })`.
const weatherTool = tool(
  async ({ city }: { city: string }) => {
    // TODO: return something like `Sunny in ${city}, 22°C.`
    void city;
    return "";
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

  // TODO 2: Bind the tool to the model with `model.bindTools([weatherTool])`.
  //         Bound models keep the chat-model interface but advertise tools to the provider.
  const bound = model;
  void weatherTool;

  // TODO 3: Invoke the bound model with a system message that FORCES tool use
  //         ("You MUST call the get_weather tool...") and a human message that
  //         asks about the weather. Cast the result to `AIMessage`.
  const ai = (await bound.invoke([
    new SystemMessage(""),
    new HumanMessage(""),
  ])) as AIMessage;

  // TODO 4: Return `{ toolCalls: ai.tool_calls ?? [], finalMessage: ai }`.
  return {
    toolCalls: ai.tool_calls ?? [],
    finalMessage: ai,
  };
}

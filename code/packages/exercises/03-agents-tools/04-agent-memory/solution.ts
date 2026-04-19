// Docs:
//   LangGraph persistence — https://docs.langchain.com/oss/javascript/langgraph/persistence
//   Checkpointers — https://docs.langchain.com/oss/javascript/langgraph/checkpointing
//   createReactAgent (with checkpointer) — https://langchain-ai.github.io/langgraphjs/reference/functions/prebuilt.createReactAgent.html

import { tool } from "@langchain/core/tools";
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
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

export default async function run(): Promise<{
  turn1: string;
  turn2: string;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);
  const checkpointer = new MemorySaver();

  const agent = createReactAgent({
    llm: model,
    tools: [weatherTool],
    checkpointer,
  });

  const config = { configurable: { thread_id: "session-1" } };

  const first = (await agent.invoke(
    { messages: [new HumanMessage("What's the weather in Lima?")] },
    config,
  )) as { messages: BaseMessage[] };

  const second = (await agent.invoke(
    {
      messages: [
        new HumanMessage(
          "What about in Cusco? Compare to the previous answer.",
        ),
      ],
    },
    config,
  )) as { messages: BaseMessage[] };

  const firstFinal = first.messages[first.messages.length - 1];
  const secondFinal = second.messages[second.messages.length - 1];
  const turn1 =
    typeof firstFinal?.content === "string"
      ? firstFinal.content
      : JSON.stringify(firstFinal?.content);
  const turn2 =
    typeof secondFinal?.content === "string"
      ? secondFinal.content
      : JSON.stringify(secondFinal?.content);

  return { turn1, turn2 };
}

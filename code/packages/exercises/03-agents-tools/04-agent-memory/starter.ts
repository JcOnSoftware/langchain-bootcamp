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

  // TODO 1: Create an in-memory checkpointer so the agent can remember turns.
  //         `const checkpointer = new MemorySaver();`
  void MemorySaver;

  // TODO 2: Build the agent passing the checkpointer:
  //         `createReactAgent({ llm: model, tools: [weatherTool], checkpointer })`.
  void weatherTool;
  void model;
  const agent = {
    invoke: async (
      _: { messages: BaseMessage[] },
      _config?: unknown,
    ): Promise<{ messages: BaseMessage[] }> => ({ messages: [] }),
  };

  // TODO 3: Define a config with a STABLE thread_id. Both turns must share it,
  //         otherwise each call starts a fresh conversation:
  //         `const config = { configurable: { thread_id: "session-1" } };`
  const config = { configurable: { thread_id: "" } };

  // TODO 4: Invoke twice with the SAME config object.
  //         Turn 1: "What's the weather in Lima?"
  //         Turn 2: "What about in Cusco? Compare to the previous answer."
  const first = await agent.invoke(
    { messages: [new HumanMessage("")] },
    config,
  );

  const second = await agent.invoke(
    { messages: [new HumanMessage("")] },
    config,
  );

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

  // TODO 5: Return `{ turn1, turn2 }`.
  return { turn1, turn2 };
}

// Docs:
//   Agent streaming modes — https://docs.langchain.com/oss/javascript/langgraph/streaming
//   createReactAgent (stream) — https://langchain-ai.github.io/langgraphjs/reference/functions/prebuilt.createReactAgent.html
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

export default async function run(): Promise<{
  snapshotCount: number;
  finalMessages: BaseMessage[];
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO 1: Build a ReAct agent with the weather tool.
  void model;
  void weatherTool;
  const agent = {
    stream: async (
      _: { messages: BaseMessage[] },
      _opts: { streamMode: "values" },
    ): Promise<AsyncIterable<{ messages: BaseMessage[] }>> => ({
      async *[Symbol.asyncIterator]() {
        // no-op
      },
    }),
  };

  // TODO 2: Stream a single run with `streamMode: "values"`.
  //         The prompt is fixed: "What's the weather in Paris?".
  const stream = await agent.stream(
    { messages: [new HumanMessage("")] },
    { streamMode: "values" },
  );

  // TODO 3: Collect every snapshot in an array using `for await`.
  const snapshots: Array<{ messages: BaseMessage[] }> = [];
  for await (const snap of stream) {
    snapshots.push(snap);
  }

  // TODO 4: Return `{ snapshotCount, finalMessages }` where `finalMessages`
  //         is the `messages` of the last snapshot (`snapshots.at(-1)?.messages ?? []`).
  const last = snapshots[snapshots.length - 1];
  return {
    snapshotCount: snapshots.length,
    finalMessages: last?.messages ?? [],
  };
}

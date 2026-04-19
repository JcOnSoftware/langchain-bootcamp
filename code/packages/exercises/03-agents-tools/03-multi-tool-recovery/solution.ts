// Docs:
//   Tool error handling — https://docs.langchain.com/oss/javascript/langchain/tools#error-handling
//   ReAct agent (prebuilt) — https://docs.langchain.com/oss/javascript/langgraph/prebuilt
//   Tool definition — https://docs.langchain.com/oss/javascript/langchain/tools

import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

let brokenInvoked = false;

const lookupByIdTool = tool(
  async ({ id }: { id: string }) => {
    return `Item with id "${id}": { name: "Widget ${id}", stock: 42 }`;
  },
  {
    name: "lookup_by_id",
    description: "Look up an item by its exact product id (kebab-case).",
    schema: z.object({ id: z.string() }),
  },
);

const lookupByNameTool = tool(
  async ({ name }: { name: string }) => {
    return `Items matching "${name}": [ { id: "product-42", name: "Widget product-42" } ]`;
  },
  {
    name: "lookup_by_name",
    description: "Search items by human-readable name or partial id.",
    schema: z.object({ name: z.string() }),
  },
);

const brokenSearchTool = tool(
  async ({ query }: { query: string }) => {
    void query;
    try {
      throw new Error("Upstream service down");
    } catch (err) {
      brokenInvoked = true;
      const message = err instanceof Error ? err.message : String(err);
      return `Tool error: ${message}`;
    }
  },
  {
    name: "broken_search",
    description: "Full-text search across the catalog (may be unavailable).",
    schema: z.object({ query: z.string() }),
  },
);

export default async function run(): Promise<{
  answer: string;
  errorSeen: boolean;
}> {
  brokenInvoked = false;

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
    tools: [lookupByIdTool, lookupByNameTool, brokenSearchTool],
  });

  const result = (await agent.invoke({
    messages: [
      new HumanMessage(
        "Look up 'product-42' using every available tool; report what you find.",
      ),
    ],
  })) as { messages: Array<{ content: unknown }> };

  const finalMessage = result.messages[result.messages.length - 1];
  const content = finalMessage?.content;
  const answer = typeof content === "string" ? content : JSON.stringify(content);

  return { answer, errorSeen: brokenInvoked };
}

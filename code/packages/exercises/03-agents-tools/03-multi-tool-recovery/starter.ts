// Docs:
//   Tool error handling — https://docs.langchain.com/oss/javascript/langchain/tools#error-handling
//   ReAct agent (prebuilt) — https://docs.langchain.com/oss/javascript/langgraph/prebuilt
//   Tool definition — https://docs.langchain.com/oss/javascript/langchain/tools

import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Module-level flag set from inside the broken tool's catch block.
// The agent will recover from the error; we need a way to confirm the tool
// was actually invoked during the run.
let brokenInvoked = false;

// TODO 1: Define two WORKING tools.
//   - `lookup_by_id({ id })` → returns a string like `Item with id "${id}": {...}`.
//   - `lookup_by_name({ name })` → returns a string with one or more matches.
const lookupByIdTool = tool(
  async ({ id }: { id: string }) => {
    void id;
    return "";
  },
  {
    name: "lookup_by_id",
    description: "Look up an item by its exact product id (kebab-case).",
    schema: z.object({ id: z.string() }),
  },
);

const lookupByNameTool = tool(
  async ({ name }: { name: string }) => {
    void name;
    return "";
  },
  {
    name: "lookup_by_name",
    description: "Search items by human-readable name or partial id.",
    schema: z.object({ name: z.string() }),
  },
);

// TODO 2: Define the BROKEN tool. It MUST throw `new Error("Upstream service down")`
//         inside its body, catch it, flip `brokenInvoked = true`, and return a
//         string like `"Tool error: Upstream service down"` so the agent can read
//         the failure and move on to a different tool.
const brokenSearchTool = tool(
  async ({ query }: { query: string }) => {
    void query;
    // TODO: throw, catch, set brokenInvoked = true, return a "Tool error: ..." string.
    return "";
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
  // Reset the flag on each run — the harness imports the module with a
  // cache-buster, but test environments may share process state.
  brokenInvoked = false;

  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO 3: Build a ReAct agent with ALL THREE tools registered.
  void model;
  void lookupByIdTool;
  void lookupByNameTool;
  void brokenSearchTool;
  const agent = {
    invoke: async (_: {
      messages: HumanMessage[];
    }): Promise<{ messages: Array<{ content: unknown }> }> => ({ messages: [] }),
  };

  // TODO 4: Invoke the agent with a prompt that pushes it to use every tool:
  //         "Look up 'product-42' using every available tool; report what you find."
  const result = await agent.invoke({
    messages: [new HumanMessage("")],
  });

  const finalMessage = result.messages[result.messages.length - 1];
  const content = finalMessage?.content;
  const answer = typeof content === "string" ? content : JSON.stringify(content);

  // TODO 5: Return `{ answer, errorSeen: brokenInvoked }`.
  return { answer, errorSeen: brokenInvoked };
}

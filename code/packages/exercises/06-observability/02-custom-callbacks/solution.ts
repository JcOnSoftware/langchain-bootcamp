// Docs:
//   Custom callbacks     — https://js.langchain.com/docs/how_to/custom_callbacks/
//   BaseCallbackHandler  — https://js.langchain.com/docs/how_to/callbacks/
//   Callback methods     — https://api.js.langchain.com/classes/langchain_core_callbacks_base.BaseCallbackHandler.html

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Custom handler that overrides 2 lifecycle methods and records event types.
class MyCallbackHandler extends BaseCallbackHandler {
  name = "my-callback-handler";
  events: Array<{ type: string }> = [];

  override handleLLMStart(
    _llm: Serialized,
    _prompts: string[],
    _runId: string,
  ): void {
    this.events.push({ type: "handleLLMStart" });
  }

  override handleLLMEnd(_output: LLMResult, _runId: string): void {
    this.events.push({ type: "handleLLMEnd" });
  }
}

export default async function run(): Promise<{ events: Array<{ type: string }> }> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // Attach the custom handler as a callback — lifecycle events will populate handler.events.
  const handler = new MyCallbackHandler();
  await model.invoke(
    [new HumanMessage("Name one color. One word only.")],
    { callbacks: [handler] },
  );

  return { events: handler.events };
}

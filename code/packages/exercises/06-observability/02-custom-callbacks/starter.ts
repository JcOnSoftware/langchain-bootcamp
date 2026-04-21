// Docs:
//   Custom callbacks     — https://js.langchain.com/docs/how_to/custom_callbacks/
//   BaseCallbackHandler  — https://js.langchain.com/docs/how_to/callbacks/
//   Callback methods     — https://api.js.langchain.com/classes/langchain_core_callbacks_base.BaseCallbackHandler.html

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// TODO: Define a class extending BaseCallbackHandler.
//   It must have a `name` string property and override at least 2 lifecycle methods:
//   - handleLLMStart(llm, prompts, runId): push { type: "handleLLMStart" } to this.events
//   - handleLLMEnd(output, runId): push { type: "handleLLMEnd" } to this.events
//   Add a public `events: Array<{ type: string }>` field to accumulate the events.
class MyCallbackHandler extends BaseCallbackHandler {
  name = "my-callback-handler";
  events: Array<{ type: string }> = [];

  // TODO: Override handleLLMStart — push { type: "handleLLMStart" } to this.events.
  override handleLLMStart(_llm: Serialized, _prompts: string[], _runId: string): void {
    void _llm;
    void _prompts;
    void _runId;
  }

  // TODO: Override handleLLMEnd — push { type: "handleLLMEnd" } to this.events.
  override handleLLMEnd(_output: LLMResult, _runId: string): void {
    void _output;
    void _runId;
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

  // TODO: Instantiate MyCallbackHandler and invoke the model with it as a callback.
  //   const handler = new MyCallbackHandler();
  //   await model.invoke([new HumanMessage("...")], { callbacks: [handler] });
  const handler = new MyCallbackHandler();
  void handler;
  void HumanMessage;

  // TODO: Return { events: handler.events }
  return { events: [] };
}

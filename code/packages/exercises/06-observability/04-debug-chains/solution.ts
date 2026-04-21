// Docs:
//   streamEvents (v2)    — https://js.langchain.com/docs/how_to/streaming/#using-stream-events
//   Custom callbacks     — https://js.langchain.com/docs/how_to/custom_callbacks/
//   streamEvents event types — https://js.langchain.com/docs/concepts/streaming/#streamevents-event-reference

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Spy handler: captures lifecycle events at the LLM callback level.
// These events are complementary to streamEvents — together they give full visibility.
class SpyHandler extends BaseCallbackHandler {
  name = "spy-handler";
  handlerEvents: Array<{ type: string; runId?: string }> = [];

  override handleLLMStart(
    _llm: Serialized,
    _prompts: string[],
    runId: string,
  ): void {
    this.handlerEvents.push({ type: "handleLLMStart", runId });
  }

  override handleLLMEnd(_output: LLMResult, runId: string): void {
    this.handlerEvents.push({ type: "handleLLMEnd", runId });
  }
}

export default async function run(): Promise<{
  eventTypes: string[];
  handlerEvents: Array<{ type: string; runId?: string }>;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);
  const spy = new SpyHandler();

  // streamEvents({ version: "v2" }) emits structured events for every step in the chain.
  // Event types like on_chat_model_start / on_chat_model_end reveal the internal graph.
  const eventTypes = new Set<string>();
  const stream = model.streamEvents(
    [new HumanMessage("Name one ocean. One word only.")],
    { version: "v2", callbacks: [spy] },
  );

  for await (const evt of stream) {
    eventTypes.add(evt.event);
  }

  return {
    eventTypes: [...eventTypes],
    handlerEvents: spy.handlerEvents,
  };
}

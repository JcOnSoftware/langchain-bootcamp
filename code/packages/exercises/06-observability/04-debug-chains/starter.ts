// Docs:
//   streamEvents (v2)    — https://js.langchain.com/docs/how_to/streaming/#using-stream-events
//   Custom callbacks     — https://js.langchain.com/docs/how_to/custom_callbacks/
//   streamEvents event types — https://js.langchain.com/docs/concepts/streaming/#streamevents-event-reference

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Spy handler: records lifecycle events from the model (LLM-level callbacks).
class SpyHandler extends BaseCallbackHandler {
  name = "spy-handler";
  handlerEvents: Array<{ type: string; runId?: string }> = [];

  override handleLLMStart(_llm: Serialized, _prompts: string[], runId: string): void {
    // TODO: push { type: "handleLLMStart", runId } to this.handlerEvents
    void _llm;
    void _prompts;
    void runId;
  }

  override handleLLMEnd(_output: LLMResult, runId: string): void {
    // TODO: push { type: "handleLLMEnd", runId } to this.handlerEvents
    void _output;
    void runId;
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

  // TODO: Create a SpyHandler instance and build a simple chain (e.g. model itself).
  const spy = new SpyHandler();
  void spy;

  // TODO: Call chain.streamEvents(input, { version: "v2", callbacks: [spy] }).
  //   Iterate over the async generator and collect each event's .event string
  //   into a Set called eventTypes.
  //
  //   Example:
  //     const eventTypes = new Set<string>();
  //     const stream = model.streamEvents(
  //       [new HumanMessage("...")],
  //       { version: "v2", callbacks: [spy] },
  //     );
  //     for await (const evt of stream) {
  //       eventTypes.add(evt.event);
  //     }
  void HumanMessage;
  void model;

  // TODO: Return { eventTypes: [...eventTypes], handlerEvents: spy.handlerEvents }
  return { eventTypes: [], handlerEvents: [] };
}

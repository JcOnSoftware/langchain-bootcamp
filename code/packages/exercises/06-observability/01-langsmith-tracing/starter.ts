// Docs:
//   Callbacks overview   — https://js.langchain.com/docs/how_to/callbacks/
//   LangSmith tracing    — https://js.langchain.com/docs/integrations/providers/langsmith/
//   RunCollectorCallbackHandler — https://js.langchain.com/docs/how_to/callbacks/

import { RunCollectorCallbackHandler } from "@langchain/core/tracers/run_collector";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Suppress unused import warnings when TODOs are not yet filled in.
void LangChainTracer;

export default async function run(): Promise<{
  collectedRuns: Array<{ id: string; name: string; run_type: string }>;
  tracingEnabled: boolean;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO: Create a RunCollectorCallbackHandler instance to collect runs offline.
  //   const collector = new RunCollectorCallbackHandler();
  const collector = new RunCollectorCallbackHandler();

  // TODO: Build the callbacks array. Always include `collector`.
  //   If process.env["LANGCHAIN_API_KEY"] is set, also push new LangChainTracer().
  const callbacks = [collector];
  void callbacks;

  // TODO: Invoke the model with a simple message, passing the callbacks array.
  //   const response = await model.invoke([new HumanMessage("...")], { callbacks });
  void model;
  void HumanMessage;

  // TODO: Return an object with:
  //   - collectedRuns: collector.tracedRuns mapped to { id, name, run_type }
  //   - tracingEnabled: whether LANGCHAIN_API_KEY is set
  return {
    collectedRuns: [],
    tracingEnabled: false,
  };
}

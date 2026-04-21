// Docs:
//   Callbacks overview         — https://js.langchain.com/docs/how_to/callbacks/
//   withRetry                  — https://js.langchain.com/docs/how_to/runnable_backoff/
//   withFallbacks              — https://js.langchain.com/docs/how_to/fallbacks/
//   RunCollectorCallbackHandler — https://js.langchain.com/docs/how_to/callbacks/

import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { Serialized } from "@langchain/core/load/serializable";
import type { LLMResult } from "@langchain/core/outputs";
import { RunCollectorCallbackHandler } from "@langchain/core/tracers/run_collector";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// -- Cost callback: logs token usage for each call. --
class CostCallbackHandler extends BaseCallbackHandler {
  name = "cost-callback";
  costLog: Array<{ inputTokens: number; outputTokens: number }> = [];

  override handleLLMEnd(_output: LLMResult, _runId: string): void {
    // TODO: extract token usage from _output.llmOutput and push to this.costLog.
    //   Hint: _output.llmOutput?.tokenUsage?.promptTokens  (OpenAI)
    //         _output.llmOutput?.usage?.input_tokens       (Anthropic)
    //   You can push { inputTokens: 0, outputTokens: 0 } as a placeholder.
    void _output;
    void _runId;
  }
}

// -- Error-boundary callback: catches LLM errors and logs them. --
class ErrorBoundaryHandler extends BaseCallbackHandler {
  name = "error-boundary";
  errors: Error[] = [];

  override handleLLMError(err: Error, _runId: string): void {
    // TODO: push err to this.errors
    void err;
    void _runId;
  }
}

export default async function run(): Promise<{
  wrapperTypes: string[];
  callSucceeded: boolean;
  tracedRuns: unknown[];
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  // TODO: Create a primary model with withRetry({ stopAfterAttempt: 2 }).
  //   const primaryModel = createChatModel(provider, apiKey);
  //   const modelWithRetry = primaryModel.withRetry({ stopAfterAttempt: 2 });

  // TODO: Create a backup model and chain it with withFallbacks.
  //   const backupModel = createChatModel(provider, apiKey);
  //   const modelWithFallback = modelWithRetry.withFallbacks([backupModel as any]);

  // TODO: Instantiate all 3 callbacks: costCallback, errorBoundary, collector.
  //   const costCallback = new CostCallbackHandler();
  //   const errorBoundary = new ErrorBoundaryHandler();
  //   const collector = new RunCollectorCallbackHandler();

  // TODO: Invoke the chain with all callbacks.
  //   await modelWithFallback.invoke([new HumanMessage("...")], {
  //     callbacks: [costCallback, errorBoundary, collector],
  //   });

  // TODO: Declare wrapperTypes listing all 5 hardening techniques applied.
  //   const wrapperTypes = ["withRetry", "withFallbacks", "costCallback", "errorBoundary", "runCollector"];
  void HumanMessage;
  void CostCallbackHandler;
  void ErrorBoundaryHandler;
  void RunCollectorCallbackHandler;
  void createChatModel;
  void apiKey;
  void provider;

  return {
    wrapperTypes: [],
    callSucceeded: false,
    tracedRuns: [],
  };
}

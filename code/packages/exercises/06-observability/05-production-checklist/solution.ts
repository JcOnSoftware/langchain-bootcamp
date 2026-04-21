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

// Suppress unused import — Serialized is used in the override signature.
type _S = Serialized;

// Cost callback: accumulates token usage per LLM call.
class CostCallbackHandler extends BaseCallbackHandler {
  name = "cost-callback";
  costLog: Array<{ inputTokens: number; outputTokens: number }> = [];

  override handleLLMEnd(output: LLMResult, _runId: string): void {
    // LangChain normalizes usage differently per provider — extract what's available.
    const usage = output.llmOutput?.["usage"] as Record<string, unknown> | undefined;
    const tokenUsage = output.llmOutput?.["tokenUsage"] as Record<string, unknown> | undefined;
    const inputTokens =
      (typeof usage?.["input_tokens"] === "number" ? usage["input_tokens"] : undefined) ??
      (typeof tokenUsage?.["promptTokens"] === "number" ? tokenUsage["promptTokens"] : 0);
    const outputTokens =
      (typeof usage?.["output_tokens"] === "number" ? usage["output_tokens"] : undefined) ??
      (typeof tokenUsage?.["completionTokens"] === "number" ? tokenUsage["completionTokens"] : 0);
    this.costLog.push({ inputTokens, outputTokens });
  }
}

// Error-boundary callback: catches LLM errors so the application can decide how to handle them.
class ErrorBoundaryHandler extends BaseCallbackHandler {
  name = "error-boundary";
  errors: Error[] = [];

  override handleLLMError(err: Error, _runId: string): void {
    this.errors.push(err);
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

  // Primary model with automatic retry — up to 2 attempts before giving up.
  const primaryModel = createChatModel(provider, apiKey);
  const modelWithRetry = primaryModel.withRetry({ stopAfterAttempt: 2 });

  // Fallback chain — if the primary (with retry) exhausts its attempts, the backup runs.
  const backupModel = createChatModel(provider, apiKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelWithFallback = modelWithRetry.withFallbacks([backupModel as any]);

  // Production callbacks: cost logging, error boundary, and run collection.
  const costCallback = new CostCallbackHandler();
  const errorBoundary = new ErrorBoundaryHandler();
  const collector = new RunCollectorCallbackHandler();

  // Invoke the hardened chain with all callbacks active.
  await modelWithFallback.invoke(
    [new HumanMessage("Name one continent. One word only.")],
    { callbacks: [costCallback, errorBoundary, collector] },
  );

  // Declare the wrappers applied — this is the learner's checklist declaration.
  const wrapperTypes: string[] = [
    "withRetry",       // automatic retry on transient errors
    "withFallbacks",   // backup model when primary fails
    "costCallback",    // token usage logging
    "errorBoundary",   // error capture without crashing
    "runCollector",    // offline run collection for debugging
  ];

  return {
    wrapperTypes,
    callSucceeded: true,
    tracedRuns: collector.tracedRuns,
  };
}

// Docs:
//   withFallbacks    — https://js.langchain.com/docs/how_to/fallbacks/
//   RunnableLambda   — https://js.langchain.com/docs/how_to/lcel_cheatsheet/#runnable-lambda
//   withRetry        — https://js.langchain.com/docs/how_to/runnable_backoff/

import { RunnableLambda } from "@langchain/core/runnables";
import { HumanMessage, type AIMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

export default async function run(): Promise<{ result: string; usedFallback: boolean }> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  // TODO: create the real model that will act as the fallback.
  const fallbackModel = createChatModel(provider, apiKey);

  // TODO: create a primary RunnableLambda that deterministically throws an error.
  // Chain it with .withRetry({ stopAfterAttempt: 1 }) so it fails immediately.
  const brokenPrimary = RunnableLambda.from(async (_input: unknown) => {
    // TODO: throw an Error here
    throw new Error("TODO: replace with your error");
  }).withRetry({ stopAfterAttempt: 1 });

  // TODO: chain brokenPrimary with .withFallbacks([fallbackModel])
  // so the real model is invoked when the primary throws.
  // Note: cast needed due to LangChain TS generics — the runtime behavior is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = brokenPrimary.withFallbacks([fallbackModel as any]);

  // TODO: invoke the chain with a HumanMessage
  const response = (await chain.invoke([
    new HumanMessage("TODO: write your prompt"),
  ])) as AIMessage;

  // TODO: extract the text content from the response
  const content = response.content;
  const text =
    typeof content === "string"
      ? content
      : "";

  // TODO: return { result: text, usedFallback: true }
  return { result: text, usedFallback: true };
}

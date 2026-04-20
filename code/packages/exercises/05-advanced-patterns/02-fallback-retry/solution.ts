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

  // Real model used as fallback — harness captures its invoke().
  const fallbackModel = createChatModel(provider, apiKey);

  // Primary: a RunnableLambda that deterministically throws.
  // .withRetry({ stopAfterAttempt: 1 }) prevents default retries so the fallback
  // is reached immediately on the first (and only) attempt.
  const brokenPrimary = RunnableLambda.from(async (_input: unknown) => {
    throw new Error("primary intentionally down — testing fallback path");
  }).withRetry({ stopAfterAttempt: 1 });

  // .withFallbacks([fallbackModel]) chains: if brokenPrimary throws, fallbackModel runs.
  // Type cast needed: RunnableLambda<unknown,never>.withFallbacks requires Runnable<unknown,never>,
  // but BaseChatModel returns AIMessageChunk. Cast to `any` here since the runtime behavior is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = brokenPrimary.withFallbacks([fallbackModel as any]);

  const response = (await chain.invoke([
    new HumanMessage("Say exactly: fallback succeeded"),
  ])) as AIMessage;

  const content = response.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? (content as Array<{ type?: string; text?: string }>)
            .filter((b) => b.type === "text")
            .map((b) => b.text ?? "")
            .join("")
        : String(content);

  return { result: text, usedFallback: true };
}

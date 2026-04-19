// Docs:
//   LCEL fundamentals — https://docs.langchain.com/oss/javascript/langchain/lcel
//   RunnableBranch — https://docs.langchain.com/oss/javascript/langchain/runnables
//   ChatPromptTemplate — https://docs.langchain.com/oss/javascript/langchain/prompts

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableBranch } from "@langchain/core/runnables";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

interface BranchInput {
  text: string;
}

export default async function run(): Promise<{ short: string; long: string }> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);
  const parser = new StringOutputParser();

  // TODO: build two prompts — one for short-input summaries (one sentence),
  //       one for long-input summaries (three bullets).

  // TODO: pipe each prompt through the model and parser to get `shortChain` and `longChain`.

  // TODO: wire a RunnableBranch that:
  //   - routes to `shortChain` when input.text.length < 50
  //   - falls back to `longChain` as the default
  //
  // Hint:
  //   const chain = RunnableBranch.from<BranchInput, string>([
  //     [(input) => input.text.length < 50, shortChain],
  //     longChain,
  //   ]);

  // TODO: invoke the branch TWICE — once with a short text, once with a long text —
  //       and return { short, long }.

  void model; void parser; void RunnableBranch;
  return { short: "", long: "" };
}

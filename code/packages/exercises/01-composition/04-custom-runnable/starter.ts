// Docs:
//   LCEL fundamentals — https://docs.langchain.com/oss/javascript/langchain/lcel
//   RunnableLambda — https://docs.langchain.com/oss/javascript/langchain/runnables
//   ChatPromptTemplate — https://docs.langchain.com/oss/javascript/langchain/prompts

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

export default async function run(): Promise<string> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO: build a ChatPromptTemplate that uses a {text} variable.
  const prompt = ChatPromptTemplate.fromMessages([
    // TODO
  ]);

  // TODO: build a RunnableLambda adapter that takes a raw string
  //       and returns { text: raw } so the prompt can interpolate it.
  //       Hint:
  //         const adapter = RunnableLambda.from<string, { text: string }>((raw) => ({ text: raw }));

  // TODO: compose the chain as  adapter → prompt → model → StringOutputParser.

  // TODO: invoke the chain with the PLAIN string "Explain LCEL briefly."
  //       (not an object — the adapter shapes it for you) and return the string output.

  void model; void prompt; void RunnableLambda; void StringOutputParser;
  return "";
}

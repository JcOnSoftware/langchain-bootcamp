// Docs:
//   LCEL fundamentals — https://docs.langchain.com/oss/javascript/langchain/lcel
//   Runnable.batch — https://docs.langchain.com/oss/javascript/langchain/runnables
//   ChatPromptTemplate — https://docs.langchain.com/oss/javascript/langchain/prompts

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

export default async function run(): Promise<string[]> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO: build the same prompt you built in 01-hello-chain (system + human with {topic}).
  const prompt = ChatPromptTemplate.fromMessages([
    // TODO
  ]);

  // TODO: compose the chain = prompt | model | StringOutputParser.
  const chain = prompt; // ← replace this

  // TODO: call `chain.batch([{ topic: "LCEL" }, { topic: "agents" }, { topic: "RAG" }])`
  //       and return the resulting array of strings.
  //       Hint: `batch` is NOT the same as calling invoke 3 times in a loop — it parallelizes.
  void chain; void StringOutputParser;
  return [];
}

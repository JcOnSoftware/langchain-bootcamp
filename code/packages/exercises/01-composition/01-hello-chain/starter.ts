// Docs:
//   LCEL fundamentals — https://docs.langchain.com/oss/javascript/langchain/lcel
//   StringOutputParser — https://docs.langchain.com/oss/javascript/langchain/output_parsers
//   ChatPromptTemplate — https://docs.langchain.com/oss/javascript/langchain/prompts

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
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

  // TODO: build a ChatPromptTemplate with a system + human message.
  //       The human message must reference a {topic} variable.
  const prompt = ChatPromptTemplate.fromMessages([
    // TODO
  ]);

  // TODO: compose the chain = prompt | model | StringOutputParser
  //       Hint: use `.pipe(...)` twice, or `RunnableSequence.from([...])`.
  const chain = prompt; // ← replace this

  // TODO: invoke the chain with { topic: "LCEL" } and return the string.
  return "";
}

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

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a concise assistant. Answer in one short sentence."],
    ["human", "Explain what {topic} is."],
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  return await chain.invoke({ topic: "LCEL" });
}

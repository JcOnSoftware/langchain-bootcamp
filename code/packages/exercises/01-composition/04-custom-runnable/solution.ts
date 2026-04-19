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

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a concise tech writer. Answer in two short sentences."],
    ["human", "{text}"],
  ]);

  // Input adapter: take a raw string and shape it as { text } for the prompt.
  const adapter = RunnableLambda.from<string, { text: string }>((raw: string) => ({ text: raw }));

  const chain = adapter.pipe(prompt).pipe(model).pipe(new StringOutputParser());

  return await chain.invoke("Explain LCEL briefly.");
}

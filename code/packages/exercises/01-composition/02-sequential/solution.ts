// Docs:
//   LCEL fundamentals — https://docs.langchain.com/oss/javascript/langchain/lcel
//   RunnableSequence — https://docs.langchain.com/oss/javascript/langchain/runnables
//   ChatPromptTemplate — https://docs.langchain.com/oss/javascript/langchain/prompts

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
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
  const parser = new StringOutputParser();

  // Stage 1: extract a single keyword from a sentence.
  const keywordPrompt = ChatPromptTemplate.fromMessages([
    ["system", "Extract a single evocative keyword from the user's sentence. Answer with the keyword only, no punctuation."],
    ["human", "{sentence}"],
  ]);
  const keywordChain = keywordPrompt.pipe(model).pipe(parser);

  // Stage 2: write a haiku about that keyword.
  const haikuPrompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a haiku poet. Write exactly one haiku (3 lines, 5-7-5 syllables) about the given keyword. Return only the haiku."],
    ["human", "Keyword: {keyword}"],
  ]);
  const haikuChain = haikuPrompt.pipe(model).pipe(parser);

  // Wire both stages: the keyword string becomes the `keyword` input for stage 2.
  const chain = RunnableSequence.from<{ sentence: string }, string>([
    keywordChain,
    (keyword: string) => ({ keyword }),
    haikuChain,
  ]);

  return await chain.invoke({ sentence: "The fog rolled in over the city at dawn." });
}

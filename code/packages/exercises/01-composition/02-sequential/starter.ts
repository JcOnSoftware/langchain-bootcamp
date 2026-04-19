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

  // TODO (stage 1): build a keyword-extraction chain.
  //   Prompt should ask the model to return ONE keyword from the user's {sentence}.
  //   Pipe through the model and the parser.
  // Example shape:
  //   const keywordPrompt = ChatPromptTemplate.fromMessages([["system", "..."], ["human", "{sentence}"]]);
  //   const keywordChain = keywordPrompt.pipe(model).pipe(parser);

  // TODO (stage 2): build a haiku chain.
  //   Prompt should take a {keyword} variable and ask for a haiku about it.
  //   Pipe through the model and the parser.

  // TODO: compose both stages with RunnableSequence.from([...]).
  //   Between stages you need a small adapter that turns the keyword string
  //   from stage 1 into the `{ keyword }` object expected by stage 2.
  //   Hint:
  //     const chain = RunnableSequence.from<{ sentence: string }, string>([
  //       keywordChain,
  //       (keyword: string) => ({ keyword }),
  //       haikuChain,
  //     ]);

  // TODO: invoke with { sentence: "The fog rolled in over the city at dawn." } and return the haiku.
  void model; void parser; void RunnableSequence;
  return "";
}

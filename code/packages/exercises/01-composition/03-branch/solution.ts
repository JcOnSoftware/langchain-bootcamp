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

  const shortPrompt = ChatPromptTemplate.fromMessages([
    ["system", "Summarize the user's text in one concise sentence."],
    ["human", "{text}"],
  ]);
  const longPrompt = ChatPromptTemplate.fromMessages([
    ["system", "Summarize the user's text as exactly three short bullet points. Each bullet starts with '- '."],
    ["human", "{text}"],
  ]);

  const shortChain = shortPrompt.pipe(model).pipe(parser);
  const longChain = longPrompt.pipe(model).pipe(parser);

  const chain = RunnableBranch.from<BranchInput, string>([
    [(input: BranchInput) => input.text.length < 50, shortChain],
    longChain, // default branch (long text)
  ]);

  const short = await chain.invoke({ text: "Quick note on the meeting." });
  const long = await chain.invoke({
    text:
      "The quarterly review highlighted three recurring themes across teams: sharper planning cadences, clearer ownership boundaries, and consistent post-mortems after incidents.",
  });

  return { short, long };
}

// Docs:
//   JsonOutputParser — https://js.langchain.com/docs/how_to/output_parser_json/
//   Streaming        — https://js.langchain.com/docs/how_to/streaming/
//   ChatPromptTemplate — https://js.langchain.com/docs/how_to/prompts_composition/

import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

export default async function run(): Promise<{
  chunks: unknown[];
  final: Record<string, unknown>;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO: define a ChatPromptTemplate that asks the model to return ONLY a JSON object
  // with exactly these fields: { name: string, capital: string, population: number }
  // describing a country. Use ChatPromptTemplate.fromMessages([...]).
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "human",
      "TODO: write your prompt here. Ask for a JSON object with name, capital, population.",
    ],
  ]);

  // TODO: create a JsonOutputParser instance.
  const parser = new JsonOutputParser();

  // TODO: chain prompt → model → parser using .pipe()
  const chain = prompt.pipe(model).pipe(parser);

  // TODO: call chain.stream({}) to get an async iterable of partial JSON objects.
  const stream = await chain.stream({});

  // TODO: collect all chunks into an array.
  const chunks: unknown[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // TODO: extract the final (last) chunk as the fully assembled JSON object.
  const final = (chunks.at(-1) ?? {}) as Record<string, unknown>;

  return { chunks, final };
}

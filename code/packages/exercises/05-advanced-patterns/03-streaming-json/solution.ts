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

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "human",
      `Return ONLY a JSON object (no markdown, no explanation) with exactly these fields:
      {{ "name": <string>, "capital": <string>, "population": <number> }}
      Describe the country: Peru.`,
    ],
  ]);

  // Build a chain: prompt → model → JsonOutputParser.
  // JsonOutputParser parses incremental JSON as streaming chunks arrive.
  const parser = new JsonOutputParser();
  const chain = prompt.pipe(model).pipe(parser);

  // .stream() returns an AsyncGenerator of partially-assembled JSON objects.
  const stream = await chain.stream({});

  const chunks: unknown[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const final = (chunks.at(-1) ?? {}) as Record<string, unknown>;

  return { chunks, final };
}

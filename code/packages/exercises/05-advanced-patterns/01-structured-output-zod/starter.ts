// Docs:
//   withStructuredOutput — https://js.langchain.com/docs/how_to/structured_output/
//   Zod schema basics    — https://zod.dev/
//   ChatAnthropic        — https://js.langchain.com/docs/integrations/chat/anthropic
//   ChatOpenAI           — https://js.langchain.com/docs/integrations/chat/openai
//   ChatGoogleGenerativeAI — https://js.langchain.com/docs/integrations/chat/google_generativeai

import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// TODO: define a Zod schema with at least 2 fields describing a structured response.
// Example: a movie recommendation with title, year, genre, summary.
const MovieSchema = z.object({
  // TODO: add your fields here
  title: z.string(),
  year: z.number(),
});

type Movie = z.infer<typeof MovieSchema>;

export default async function run(): Promise<Movie> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO: call model.withStructuredOutput(MovieSchema) to get a structured chain.
  // The chain should return a parsed, typed object — not raw AIMessage.
  const structured = model.withStructuredOutput(MovieSchema);

  // TODO: invoke the structured chain with a HumanMessage that asks for a movie recommendation.
  const result = await structured.invoke([
    new HumanMessage("TODO: write your prompt here"),
  ]);

  // TODO: return the result directly (it's already the typed object).
  return result as Movie;
}

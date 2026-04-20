// Docs:
//   withStructuredOutput — https://js.langchain.com/docs/how_to/structured_output/
//   Zod schema basics    — https://zod.dev/
//   ChatAnthropic        — https://js.langchain.com/docs/integrations/chat/anthropic
//   ChatOpenAI           — https://js.langchain.com/docs/integrations/chat/openai
//   ChatGoogleGenerativeAI — https://js.langchain.com/docs/integrations/chat/google_generativeai

import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Define a Zod schema with ≥2 fields representing a movie recommendation.
const MovieSchema = z.object({
  title: z.string().describe("Movie title"),
  year: z.number().describe("Release year"),
  genre: z.string().describe("Primary genre (e.g. action, drama, sci-fi)"),
  summary: z.string().describe("One-sentence plot summary"),
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

  // withStructuredOutput wraps the model so it always returns a typed, parsed object.
  const structured = model.withStructuredOutput(MovieSchema, { name: "movie_recommendation" });

  const result = await structured.invoke([
    new HumanMessage(
      "Recommend one classic science fiction movie. Respond strictly with the requested JSON fields.",
    ),
  ]);

  return result as Movie;
}

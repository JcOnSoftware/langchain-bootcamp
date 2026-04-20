// Docs:
//   tool()      — https://js.langchain.com/docs/how_to/custom_tools/#tool-function
//   bindTools   — https://js.langchain.com/docs/how_to/tool_calling/
//   Zod schemas — https://zod.dev/
//   tool_calls  — https://js.langchain.com/docs/concepts/tool_calling/

import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// TODO: define a Zod schema for weather tool args.
// It should have at least a `city` field (string) and an optional `unit` field.
const WeatherArgsSchema = z.object({
  city: z.string().describe("City name"),
  // TODO: add an optional `unit` field: "celsius" | "fahrenheit"
});

// TODO: define a `weatherTool` using the `tool()` helper.
// Pass the function implementation AND { name, description, schema: WeatherArgsSchema }.
const weatherTool = tool(
  async ({ city }: z.infer<typeof WeatherArgsSchema>) => {
    // TODO: return a simple weather string for the city
    return `TODO: weather for ${city}`;
  },
  {
    name: "get_weather",
    description: "Get current weather for a city. Always call this for weather questions.",
    schema: WeatherArgsSchema,
  },
);

export default async function run(): Promise<{
  validResult: unknown;
  validationError: string;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO: bind the weather tool to the model using model.bindTools([weatherTool]).
  const bound = model.bindTools!([weatherTool]);

  // TODO: invoke the bound model with a system prompt instructing it to call the tool
  // and a human message asking about the weather in a specific city.
  const ai = await bound.invoke([
    new SystemMessage("TODO: instruct the model to use the get_weather tool"),
    new HumanMessage("TODO: ask about the weather in a city"),
  ]);

  // TODO: extract the tool_call from ai.tool_calls[0] and invoke the tool with its args.
  const toolCall = (ai.tool_calls ?? [])[0];
  let validResult: unknown = null;
  if (toolCall) {
    validResult = await weatherTool.invoke(toolCall.args as z.infer<typeof WeatherArgsSchema>);
  }

  // TODO: call weatherTool.invoke() with INVALID args (e.g., city as a number).
  // Catch the schema validation error and capture its message.
  let validationError = "";
  try {
    await weatherTool.invoke({ city: 12345 as unknown as string });
  } catch (err) {
    validationError = err instanceof Error ? err.message : String(err);
  }

  return { validResult, validationError };
}

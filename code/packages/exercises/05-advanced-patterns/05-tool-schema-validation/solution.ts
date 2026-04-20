// Docs:
//   tool()      — https://js.langchain.com/docs/how_to/custom_tools/#tool-function
//   bindTools   — https://js.langchain.com/docs/how_to/tool_calling/
//   Zod schemas — https://zod.dev/
//   tool_calls  — https://js.langchain.com/docs/concepts/tool_calling/

import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Define a Zod schema for the tool's expected arguments.
const WeatherArgsSchema = z.object({
  city: z.string().describe("City name"),
  unit: z.enum(["celsius", "fahrenheit"]).optional().describe("Temperature unit"),
});

// Define the tool using the `tool()` helper and the Zod schema.
// LangChain will validate `invoke()` arguments against this schema before running the function.
const weatherTool = tool(
  async ({ city, unit = "celsius" }: z.infer<typeof WeatherArgsSchema>) => {
    return `Sunny in ${city}, 22°${unit === "celsius" ? "C" : "F"}`;
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

  // Happy path: bind the tool and let the model call it with valid args.
  const bound = model.bindTools!([weatherTool]);

  const ai = await bound.invoke([
    new SystemMessage(
      "You MUST call the get_weather tool for any weather question. Do not answer from your own knowledge.",
    ),
    new HumanMessage("What is the weather like in Lima?"),
  ]);

  // The model should have produced a tool_call. Run the tool with its args.
  const toolCall = (ai.tool_calls ?? [])[0];
  let validResult: unknown = null;
  if (toolCall) {
    validResult = await weatherTool.invoke(toolCall.args as z.infer<typeof WeatherArgsSchema>);
  }

  // Rejection path: invoke the tool directly with invalid args to demonstrate schema validation.
  // Passing a number where a string is expected should fail the Zod schema.
  let validationError = "";
  try {
    // `tool.invoke` validates args through the Zod schema before calling the function.
    await weatherTool.invoke({ city: 12345 as unknown as string });
  } catch (err) {
    validationError = err instanceof Error ? err.message : String(err);
  }

  return { validResult, validationError };
}

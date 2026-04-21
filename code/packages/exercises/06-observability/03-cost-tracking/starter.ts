// Docs:
//   Callbacks overview   — https://js.langchain.com/docs/how_to/callbacks/
//   usage_metadata       — https://js.langchain.com/docs/how_to/chat_token_usage_tracking/

import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Rate table: USD per 1,000,000 tokens (input / output).
// Rates are matched by regex against the model id reported in usage_metadata.
// TODO: validate 2026-H2
const RATES: Array<{ match: RegExp; input: number; output: number }> = [
  // TODO: add rate entries for the models you expect to use.
  // Examples:
  //   { match: /haiku/i,            input: 1.0,   output: 5.0   },
  //   { match: /sonnet/i,           input: 3.0,   output: 15.0  },
  //   { match: /gpt-4o-mini/i,      input: 0.15,  output: 0.60  },
  //   { match: /gemini-2\.5-flash/, input: 0.30,  output: 2.50  },
];

function computeCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
  // TODO: find the matching rate entry from RATES.
  //   If no match, return zero costs.
  //   Compute: inputCost = (inputTokens / 1_000_000) * rate.input
  //            outputCost = (outputTokens / 1_000_000) * rate.output
  //            totalCost = inputCost + outputCost
  void modelId;
  void inputTokens;
  void outputTokens;
  return { inputCost: 0, outputCost: 0, totalCost: 0 };
}

export default async function run(): Promise<{
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // TODO: Invoke the model and read usage_metadata from the response.
  //   const response = await model.invoke([new HumanMessage("...")]);
  //   const usage = (response as any).usage_metadata ?? {};
  //   const inputTokens = usage.input_tokens ?? 0;
  //   const outputTokens = usage.output_tokens ?? 0;
  void HumanMessage;
  void model;

  const modelId = "";
  const inputTokens = 0;
  const outputTokens = 0;

  // TODO: Call computeCost(modelId, inputTokens, outputTokens) and return the full object.
  const { inputCost, outputCost, totalCost } = computeCost(modelId, inputTokens, outputTokens);

  return { modelId, inputTokens, outputTokens, inputCost, outputCost, totalCost };
}

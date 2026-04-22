// Docs:
//   Callbacks overview   — https://js.langchain.com/docs/how_to/callbacks/
//   usage_metadata       — https://js.langchain.com/docs/how_to/chat_token_usage_tracking/

import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

// Rate table: USD per 1,000,000 tokens (input / output).
// Each entry matches a model family by regex against the model id.
// Rates from public pricing pages — validate 2026-H2.
const RATES: Array<{ match: RegExp; input: number; output: number }> = [
  // Anthropic
  { match: /haiku/i,              input: 1.0,   output: 5.0   },
  { match: /sonnet/i,             input: 3.0,   output: 15.0  },
  { match: /opus/i,               input: 15.0,  output: 75.0  },
  // OpenAI
  { match: /gpt-4o-mini/i,        input: 0.15,  output: 0.60  },
  { match: /gpt-4o/i,             input: 2.50,  output: 10.0  },
  { match: /gpt-4\.1-mini/i,      input: 0.40,  output: 1.60  },
  { match: /gpt-4\.1/i,           input: 2.00,  output: 8.00  },
  // Google Gemini
  { match: /gemini-2\.5-flash/i,  input: 0.30,  output: 2.50  },
  { match: /gemini-2\.5-pro/i,    input: 1.25,  output: 10.0  },
];

function computeCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
  const rate = RATES.find((r) => r.match.test(modelId));
  if (!rate) return { inputCost: 0, outputCost: 0, totalCost: 0 };

  const inputCost = (inputTokens / 1_000_000) * rate.input;
  const outputCost = (outputTokens / 1_000_000) * rate.output;
  const totalCost = inputCost + outputCost;
  return { inputCost, outputCost, totalCost };
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

  // Invoke the model — usage_metadata is populated on the AIMessage response.
  const response = await model.invoke([
    new HumanMessage("Name one planet in our solar system. One word only."),
  ]);

  // usage_metadata is the LangChain-normalized token usage shape.
  const usageMetadata = (response as { usage_metadata?: Record<string, unknown> }).usage_metadata;
  const inputTokens = typeof usageMetadata?.["input_tokens"] === "number"
    ? usageMetadata["input_tokens"]
    : 0;
  const outputTokens = typeof usageMetadata?.["output_tokens"] === "number"
    ? usageMetadata["output_tokens"]
    : 0;

  // model id: response_metadata (server-reported for Anthropic/OpenAI) with
  // fallback to the model instance's .model property (Gemini omits it from metadata).
  const responseMetadata = (response as { response_metadata?: Record<string, unknown> })
    .response_metadata;
  const modelId =
    (typeof responseMetadata?.["model_name"] === "string" ? responseMetadata["model_name"]
    : typeof responseMetadata?.["model"] === "string" ? responseMetadata["model"]
    : typeof (model as unknown as { model?: string }).model === "string"
      ? (model as unknown as { model: string }).model
    : "");

  const { inputCost, outputCost, totalCost } = computeCost(modelId, inputTokens, outputTokens);

  return { modelId, inputTokens, outputTokens, inputCost, outputCost, totalCost };
}

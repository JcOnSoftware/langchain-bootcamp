// Docs:
//   Extended thinking — https://js.langchain.com/docs/integrations/chat/anthropic#extended-thinking
//   ChatAnthropic     — https://js.langchain.com/docs/integrations/chat/anthropic
//   AIMessage.content array — https://js.langchain.com/docs/concepts/messages/#aimessage
//
// NOTE: This exercise is Anthropic-only. The `thinking` option is not available
// on ChatOpenAI or ChatGoogleGenerativeAI. Run with LCDEV_PROVIDER=anthropic.

import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";

export default async function run(): Promise<{
  content: Array<{ type: string }>;
  hasThinking: boolean;
  hasText: boolean;
}> {
  const apiKey = process.env["ANTHROPIC_API_KEY"] ?? "";

  // TODO: instantiate ChatAnthropic with:
  //   - model: "claude-sonnet-4-5"
  //   - thinking: { type: "enabled", budget_tokens: 1024 }
  //     (Note: the API requires snake_case `budget_tokens`, not camelCase)
  //   - maxTokens: 2048 (must be > budget_tokens)
  const model = new ChatAnthropic({
    model: "claude-sonnet-4-5",
    apiKey,
    // TODO: add the thinking config here
    maxTokens: 2048,
  });

  // TODO: invoke the model with a HumanMessage that requires non-trivial reasoning.
  const response = await model.invoke([
    new HumanMessage("TODO: write a prompt that requires step-by-step reasoning"),
  ]);

  // The response content is an array of blocks when thinking is enabled.
  // Each block has a `type` field: "thinking" or "text".
  const content = response.content as Array<{ type: string }>;

  // TODO: compute hasThinking (true if any block has type === "thinking")
  const hasThinking = content.some((b) => b.type === "thinking");

  // TODO: compute hasText (true if any block has type === "text")
  const hasText = content.some((b) => b.type === "text");

  return { content, hasThinking, hasText };
}

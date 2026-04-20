// Docs:
//   Extended thinking — https://js.langchain.com/docs/integrations/chat/anthropic#extended-thinking
//   ChatAnthropic     — https://js.langchain.com/docs/integrations/chat/anthropic
//   AIMessage.content array — https://js.langchain.com/docs/concepts/messages/#aimessage
//
// NOTE: This exercise is Anthropic-only. The `thinking` option is not available
// on ChatOpenAI or ChatGoogleGenerativeAI. Run with LCDEV_PROVIDER=anthropic.

import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, type AIMessageChunk } from "@langchain/core/messages";

export default async function run(): Promise<{
  content: Array<{ type: string }>;
  hasThinking: boolean;
  hasText: boolean;
}> {
  const apiKey = process.env["ANTHROPIC_API_KEY"] ?? "";

  // Instantiate ChatAnthropic with thinking enabled.
  // - budget_tokens: how many tokens the model may use for its internal reasoning.
  //   LangChain passes this object directly to the Anthropic API (snake_case required).
  // - maxTokens: must be > budget_tokens (Anthropic requirement).
  const model = new ChatAnthropic({
    model: "claude-sonnet-4-5",
    apiKey,
    // LangChain passes `thinking` verbatim to the Anthropic API.
    // The API expects snake_case: `budget_tokens`, not `budgetTokens`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thinking: { type: "enabled", budget_tokens: 1024 } as any,
    maxTokens: 2048,
  });

  const response = await model.invoke([
    new HumanMessage(
      "What is the sum of all integers from 1 to 100? Show your reasoning step by step.",
    ),
  ]);

  // AIMessage.content is an array of content blocks when thinking is enabled.
  // Each block has a `type` field: "thinking" or "text".
  const content = response.content as Array<{ type: string }>;
  const hasThinking = content.some((b) => b.type === "thinking");
  const hasText = content.some((b) => b.type === "text");

  return { content, hasThinking, hasText };
}

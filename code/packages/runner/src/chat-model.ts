/**
 * Factory for the concrete chat model a learner uses inside an exercise.
 *
 * Single place that picks `ChatAnthropic` / `ChatOpenAI` /
 * `ChatGoogleGenerativeAI` given the provider chosen at `lcdev init`. Defaults
 * to the cheapest credible model per provider so `lcdev verify` costs pennies.
 *
 * Exercises import `createChatModel` (NOT the concrete subclass) so the body
 * of the exercise stays provider-agnostic — the learner's focus is LangChain
 * composition, not provider-specific SDK setup.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type SupportedProvider = "anthropic" | "openai" | "gemini";

export interface CreateChatModelOptions {
  model?: string;
  temperature?: number;
}

const DEFAULTS: Record<SupportedProvider, string> = {
  anthropic: "claude-haiku-4-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
};

export function createChatModel(
  provider: SupportedProvider,
  apiKey: string,
  opts: CreateChatModelOptions = {},
): BaseChatModel {
  const model = opts.model ?? DEFAULTS[provider];
  const temperature = opts.temperature ?? 0;

  switch (provider) {
    case "anthropic":
      return new ChatAnthropic({ apiKey, model, temperature });
    case "openai":
      return new ChatOpenAI({ apiKey, model, temperature });
    case "gemini":
      return new ChatGoogleGenerativeAI({ apiKey, model, temperature });
  }
}

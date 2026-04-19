/**
 * Factory for the concrete embeddings class used in RAG exercises.
 *
 * Mirrors `createChatModel`: one place to pick `OpenAIEmbeddings` /
 * `GoogleGenerativeAIEmbeddings` given the provider. Anthropic has no native
 * embeddings in LangChain 1.x yet, so it falls back to `OpenAIEmbeddings`
 * with a stderr notice — learners see WHY the fallback exists and where the
 * Voyage alternative lands (v0.2 track 07).
 */

import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import type { Embeddings } from "@langchain/core/embeddings";

export type EmbeddingsProvider = "anthropic" | "openai" | "gemini";

export interface CreateEmbeddingsOptions {
  model?: string;
}

const DEFAULT_MODELS: Record<EmbeddingsProvider, string> = {
  anthropic: "text-embedding-3-small", // fallback via OpenAIEmbeddings
  openai: "text-embedding-3-small",
  gemini: "text-embedding-004",
};

export function createEmbeddings(
  provider: EmbeddingsProvider,
  apiKey: string,
  openaiFallbackKey?: string,
  opts: CreateEmbeddingsOptions = {},
): Embeddings {
  const model = opts.model ?? DEFAULT_MODELS[provider];

  switch (provider) {
    case "openai":
      return new OpenAIEmbeddings({ apiKey, model });
    case "gemini":
      return new GoogleGenerativeAIEmbeddings({ apiKey, model });
    case "anthropic": {
      const fallbackKey = openaiFallbackKey ?? process.env["OPENAI_API_KEY"];
      if (!fallbackKey) {
        throw new Error(
          "createEmbeddings: Anthropic does not ship native embeddings in LangChain 1.x. " +
            "Pass an OpenAI key as the 3rd argument, or set OPENAI_API_KEY in env. " +
            "(Voyage-backed embeddings lands in track 07 for v0.2.)",
        );
      }
      process.stderr.write(
        "[lcdev] Using OpenAIEmbeddings fallback for Anthropic chat — " +
          "production RAG with Anthropic typically uses Voyage. " +
          "Voyage support lands in track 07 (v0.2).\n",
      );
      return new OpenAIEmbeddings({ apiKey: fallbackKey, model });
    }
  }
}

// Docs:
//   Embeddings — https://docs.langchain.com/oss/javascript/langchain/embeddings
//   MemoryVectorStore — https://docs.langchain.com/oss/javascript/langchain/vector_stores
//   similaritySearch — https://docs.langchain.com/oss/javascript/langchain/retrievers

import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createEmbeddings, type EmbeddingsProvider } from "@lcdev/runner";

// Corpus: 8 short blurbs about drinks. Topic-diverse on purpose —
// it lets similarity search actually separate signal from noise.
const CORPUS: Array<{ id: string; text: string }> = [
  { id: "espresso", text: "Espresso is a concentrated coffee brewed by forcing hot water through finely ground beans under high pressure, producing a small, intense shot with a crema layer on top." },
  { id: "pour-over", text: "Pour-over coffee relies on gravity: hot water drips through a paper filter holding medium-ground beans, yielding a clean, bright cup that highlights origin flavor notes." },
  { id: "french-press", text: "French press uses coarse grounds steeped in hot water for four minutes, then a mesh plunger separates liquid from grounds, delivering a heavier, oil-rich body." },
  { id: "green-tea", text: "Green tea leaves are steamed or pan-fired soon after picking to stop oxidation, preserving catechins that give the infusion a grassy, vegetal character." },
  { id: "black-tea", text: "Black tea leaves are fully oxidized after rolling, darkening the color and developing malty, robust flavors that pair well with milk and sweeteners." },
  { id: "mate", text: "Yerba mate is brewed in a hollow gourd and sipped through a metal straw; the infusion is shared among friends and carries a grassy, slightly bitter taste with caffeine kick." },
  { id: "hot-chocolate", text: "Hot chocolate is made by dissolving cocoa solids, sugar, and milk, sometimes enriched with cream or spices, producing a thick, indulgent winter drink." },
  { id: "matcha", text: "Matcha is stone-ground powdered green tea whisked with hot water into a frothy bowl; the whole leaf is consumed, delivering concentrated caffeine and L-theanine." },
];

export default async function run(): Promise<{ results: Document[] }> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as EmbeddingsProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  // `createEmbeddings` handles the Anthropic-has-no-native-embeddings gap by
  // falling back to OpenAI. Pass OPENAI_API_KEY as the 3rd arg for that case.
  const embeddings = createEmbeddings(provider, apiKey, process.env["OPENAI_API_KEY"]);

  // TODO 1: Convert CORPUS entries into Document[] with metadata.source = entry.id.
  const docs: Document[] = [];

  // TODO 2: Create a MemoryVectorStore from the documents using
  //         `MemoryVectorStore.fromDocuments(docs, embeddings)`.
  //         One line — the static factory embeds + indexes for you.
  void MemoryVectorStore;

  // TODO 3: Use `similaritySearch(query, k)` with k = 3 and a query
  //         that should rank "espresso" in the top 3. Return the results.
  const results: Document[] = [];
  void embeddings;

  return { results };
}

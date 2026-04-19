// Docs:
//   Embeddings — https://docs.langchain.com/oss/javascript/langchain/embeddings
//   MemoryVectorStore — https://docs.langchain.com/oss/javascript/langchain/vector_stores
//   similaritySearch — https://docs.langchain.com/oss/javascript/langchain/retrievers

import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createEmbeddings, type EmbeddingsProvider } from "@lcdev/runner";

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

  const embeddings = createEmbeddings(provider, apiKey, process.env["OPENAI_API_KEY"]);

  const docs = CORPUS.map(
    (entry) => new Document({ pageContent: entry.text, metadata: { source: entry.id } }),
  );

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  const results = await vectorStore.similaritySearch(
    "a strong, pressurized coffee shot with crema",
    3,
  );

  return { results };
}

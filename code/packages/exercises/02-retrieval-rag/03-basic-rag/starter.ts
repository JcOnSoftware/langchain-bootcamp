// Docs:
//   RAG overview — https://docs.langchain.com/oss/javascript/langchain/rag
//   Retrievers — https://docs.langchain.com/oss/javascript/langchain/retrievers
//   LCEL fundamentals — https://docs.langchain.com/oss/javascript/langchain/lcel
//   ChatPromptTemplate — https://docs.langchain.com/oss/javascript/langchain/prompts

import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnablePassthrough } from "@langchain/core/runnables";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import {
  createChatModel,
  createEmbeddings,
  type ChatModelProvider,
  type EmbeddingsProvider,
} from "@lcdev/runner";

// Mini encyclopedia about the Solar System. Keep the corpus inline —
// the self-contained file is the point of these exercises.
const CORPUS: Array<{ id: string; text: string }> = [
  { id: "solar-system-sun", text: "The Sun is a G-type main-sequence star at the center of the Solar System. It accounts for about 99.86% of the total mass of the Solar System." },
  { id: "solar-system-mercury", text: "Mercury is the closest planet to the Sun and the smallest in the Solar System. It has no moons and no substantial atmosphere." },
  { id: "solar-system-venus", text: "Venus is the second planet from the Sun and the hottest, due to a runaway greenhouse effect driven by a dense carbon-dioxide atmosphere." },
  { id: "solar-system-earth", text: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. It has one natural satellite: the Moon." },
  { id: "solar-system-mars", text: "Mars is the fourth planet from the Sun, often called the Red Planet because of iron oxide on its surface. It has two small moons, Phobos and Deimos." },
  { id: "solar-system-jupiter", text: "Jupiter is the largest planet in the Solar System, a gas giant with at least 95 known moons. Its most famous feature is the Great Red Spot, a persistent storm." },
];

// Turn a list of docs into a single context string for the prompt.
function formatDocs(docs: Document[]): string {
  return docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join("\n\n");
}

export default async function run(): Promise<{ answer: string; sources: Document[] }> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);
  const embeddings = createEmbeddings(
    provider as EmbeddingsProvider,
    apiKey,
    process.env["OPENAI_API_KEY"],
  );

  // TODO 1: Build docs + vector store from CORPUS, then create a retriever
  //         with k = 3. Use `vectorStore.asRetriever({ k: 3 })`.
  const docs = CORPUS.map(
    (e) => new Document({ pageContent: e.text, metadata: { source: e.id } }),
  );
  void docs;
  void MemoryVectorStore;
  void embeddings;

  // TODO 2: Build a ChatPromptTemplate with a system message that instructs
  //         the model to answer ONLY from `{context}`, plus a human message
  //         with `{question}`.
  const prompt = ChatPromptTemplate.fromMessages([
    // TODO
  ]);

  const question = "Which planet is the hottest in the Solar System and why?";

  // TODO 3: Call the retriever with the question to get the sources.
  const sources: Document[] = [];

  // TODO 4: Build the chain.
  //         Pattern: take `{ question, sources }` → attach `context = formatDocs(sources)`
  //                  → prompt → model → StringOutputParser.
  //         Hint: `RunnablePassthrough.assign({ context: ... })` preserves the input
  //         and adds a new field.
  const chain = prompt
    .pipe(model)
    .pipe(new StringOutputParser());
  void RunnablePassthrough;
  void RunnableLambda;
  void formatDocs;

  const answer = await chain.invoke({ question, context: "", sources });

  return { answer, sources };
}

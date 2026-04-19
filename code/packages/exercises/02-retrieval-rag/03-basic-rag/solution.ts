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

const CORPUS: Array<{ id: string; text: string }> = [
  { id: "solar-system-sun", text: "The Sun is a G-type main-sequence star at the center of the Solar System. It accounts for about 99.86% of the total mass of the Solar System." },
  { id: "solar-system-mercury", text: "Mercury is the closest planet to the Sun and the smallest in the Solar System. It has no moons and no substantial atmosphere." },
  { id: "solar-system-venus", text: "Venus is the second planet from the Sun and the hottest, due to a runaway greenhouse effect driven by a dense carbon-dioxide atmosphere." },
  { id: "solar-system-earth", text: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. It has one natural satellite: the Moon." },
  { id: "solar-system-mars", text: "Mars is the fourth planet from the Sun, often called the Red Planet because of iron oxide on its surface. It has two small moons, Phobos and Deimos." },
  { id: "solar-system-jupiter", text: "Jupiter is the largest planet in the Solar System, a gas giant with at least 95 known moons. Its most famous feature is the Great Red Spot, a persistent storm." },
];

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

  const docs = CORPUS.map(
    (e) => new Document({ pageContent: e.text, metadata: { source: e.id } }),
  );

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  const retriever = vectorStore.asRetriever({ k: 3 });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a precise assistant. Answer the user's question using ONLY the context below. If the context is insufficient, say so honestly.\n\nContext:\n{context}",
    ],
    ["human", "{question}"],
  ]);

  const question = "Which planet is the hottest in the Solar System and why?";
  const sources = await retriever.invoke(question);

  const chain = RunnablePassthrough.assign({
    context: new RunnableLambda({ func: (input: { question: string; sources: Document[] }) => formatDocs(input.sources) }),
  })
    .pipe(prompt)
    .pipe(model)
    .pipe(new StringOutputParser());

  const answer = await chain.invoke({ question, sources });

  return { answer, sources };
}

// Docs:
//   MMR — https://docs.langchain.com/oss/javascript/langchain/retrievers
//   RunnableLambda — https://docs.langchain.com/oss/javascript/langchain/runnables
//   Embeddings — https://docs.langchain.com/oss/javascript/langchain/embeddings

import { Document } from "@langchain/core/documents";
import { RunnableLambda } from "@langchain/core/runnables";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createEmbeddings, type EmbeddingsProvider } from "@lcdev/runner";

// 8 docs about programming topics. The QUERY below is "error handling in async code".
// Two docs mention "exception" literally — the keyword-boost pass should push them up.
const CORPUS: Array<{ id: string; text: string }> = [
  { id: "async-await", text: "Async/await is syntactic sugar over Promises in JavaScript: functions declared async return a Promise, and await pauses execution until a Promise settles. It makes asynchronous code read top-to-bottom." },
  { id: "exception-handling", text: "Exception handling in async code uses try/catch blocks around await expressions. Unhandled rejections propagate up the call stack and, if not caught, land on the global unhandledRejection hook." },
  { id: "promises", text: "Promises represent the eventual completion or failure of an async operation. They have three states: pending, fulfilled, and rejected, and chain via .then/.catch/.finally methods." },
  { id: "event-loop", text: "The event loop drives async execution in Node.js: it processes microtasks (Promise callbacks) before moving to the next macrotask, which is why Promise resolutions appear to run 'immediately'." },
  { id: "generators", text: "Generator functions use function* syntax and yield values on demand. They were a stepping stone for async iteration and still power libraries that need pausable computation." },
  { id: "error-boundaries", text: "Error boundaries in synchronous code are defined by exception propagation rules: a throw unwinds the stack until a matching try/catch, finally, or the runtime's default handler." },
  { id: "streams", text: "Node.js streams handle data flow incrementally, emitting 'data' and 'end' events. Backpressure is built in: a writable stream can signal the reader to slow down via pause/resume." },
  { id: "workers", text: "Worker threads let Node.js run CPU-bound tasks off the event loop. They communicate with the main thread via postMessage channels, similar to the browser Web Workers API." },
];

const QUERY = "error handling in async code";
const KEYWORDS = ["exception"];

// TODO 1: Implement a pure function that reorders docs so entries whose
//         pageContent (case-insensitive) contains any KEYWORDS come first.
//         Keep stable order among ties — use Array.sort on (hits desc).
function keywordBoost(docs: Document[]): Document[] {
  // TODO: count keyword hits per doc, sort desc by hits, return new array.
  return docs;
}

export default async function run(): Promise<{ raw: Document[]; reranked: Document[] }> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as EmbeddingsProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const embeddings = createEmbeddings(provider, apiKey, process.env["OPENAI_API_KEY"]);

  const docs = CORPUS.map(
    (e) => new Document({ pageContent: e.text, metadata: { source: e.id } }),
  );

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  // TODO 2: Run MMR search for QUERY with { k: 4, fetchK: 8 }. MMR fetches
  //         more candidates (fetchK), then picks k that balance relevance
  //         against diversity, so neighbors that say nearly the same thing
  //         don't all crowd the top.
  const raw: Document[] = [];
  void vectorStore;

  // TODO 3: Wrap keywordBoost in a RunnableLambda and invoke it on `raw`.
  //         The result is `reranked`. Same length, different order.
  const reranker = new RunnableLambda({ func: keywordBoost });
  const reranked = await reranker.invoke(raw);

  return { raw, reranked };
}

// Docs:
//   RunnableWithMessageHistory — https://docs.langchain.com/oss/javascript/langchain/runnables
//   InMemoryChatMessageHistory — https://docs.langchain.com/oss/javascript/langchain/chat_history
//   MessagesPlaceholder — https://docs.langchain.com/oss/javascript/langchain/prompts
//   RAG overview — https://docs.langchain.com/oss/javascript/langchain/rag

import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda, RunnablePassthrough, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import {
  createChatModel,
  createEmbeddings,
  type ChatModelProvider,
  type EmbeddingsProvider,
} from "@lcdev/runner";

// Corpus: 5 rules from the fictional Tuturutu Library. All on the same topic
// (returns / loans) so history actually matters for the second turn.
const CORPUS: Array<{ id: string; text: string }> = [
  { id: "window", text: "The Tuturutu Library accepts returns within 21 days of the borrowing date. Members who miss the window are charged a small late fee until the book is returned or reported lost." },
  { id: "damaged", text: "If a returned book is damaged, the library charges a repair fee equal to 30% of the book's replacement cost. Books with water damage or torn covers are considered unrepairable and must be paid in full." },
  { id: "lost", text: "Lost books must be reported within 7 days. Members are billed the full replacement cost plus a 5-dollar processing fee. Returning the book after payment triggers a partial refund minus the processing fee." },
  { id: "renew", text: "Members can renew a loan twice online, each renewal extending the return window by another 21 days. After the second renewal the book must be returned or declared lost — no third renewals are allowed." },
  { id: "hours", text: "The library is open Monday through Saturday from 9 AM to 7 PM. Returns can be dropped off in the outdoor book bin outside of business hours, and they count as returned on the same calendar day." },
];

function formatDocs(docs: Document[]): string {
  return docs.map((d, i) => `[${i + 1}] ${d.pageContent}`).join("\n\n");
}

export default async function run(): Promise<{ turn1: string; turn2: string }> {
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

  // TODO 1: Build a ChatPromptTemplate with THREE slots in this order:
  //         - system (with a `{context}` placeholder and a short instruction)
  //         - MessagesPlaceholder("history")  ← where past turns get injected
  //         - human: `"{question}"`
  const prompt = ChatPromptTemplate.fromMessages([
    // TODO
  ]);
  void MessagesPlaceholder;

  // TODO 2: Build the inner RAG chain. Shape: it receives `{ question }` and
  //         must produce a string. Use RunnablePassthrough.assign to attach
  //         `context = formatDocs(await retriever.invoke(input.question))`,
  //         then pipe into `prompt → model → StringOutputParser`.
  const ragChain = prompt
    .pipe(model)
    .pipe(new StringOutputParser());
  void RunnablePassthrough;
  void RunnableLambda;
  void retriever;
  void formatDocs;

  // TODO 3: Wrap ragChain with RunnableWithMessageHistory. Use an in-process
  //         Map<string, InMemoryChatMessageHistory> to store sessions.
  //         inputMessagesKey: "question", historyMessagesKey: "history".
  const sessions = new Map<string, InMemoryChatMessageHistory>();
  void sessions;

  const chainWithHistory: unknown = ragChain;
  void RunnableWithMessageHistory;

  // TODO 4: Invoke TWICE with the same sessionId so turn 2 sees turn 1's history.
  const config = { configurable: { sessionId: "test-session-1" } };
  void config;

  const turn1 = "";
  const turn2 = "";
  void chainWithHistory;

  return { turn1, turn2 };
}

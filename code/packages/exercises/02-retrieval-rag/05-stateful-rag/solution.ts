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

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a helpful Tuturutu Library assistant. Answer using the context below and the prior conversation. Be concise.\n\nContext:\n{context}",
    ],
    new MessagesPlaceholder("history"),
    ["human", "{question}"],
  ]);

  const ragChain = RunnablePassthrough.assign({
    context: new RunnableLambda({
      func: async (input: { question: string }) => formatDocs(await retriever.invoke(input.question)),
    }),
  })
    .pipe(prompt)
    .pipe(model)
    .pipe(new StringOutputParser());

  const sessions = new Map<string, InMemoryChatMessageHistory>();

  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: (sessionId: string) => {
      let history = sessions.get(sessionId);
      if (!history) {
        history = new InMemoryChatMessageHistory();
        sessions.set(sessionId, history);
      }
      return history;
    },
    inputMessagesKey: "question",
    historyMessagesKey: "history",
  });

  const config = { configurable: { sessionId: "test-session-1" } };

  const turn1 = await chainWithHistory.invoke(
    { question: "What's the return window?" },
    config,
  );
  const turn2 = await chainWithHistory.invoke(
    { question: "And what if the book is damaged?" },
    config,
  );

  return { turn1, turn2 };
}

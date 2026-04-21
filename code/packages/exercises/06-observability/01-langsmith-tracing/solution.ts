// Docs:
//   Callbacks overview   — https://js.langchain.com/docs/how_to/callbacks/
//   LangSmith tracing    — https://js.langchain.com/docs/integrations/providers/langsmith/
//   RunCollectorCallbackHandler — https://js.langchain.com/docs/how_to/callbacks/
//   langsmith Client     — https://docs.smith.langchain.com/reference/js/classes/index.Client

import { RunCollectorCallbackHandler } from "@langchain/core/tracers/run_collector";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { HumanMessage } from "@langchain/core/messages";
import { Client } from "langsmith";
import { createChatModel, type ChatModelProvider } from "@lcdev/runner";

export default async function run(): Promise<{
  collectedRuns: Array<{ id: string; name: string; run_type: string }>;
  tracingEnabled: boolean;
}> {
  const provider = (process.env["LCDEV_PROVIDER"] ?? "anthropic") as ChatModelProvider;
  const apiKey =
    process.env[
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ] ?? "";

  const model = createChatModel(provider, apiKey);

  // RunCollectorCallbackHandler collects every run offline — no LANGCHAIN_API_KEY required.
  const collector = new RunCollectorCallbackHandler();

  // Build callbacks: collector always runs; LangChainTracer only when API key is present.
  // Own the Client so we can flush pending batches before the script exits.
  const tracingEnabled = !!process.env["LANGCHAIN_API_KEY"];
  const client = tracingEnabled ? new Client() : undefined;
  const callbacks =
    tracingEnabled && client
      ? [collector, new LangChainTracer({ client })]
      : [collector];

  // Invoke the model — the callbacks intercept the run lifecycle and populate collector.tracedRuns.
  await model.invoke(
    [new HumanMessage("Name one popular programming language. One word only.")],
    { callbacks },
  );

  // LangSmith uploads are batched and async. In short-lived scripts the process
  // exits before the HTTP batch flushes, so runs never land in the dashboard.
  // awaitPendingTraceBatches() blocks until every queued batch has been sent.
  if (client) {
    await client.awaitPendingTraceBatches();
  }

  // Map tracedRuns to the shape the tests expect.
  const collectedRuns = collector.tracedRuns.map((r) => ({
    id: r.id,
    name: r.name,
    run_type: r.run_type,
  }));

  return { collectedRuns, tracingEnabled };
}

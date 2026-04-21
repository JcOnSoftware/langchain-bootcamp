// Docs:
//   Callbacks overview   — https://js.langchain.com/docs/how_to/callbacks/
//   LangSmith tracing    — https://js.langchain.com/docs/integrations/providers/langsmith/
//   RunCollectorCallbackHandler — https://js.langchain.com/docs/how_to/callbacks/
//   langsmith Client     — https://docs.smith.langchain.com/reference/js/classes/index.Client
import { RunCollectorCallbackHandler } from '@langchain/core/tracers/run_collector';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { HumanMessage } from '@langchain/core/messages';
import { Client } from 'langsmith';
import { createChatModel, type ChatModelProvider } from '@lcdev/runner';

export default async function run(): Promise<{
  collectedRuns: Array<{ id: string; name: string; run_type: string }>;
  tracingEnabled: boolean;
}> {
  const provider = (process.env['LCDEV_PROVIDER'] ??
    'anthropic') as ChatModelProvider;
  const apiKey =
    process.env[
      provider === 'anthropic'
        ? 'ANTHROPIC_API_KEY'
        : provider === 'openai'
          ? 'OPENAI_API_KEY'
          : 'GEMINI_API_KEY'
    ] ?? '';

  const model = createChatModel(provider, apiKey);

  // TODO 1: Build the offline collector.
  //   const collector = new RunCollectorCallbackHandler();
  const collector = new RunCollectorCallbackHandler();

  // TODO 2: Decide whether tracing is enabled.
  //   - tracingEnabled: true when process.env.LANGCHAIN_API_KEY is set.
  //   - When enabled, instantiate `new Client()` (reads LANGCHAIN_API_KEY from env).
  //   - Pass the client explicitly to LangChainTracer: `new LangChainTracer({ client })`.
  //   - Own the Client reference so we can flush it later (see TODO 4).
  const tracingEnabled = false;
  const client: Client | undefined = undefined;
  const callbacks: Array<
    RunCollectorCallbackHandler | LangChainTracer
  > = [collector];

  // TODO 3: Invoke the model with the callbacks array.
  //   await model.invoke(
  //     [new HumanMessage('Name one popular programming language. One word only.')],
  //     { callbacks },
  //   );
  void model;
  void HumanMessage;

  // TODO 4: Flush pending LangSmith batches.
  //   LangSmith uploads are batched and async — the process exits before the HTTP
  //   batch flushes, so runs never land in the dashboard. Call
  //   `await client.awaitPendingTraceBatches()` when tracingEnabled, before returning.
  void client;

  // TODO 5: Map collector.tracedRuns to { id, name, run_type } for the test shape.
  const collectedRuns: Array<{ id: string; name: string; run_type: string }> =
    [];
  void collector;

  return { collectedRuns, tracingEnabled };
}

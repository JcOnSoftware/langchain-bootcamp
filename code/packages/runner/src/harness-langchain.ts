/**
 * LangChain harness.
 *
 * Patches `BaseChatModel.prototype.invoke` and `._streamIterator` on the base
 * class. Every concrete chat model (`ChatAnthropic`, `ChatOpenAI`,
 * `ChatGoogleGenerativeAI`) inherits these methods — one patch intercepts all
 * three providers, matches LCEL pipes, `RunnableSequence.invoke`, `.batch`,
 * and `.stream`.
 *
 * Why not patch `_generate` / `_streamResponseChunks` as PLAN.md originally
 * suggested: `_generate` is abstract on `BaseChatModel` (not present on the
 * base prototype at runtime) and each subclass defines its own. Patching the
 * abstract slot catches nothing. `invoke` and `_streamIterator` are concrete
 * and live on `BaseChatModel.prototype` — a single surface that survives SDK
 * bumps and covers both invocation modes.
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { AIMessage, AIMessageChunk } from "@langchain/core/messages";
import type { CapturedCallLangChain } from "./types.ts";

type InvokeFn = BaseChatModel["invoke"];
type StreamIterFn = BaseChatModel["_streamIterator"];

/**
 * Patches `BaseChatModel.prototype.invoke` and `._streamIterator`.
 * Returns a restore function that reverts both.
 */
export function patchBaseChatModel(calls: CapturedCallLangChain[]): () => void {
  const proto = BaseChatModel.prototype;
  const originalInvoke = proto.invoke as InvokeFn;
  const originalStreamIterator = proto._streamIterator as StreamIterFn;

  proto.invoke = async function patchedInvoke(
    this: BaseChatModel,
    input,
    options,
  ) {
    const start = performance.now();
    const output = (await originalInvoke.call(this, input, options)) as AIMessage;
    calls.push(buildCapture({ model: this, input, output, start, streamed: false }));
    return output;
  } as InvokeFn;

  proto._streamIterator = async function* patchedStreamIterator(
    this: BaseChatModel,
    input,
    options,
  ) {
    const start = performance.now();
    let aggregated: AIMessageChunk | undefined;

    for await (const chunk of originalStreamIterator.call(this, input, options)) {
      // Chunks are AIMessageChunk at this layer; concat preserves usage/tool_calls.
      const typedChunk = chunk as AIMessageChunk;
      aggregated = aggregated === undefined ? typedChunk : aggregated.concat(typedChunk);
      yield chunk;
    }

    if (aggregated) {
      calls.push(
        buildCapture({
          model: this,
          input,
          output: aggregated as unknown as AIMessage,
          start,
          streamed: true,
        }),
      );
    }
  } as StreamIterFn;

  return () => {
    proto.invoke = originalInvoke;
    proto._streamIterator = originalStreamIterator;
  };
}

interface BuildCaptureArgs {
  model: BaseChatModel;
  input: unknown;
  output: AIMessage;
  start: number;
  streamed: boolean;
}

function buildCapture(args: BuildCaptureArgs): CapturedCallLangChain {
  const { model, input, output, start, streamed } = args;
  const modelName = safeLlmType(model);
  const usageMetadata = (output as { usage_metadata?: Record<string, unknown> }).usage_metadata;
  const usage = {
    input_tokens: numericField(usageMetadata, "input_tokens"),
    output_tokens: numericField(usageMetadata, "output_tokens"),
    total_tokens: numericField(usageMetadata, "total_tokens") || undefined,
    ...(usageMetadata ?? {}),
  };
  const responseMetadata = (output as { response_metadata?: Record<string, unknown> })
    .response_metadata;
  const toolCalls = (output as { tool_calls?: unknown[] }).tool_calls;
  const runId = (output as { id?: string }).id;

  return {
    model: modelName,
    input,
    response: {
      model: modelName,
      content: (output as { content?: unknown }).content,
      usage,
      tool_calls: toolCalls,
      response_metadata: responseMetadata,
    },
    run_id: runId,
    durationMs: performance.now() - start,
    streamed,
  };
}

function safeLlmType(model: BaseChatModel): string {
  try {
    const fn = (model as unknown as { _llmType?: () => string })._llmType;
    if (typeof fn === "function") return fn.call(model);
  } catch {
    // fall through
  }
  return model.constructor.name;
}

function numericField(obj: Record<string, unknown> | undefined, key: string): number {
  if (!obj) return 0;
  const v = obj[key];
  return typeof v === "number" ? v : 0;
}

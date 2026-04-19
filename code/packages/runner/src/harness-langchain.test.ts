import { describe, test, expect } from "bun:test";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk } from "@langchain/core/outputs";
import { patchBaseChatModel } from "./harness-langchain.ts";
import type { CapturedCallLangChain } from "./types.ts";

/**
 * Minimal concrete chat model — used to prove the prototype patch captures
 * calls from ANY BaseChatModel subclass, not just real provider SDKs.
 */
class FakeChatModel extends BaseChatModel {
  override _llmType(): string {
    return "fake-chat-model";
  }

  override async _generate(_messages: BaseMessage[]): Promise<{
    generations: Array<{ text: string; message: AIMessage }>;
    llmOutput?: Record<string, unknown>;
  }> {
    const message = new AIMessage({
      content: "hello from fake",
      usage_metadata: { input_tokens: 7, output_tokens: 3, total_tokens: 10 },
    });
    return { generations: [{ text: "hello from fake", message }] };
  }

  override async *_streamResponseChunks(
    _messages: BaseMessage[],
  ): AsyncGenerator<ChatGenerationChunk> {
    yield new ChatGenerationChunk({
      text: "hello ",
      message: new AIMessageChunk({ content: "hello " }),
    });
    yield new ChatGenerationChunk({
      text: "streamed",
      message: new AIMessageChunk({
        content: "streamed",
        usage_metadata: { input_tokens: 5, output_tokens: 2, total_tokens: 7 },
      }),
    });
  }
}

describe("patchBaseChatModel", () => {
  test("captures invoke() calls with AIMessage output", async () => {
    const calls: CapturedCallLangChain[] = [];
    const restore = patchBaseChatModel(calls);

    try {
      const model = new FakeChatModel({});
      const output = await model.invoke("hi");

      expect(output).toBeInstanceOf(AIMessage);
      expect(calls).toHaveLength(1);

      const c = calls[0]!;
      expect(c.model).toBe("fake-chat-model");
      expect(c.response.model).toBe("fake-chat-model");
      expect(c.response.content).toBe("hello from fake");
      expect(c.response.usage.input_tokens).toBe(7);
      expect(c.response.usage.output_tokens).toBe(3);
      expect(c.streamed).toBe(false);
      expect(c.durationMs).toBeGreaterThanOrEqual(0);
    } finally {
      restore();
    }
  });

  test("captures streamed calls and aggregates chunks", async () => {
    const calls: CapturedCallLangChain[] = [];
    const restore = patchBaseChatModel(calls);

    try {
      const model = new FakeChatModel({});
      const chunks: string[] = [];
      for await (const chunk of await model.stream("hi")) {
        chunks.push(String(chunk.content));
      }

      expect(chunks.join("")).toBe("hello streamed");
      expect(calls).toHaveLength(1);

      const c = calls[0]!;
      expect(c.streamed).toBe(true);
      expect(c.model).toBe("fake-chat-model");
      expect(c.response.usage.input_tokens).toBe(5);
      expect(c.response.usage.output_tokens).toBe(2);
    } finally {
      restore();
    }
  });

  test("restore reverts the patch", async () => {
    const calls: CapturedCallLangChain[] = [];
    const restore = patchBaseChatModel(calls);
    restore();

    const model = new FakeChatModel({});
    await model.invoke("hi");

    expect(calls).toHaveLength(0);
  });

  test("captures tool_calls when AIMessage carries them", async () => {
    const calls: CapturedCallLangChain[] = [];
    const restore = patchBaseChatModel(calls);

    class ToolCallingFakeModel extends FakeChatModel {
      override async _generate(): Promise<{
        generations: Array<{ text: string; message: AIMessage }>;
      }> {
        const message = new AIMessage({
          content: "",
          tool_calls: [
            { name: "get_weather", args: { city: "Lima" }, id: "call_1", type: "tool_call" },
          ],
          usage_metadata: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
        });
        return { generations: [{ text: "", message }] };
      }
    }

    try {
      const model = new ToolCallingFakeModel({});
      await model.invoke("weather in Lima?");

      expect(calls).toHaveLength(1);
      const tc = calls[0]!.response.tool_calls;
      expect(Array.isArray(tc)).toBe(true);
      expect(tc).toHaveLength(1);
      expect((tc![0] as { name: string }).name).toBe("get_weather");
    } finally {
      restore();
    }
  });
});

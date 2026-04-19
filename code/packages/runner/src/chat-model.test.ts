import { describe, test, expect } from "bun:test";
import { createChatModel } from "./chat-model.ts";

describe("createChatModel", () => {
  test("anthropic → ChatAnthropic with _llmType='anthropic'", () => {
    const chat = createChatModel("anthropic", "sk-ant-test");
    expect(chat.constructor.name).toBe("ChatAnthropic");
    expect(chat._llmType()).toBe("anthropic");
  });

  test("openai → ChatOpenAI with _llmType='openai'", () => {
    const chat = createChatModel("openai", "sk-test");
    expect(chat.constructor.name).toBe("ChatOpenAI");
    expect(chat._llmType()).toBe("openai");
  });

  test("gemini → ChatGoogleGenerativeAI with _llmType='googlegenerativeai'", () => {
    const chat = createChatModel("gemini", "AIza-test");
    expect(chat.constructor.name).toBe("ChatGoogleGenerativeAI");
    expect(chat._llmType().toLowerCase()).toContain("google");
  });

  test("respects opts.model override", () => {
    const chat = createChatModel("anthropic", "sk-ant-test", { model: "claude-sonnet-4-5" });
    expect((chat as unknown as { model: string }).model).toBe("claude-sonnet-4-5");
  });
});

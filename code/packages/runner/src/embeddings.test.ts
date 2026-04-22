import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createEmbeddings } from "./embeddings.ts";

describe("createEmbeddings", () => {
  const envSnapshot: { openai: string | undefined } = { openai: undefined };

  beforeEach(() => {
    envSnapshot.openai = process.env["OPENAI_API_KEY"];
  });

  afterEach(() => {
    if (envSnapshot.openai === undefined) {
      delete process.env["OPENAI_API_KEY"];
    } else {
      process.env["OPENAI_API_KEY"] = envSnapshot.openai;
    }
  });

  test("openai → OpenAIEmbeddings with default model text-embedding-3-small", () => {
    const e = createEmbeddings("openai", "sk-test");
    expect(e.constructor.name).toBe("OpenAIEmbeddings");
    expect((e as unknown as { model: string }).model).toBe("text-embedding-3-small");
  });

  test("gemini → GoogleGenerativeAIEmbeddings with default model gemini-embedding-001", () => {
    const e = createEmbeddings("gemini", "AIza-test");
    expect(e.constructor.name).toBe("GoogleGenerativeAIEmbeddings");
    expect((e as unknown as { model: string }).model).toBe("gemini-embedding-001");
  });

  test("anthropic with explicit fallback → OpenAIEmbeddings via fallback", () => {
    const e = createEmbeddings("anthropic", "sk-ant-test", "sk-openai-fallback");
    expect(e.constructor.name).toBe("OpenAIEmbeddings");
    // Default model still applies (fallback uses same defaults as openai)
    expect((e as unknown as { model: string }).model).toBe("text-embedding-3-small");
  });

  test("anthropic without fallback throws with helpful message", () => {
    delete process.env["OPENAI_API_KEY"];
    expect(() => createEmbeddings("anthropic", "sk-ant-test")).toThrow(/OPENAI_API_KEY|Voyage/);
  });

  test("opts.model overrides the default", () => {
    const e = createEmbeddings("openai", "sk-test", undefined, { model: "text-embedding-3-large" });
    expect((e as unknown as { model: string }).model).toBe("text-embedding-3-large");
  });
});

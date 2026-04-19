import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import type { Document } from "@langchain/core/documents";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-retrieval-rag/03-basic-rag", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const providerKey =
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY";
    if (!process.env[providerKey]) {
      throw new Error(`${providerKey} not set — this exercise hits the real API.`);
    }
    if (provider === "anthropic" && !process.env["OPENAI_API_KEY"]) {
      throw new Error(
        "OPENAI_API_KEY not set — Anthropic has no native embeddings, so OpenAI is required as a fallback.",
      );
    }
    result = await runUserCode(EXERCISE_FILE);
  });

  test("makes exactly one chat model call (retrieval is not captured)", () => {
    expect(result.calls).toHaveLength(1);
  });

  test("model id matches the configured provider", () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const expected =
      provider === "anthropic" ? /claude-/
      : provider === "openai" ? /gpt-/
      : /gemini-/;
    expect(result.lastCall?.response.model ?? "").toMatch(expected);
  });

  test("returns a { answer, sources } object", () => {
    expect(result.userReturn).toBeDefined();
    const ret = result.userReturn as { answer?: unknown; sources?: unknown };
    expect(typeof ret.answer).toBe("string");
    expect(Array.isArray(ret.sources)).toBe(true);
  });

  test("answer is a non-empty string", () => {
    const { answer } = result.userReturn as { answer: string };
    expect(answer.length).toBeGreaterThan(0);
  });

  test("sources contain at least one Document", () => {
    const { sources } = result.userReturn as { sources: Document[] };
    expect(sources.length).toBeGreaterThanOrEqual(1);
    for (const doc of sources) {
      expect(typeof doc.pageContent).toBe("string");
      expect(doc.pageContent.length).toBeGreaterThan(0);
    }
  });
});

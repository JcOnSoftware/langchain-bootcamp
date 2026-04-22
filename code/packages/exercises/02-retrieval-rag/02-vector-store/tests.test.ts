import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import type { Document } from "@langchain/core/documents";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-retrieval-rag/02-vector-store", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const providerKey =
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY";
    if (!process.env[providerKey]) {
      throw new Error(`${providerKey} not set — this exercise hits the real embeddings API.`);
    }
    // Anthropic has no native embeddings — the factory falls back to OpenAI.
    if (provider === "anthropic" && !process.env["OPENAI_API_KEY"]) {
      throw new Error(
        "OPENAI_API_KEY not set — Anthropic has no native embeddings, so OpenAI is required as a fallback.",
      );
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("makes zero chat model calls (embeddings are not captured by the harness)", () => {
    expect(result.calls).toHaveLength(0);
  });

  test("returns a { results } object with an array", () => {
    expect(result.userReturn).toBeDefined();
    const ret = result.userReturn as { results?: unknown };
    expect(Array.isArray(ret.results)).toBe(true);
  });

  test("similaritySearch returns exactly 3 documents", () => {
    const { results } = result.userReturn as { results: Document[] };
    expect(results).toHaveLength(3);
  });

  test("every returned document has non-empty pageContent", () => {
    const { results } = result.userReturn as { results: Document[] };
    for (const doc of results) {
      expect(typeof doc.pageContent).toBe("string");
      expect(doc.pageContent.length).toBeGreaterThan(0);
    }
  });
});

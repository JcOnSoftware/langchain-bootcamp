import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import type { Document } from "@langchain/core/documents";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-retrieval-rag/04-hybrid-retrieval", () => {
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
    if (provider === "anthropic" && !process.env["OPENAI_API_KEY"]) {
      throw new Error(
        "OPENAI_API_KEY not set — Anthropic has no native embeddings, so OpenAI is required as a fallback.",
      );
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("makes zero chat model calls (retrieval + reranking only)", () => {
    expect(result.calls).toHaveLength(0);
  });

  test("returns { raw, reranked } with 4 docs each", () => {
    const ret = result.userReturn as { raw?: Document[]; reranked?: Document[] };
    expect(Array.isArray(ret.raw)).toBe(true);
    expect(Array.isArray(ret.reranked)).toBe(true);
    expect(ret.raw).toHaveLength(4);
    expect(ret.reranked).toHaveLength(4);
  });

  test("reranked top-2 contains the 'exception' keyword", () => {
    const { reranked } = result.userReturn as { reranked: Document[] };
    const top2 = reranked.slice(0, 2).map((d) => d.pageContent.toLowerCase());
    const anyMatches = top2.some((text) => text.includes("exception"));
    expect(anyMatches).toBe(true);
  });

  test("reranked contains the same docs as raw (same set, different order)", () => {
    const { raw, reranked } = result.userReturn as { raw: Document[]; reranked: Document[] };
    const rawSources = new Set(
      raw.map((d) => (d.metadata as { source?: string }).source ?? d.pageContent),
    );
    const rerankedSources = new Set(
      reranked.map((d) => (d.metadata as { source?: string }).source ?? d.pageContent),
    );
    expect(rerankedSources).toEqual(rawSources);
  });
});

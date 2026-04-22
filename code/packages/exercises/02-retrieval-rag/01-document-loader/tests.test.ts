import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import type { Document } from "@langchain/core/documents";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-retrieval-rag/01-document-loader", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    // Pure splitting — no model, no embeddings. No API key required.
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("makes zero chat model calls (splitting is offline)", () => {
    expect(result.calls).toHaveLength(0);
  });

  test("returns a { chunks } object", () => {
    expect(result.userReturn).toBeDefined();
    expect(typeof result.userReturn).toBe("object");
    expect(result.userReturn).not.toBeNull();
    const ret = result.userReturn as { chunks?: unknown };
    expect(Array.isArray(ret.chunks)).toBe(true);
  });

  test("produces at least 5 chunks", () => {
    const { chunks } = result.userReturn as { chunks: Document[] };
    expect(chunks.length).toBeGreaterThanOrEqual(5);
  });

  test("every chunk has pageContent and metadata", () => {
    const { chunks } = result.userReturn as { chunks: Document[] };
    for (const chunk of chunks) {
      expect(typeof chunk.pageContent).toBe("string");
      expect(chunk.pageContent.length).toBeGreaterThan(0);
      expect(chunk.metadata).toBeDefined();
      expect(typeof chunk.metadata).toBe("object");
    }
  });

  test("chunks preserve a `source` metadata field from the original corpus", () => {
    const { chunks } = result.userReturn as { chunks: Document[] };
    const sources = new Set(
      chunks
        .map((c) => (c.metadata as { source?: unknown }).source)
        .filter((s): s is string => typeof s === "string"),
    );
    expect(sources.size).toBeGreaterThanOrEqual(5);
  });
});

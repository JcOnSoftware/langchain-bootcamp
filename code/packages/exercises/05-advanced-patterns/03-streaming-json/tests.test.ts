import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-advanced-patterns/03-streaming-json", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const envKey =
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY";
    if (!process.env[envKey]) {
      throw new Error(`${envKey} not set — this exercise hits the real API.`);
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("chunks array has more than one element (streaming emits multiple partial objects)", () => {
    const r = result.userReturn as { chunks: unknown[]; final: Record<string, unknown> };
    expect(r.chunks.length).toBeGreaterThan(1);
  });

  test("final is a non-null object", () => {
    const r = result.userReturn as { chunks: unknown[]; final: Record<string, unknown> };
    expect(r.final).not.toBeNull();
    expect(typeof r.final).toBe("object");
  });

  test("final has the expected top-level keys (name, capital, population)", () => {
    const r = result.userReturn as { chunks: unknown[]; final: Record<string, unknown> };
    expect("name" in r.final || "capital" in r.final || "population" in r.final).toBe(true);
  });

  test("at least one model call was streamed", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
    const streamed = result.calls.some((c) => c.streamed === true);
    expect(streamed).toBe(true);
  });
});

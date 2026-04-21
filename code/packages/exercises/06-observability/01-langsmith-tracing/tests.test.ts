import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("06-observability/01-langsmith-tracing", () => {
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

  test("at least one chat model call captured", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("collectedRuns contains at least 1 run", () => {
    const r = result.userReturn as {
      collectedRuns: Array<{ id: string; name: string; run_type: string }>;
      tracingEnabled: boolean;
    };
    expect(Array.isArray(r.collectedRuns)).toBe(true);
    expect(r.collectedRuns.length).toBeGreaterThanOrEqual(1);
  });

  test("each collected run has id, name, run_type keys", () => {
    const r = result.userReturn as {
      collectedRuns: Array<{ id: string; name: string; run_type: string }>;
      tracingEnabled: boolean;
    };
    for (const run of r.collectedRuns) {
      expect(typeof run.id).toBe("string");
      expect(typeof run.name).toBe("string");
      expect(typeof run.run_type).toBe("string");
    }
  });

  test("tracingEnabled reflects LANGCHAIN_API_KEY presence", () => {
    const r = result.userReturn as {
      collectedRuns: Array<{ id: string; name: string; run_type: string }>;
      tracingEnabled: boolean;
    };
    const expected = !!process.env["LANGCHAIN_API_KEY"];
    expect(r.tracingEnabled).toBe(expected);
  });

  // LangChainTracer wired scenario — skipped when LANGCHAIN_API_KEY is absent.
  test.skipIf(!process.env["LANGCHAIN_API_KEY"])(
    "tracingEnabled is true when LANGCHAIN_API_KEY is set",
    () => {
      const r = result.userReturn as {
        collectedRuns: Array<{ id: string; name: string; run_type: string }>;
        tracingEnabled: boolean;
      };
      expect(r.tracingEnabled).toBe(true);
    },
  );
});

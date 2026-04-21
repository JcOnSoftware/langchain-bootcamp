import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

const EXPECTED_WRAPPER_TYPES = [
  "withRetry",
  "withFallbacks",
  "costCallback",
  "errorBoundary",
  "runCollector",
] as const;

describe("06-observability/05-production-checklist", () => {
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

  test("wrapperTypes is an array with at least 5 entries", () => {
    const r = result.userReturn as {
      wrapperTypes: string[];
      callSucceeded: boolean;
      tracedRuns: unknown[];
    };
    expect(Array.isArray(r.wrapperTypes)).toBe(true);
    expect(r.wrapperTypes.length).toBeGreaterThanOrEqual(5);
  });

  for (const wt of EXPECTED_WRAPPER_TYPES) {
    test(`wrapperTypes includes "${wt}"`, () => {
      const r = result.userReturn as { wrapperTypes: string[] };
      expect(r.wrapperTypes).toContain(wt);
    });
  }

  test("callSucceeded is true", () => {
    const r = result.userReturn as {
      wrapperTypes: string[];
      callSucceeded: boolean;
      tracedRuns: unknown[];
    };
    expect(r.callSucceeded).toBe(true);
  });

  test("tracedRuns has at least 1 entry", () => {
    const r = result.userReturn as {
      wrapperTypes: string[];
      callSucceeded: boolean;
      tracedRuns: unknown[];
    };
    expect(Array.isArray(r.tracedRuns)).toBe(true);
    expect(r.tracedRuns.length).toBeGreaterThanOrEqual(1);
  });
});

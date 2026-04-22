import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-advanced-patterns/02-fallback-retry", () => {
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

  test("fallback path was taken (usedFallback === true)", () => {
    const r = result.userReturn as { usedFallback: boolean; result: string };
    expect(r.usedFallback).toBe(true);
  });

  test("result is a non-empty string", () => {
    const r = result.userReturn as { usedFallback: boolean; result: string };
    expect(typeof r.result).toBe("string");
    expect(r.result.length).toBeGreaterThan(0);
  });

  test("at least one model call captured (from the fallback)", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("fallback model id is a non-empty string", () => {
    const call = result.calls[0];
    expect(call).toBeDefined();
    expect(typeof call!.model).toBe("string");
    expect(call!.model.length).toBeGreaterThan(0);
  });
});

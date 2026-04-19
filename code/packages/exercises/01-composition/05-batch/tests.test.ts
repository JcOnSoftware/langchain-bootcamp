import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-batch", () => {
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
  });

  test("makes exactly three model calls (one per batch item)", () => {
    expect(result.calls).toHaveLength(3);
  });

  test("every call uses the configured provider family", () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const expected =
      provider === "anthropic" ? /claude-/
      : provider === "openai" ? /gpt-/
      : /gemini-/;
    for (const call of result.calls) {
      expect(call.response.model).toMatch(expected);
    }
  });

  test("reports positive token usage on every call", () => {
    for (const call of result.calls) {
      expect(call.response.usage.input_tokens).toBeGreaterThan(0);
      expect(call.response.usage.output_tokens).toBeGreaterThan(0);
    }
  });

  test("userReturn is an array of three non-empty strings", () => {
    expect(Array.isArray(result.userReturn)).toBe(true);
    const arr = result.userReturn as unknown[];
    expect(arr).toHaveLength(3);
    for (const item of arr) {
      expect(typeof item).toBe("string");
      expect(String(item).length).toBeGreaterThan(0);
    }
  });
});

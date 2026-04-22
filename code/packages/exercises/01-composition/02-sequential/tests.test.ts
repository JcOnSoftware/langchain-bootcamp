import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-sequential", () => {
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

  test("makes exactly two model calls (one per stage)", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("both calls use the same provider model family", () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const expected =
      provider === "anthropic" ? /claude-/
      : provider === "openai" ? /gpt-/
      : /gemini-/;
    expect(result.calls[0]?.response.model ?? "").toMatch(expected);
    expect(result.calls[1]?.response.model ?? "").toMatch(expected);
  });

  test("reports positive token usage on both calls", () => {
    for (const call of result.calls) {
      expect(call.response.usage.input_tokens).toBeGreaterThan(0);
      expect(call.response.usage.output_tokens).toBeGreaterThan(0);
    }
  });

  test("returns a non-empty string (final haiku)", () => {
    expect(typeof result.userReturn).toBe("string");
    expect(String(result.userReturn).length).toBeGreaterThan(0);
  });
});

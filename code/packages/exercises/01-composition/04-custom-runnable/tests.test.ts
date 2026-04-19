import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-custom-runnable", () => {
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

  test("makes exactly one model call", () => {
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

  test("reports positive token usage", () => {
    const usage = result.lastCall?.response.usage;
    expect(usage?.input_tokens ?? 0).toBeGreaterThan(0);
    expect(usage?.output_tokens ?? 0).toBeGreaterThan(0);
  });

  test("returns a non-empty string (the adapter + prompt + parser fed through)", () => {
    expect(typeof result.userReturn).toBe("string");
    expect(String(result.userReturn).length).toBeGreaterThan(0);
  });
});

import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-branch", () => {
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

  test("makes exactly two model calls (one per branch invocation)", () => {
    expect(result.calls).toHaveLength(2);
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

  test("userReturn is an object with non-empty short and long strings", () => {
    expect(typeof result.userReturn).toBe("object");
    const out = result.userReturn as { short?: unknown; long?: unknown };
    expect(typeof out.short).toBe("string");
    expect(typeof out.long).toBe("string");
    expect(String(out.short).length).toBeGreaterThan(0);
    expect(String(out.long).length).toBeGreaterThan(0);
  });
});

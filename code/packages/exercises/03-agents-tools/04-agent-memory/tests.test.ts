import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-agents-tools/04-agent-memory", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const envKey =
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY"
    ;
    if (!process.env[envKey]) {
      throw new Error(`${envKey} not set — this exercise hits the real API.`);
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("at least two model calls — one per agent turn", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("model id matches the configured provider", () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const expected =
      provider === "anthropic" ? /claude-/
      : provider === "openai" ? /gpt-/
      : /gemini-/;
    expect(result.lastCall?.response.model ?? "").toMatch(expected);
  });

  test("turn1 answer is a non-empty string", () => {
    const ret = result.userReturn as { turn1?: unknown };
    expect(typeof ret.turn1).toBe("string");
    expect(String(ret.turn1).length).toBeGreaterThan(0);
  });

  test("turn2 answer is a non-empty string", () => {
    const ret = result.userReturn as { turn2?: unknown };
    expect(typeof ret.turn2).toBe("string");
    expect(String(ret.turn2).length).toBeGreaterThan(0);
  });
});

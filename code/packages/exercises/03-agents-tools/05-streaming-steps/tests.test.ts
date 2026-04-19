import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import type { BaseMessage } from "@langchain/core/messages";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-agents-tools/05-streaming-steps", () => {
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
  });

  test("at least one model call was captured inside the stream", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("model id matches the configured provider", () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const expected =
      provider === "anthropic" ? /claude-/
      : provider === "openai" ? /gpt-/
      : /gemini-/;
    expect(result.lastCall?.response.model ?? "").toMatch(expected);
  });

  test("user received more than one snapshot from stream()", () => {
    const ret = result.userReturn as { snapshotCount?: unknown };
    expect(typeof ret.snapshotCount).toBe("number");
    expect(ret.snapshotCount as number).toBeGreaterThanOrEqual(2);
  });

  test("final snapshot carries at least two messages", () => {
    const ret = result.userReturn as { finalMessages?: BaseMessage[] };
    expect(Array.isArray(ret.finalMessages)).toBe(true);
    expect((ret.finalMessages ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

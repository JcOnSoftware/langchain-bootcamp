import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import type { BaseMessage } from "@langchain/core/messages";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-agents-tools/02-react-agent", () => {
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

  test("agent loop makes at least two model calls (decide + answer)", () => {
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

  test("at least one captured call produced tool_calls", () => {
    const withTools = result.calls.filter((c) => {
      const tc = c.response.tool_calls as Array<unknown> | undefined;
      return Array.isArray(tc) && tc.length >= 1;
    });
    expect(withTools.length).toBeGreaterThanOrEqual(1);
  });

  test("userReturn.answer is a non-empty string", () => {
    const ret = result.userReturn as { answer?: unknown };
    expect(typeof ret.answer).toBe("string");
    expect(String(ret.answer).length).toBeGreaterThan(0);
  });

  test("userReturn.messages contains at least the user turn plus tool/assistant turns", () => {
    const ret = result.userReturn as { messages?: BaseMessage[] };
    expect(Array.isArray(ret.messages)).toBe(true);
    expect((ret.messages ?? []).length).toBeGreaterThanOrEqual(3);
  });
});

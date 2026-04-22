import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-agents-tools/01-bind-tools", () => {
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

  test("makes exactly one model call (no agent loop)", () => {
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

  test("model decided to call at least one tool", () => {
    const toolCalls = result.lastCall?.response.tool_calls as
      | Array<{ name: string }>
      | undefined;
    expect(Array.isArray(toolCalls)).toBe(true);
    expect((toolCalls ?? []).length).toBeGreaterThanOrEqual(1);
  });

  test("the tool invoked is `get_weather`", () => {
    const toolCalls = (result.lastCall?.response.tool_calls ?? []) as Array<{
      name: string;
    }>;
    const first = toolCalls[0];
    expect(first?.name).toBe("get_weather");
  });

  test("userReturn surfaces the tool_calls from the AIMessage", () => {
    const ret = result.userReturn as { toolCalls?: unknown };
    expect(Array.isArray(ret.toolCalls)).toBe(true);
    expect((ret.toolCalls as unknown[]).length).toBeGreaterThanOrEqual(1);
  });
});

import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-langgraph/02-react-as-graph", () => {
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

  test("graph performs at least 2 chat model calls (tool decision + answer)", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("at least one captured call has a non-empty tool_calls array", () => {
    const withTools = result.calls.filter(
      (c) => Array.isArray(c.response.tool_calls) && c.response.tool_calls.length > 0,
    );
    expect(withTools.length).toBeGreaterThanOrEqual(1);
  });

  test("tool_calls NAME matches one of the bound tools", () => {
    const allNames = result.calls
      .flatMap((c) => (c.response.tool_calls ?? []) as Array<{ name: string }>)
      .map((tc) => tc.name);
    expect(allNames.some((n) => n === "get_weather" || n === "get_time")).toBe(true);
  });

  test("final answer is a non-empty string", () => {
    const r = result.userReturn as { answer: string };
    expect(typeof r.answer).toBe("string");
    expect(r.answer.length).toBeGreaterThan(0);
  });

  test("messages array contains at least 3 entries (human + ai + ai-final)", () => {
    const r = result.userReturn as { messages: unknown[] };
    expect(r.messages.length).toBeGreaterThanOrEqual(3);
  });
});

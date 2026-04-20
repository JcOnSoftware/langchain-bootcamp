import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import { z } from "zod";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// Mirrors the Zod schema used in the tool defined in the exercise.
const WeatherArgsSchema = z.object({
  city: z.string(),
  unit: z.enum(["celsius", "fahrenheit"]).optional(),
});

describe("05-advanced-patterns/05-tool-schema-validation", () => {
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

  test("at least one chat model call captured", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("validResult is truthy", () => {
    const r = result.userReturn as { validResult: unknown; validationError: string };
    expect(Boolean(r.validResult)).toBe(true);
  });

  test("model produced a tool_call with args matching the Zod schema", () => {
    // Find the call that has a tool_call for our weather tool.
    const callWithTools = result.calls.find(
      (c) => Array.isArray(c.response.tool_calls) && c.response.tool_calls.length > 0,
    );
    expect(callWithTools).toBeDefined();

    const toolCalls = callWithTools!.response.tool_calls as Array<{
      name: string;
      args: unknown;
    }>;
    const tc = toolCalls.find((t) => t.name === "get_weather");
    expect(tc).toBeDefined();
    expect(WeatherArgsSchema.safeParse(tc?.args).success).toBe(true);
  });

  test("validationError is a non-empty string describing the schema failure", () => {
    const r = result.userReturn as { validResult: unknown; validationError: string };
    expect(typeof r.validationError).toBe("string");
    expect(r.validationError.length).toBeGreaterThan(0);
  });
});

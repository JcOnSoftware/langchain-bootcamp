import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";
import { z } from "zod";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// Mirrors the zod schema declared in the exercise solution.
const MovieSchema = z.object({
  title: z.string(),
  year: z.number(),
  genre: z.string(),
  summary: z.string(),
});

describe("05-advanced-patterns/01-structured-output-zod", () => {
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

  test("model id is a non-empty string", () => {
    const call = result.calls[0];
    expect(call).toBeDefined();
    expect(typeof call!.model).toBe("string");
    expect(call!.model.length).toBeGreaterThan(0);
  });

  test("userReturn matches the MovieSchema shape", () => {
    const parsed = MovieSchema.safeParse(result.userReturn);
    expect(parsed.success).toBe(true);
  });

  test("userReturn.title is a non-empty string", () => {
    const r = result.userReturn as z.infer<typeof MovieSchema>;
    expect(typeof r.title).toBe("string");
    expect(r.title.length).toBeGreaterThan(0);
  });

  test("userReturn.year is a number", () => {
    const r = result.userReturn as z.infer<typeof MovieSchema>;
    expect(typeof r.year).toBe("number");
  });
});

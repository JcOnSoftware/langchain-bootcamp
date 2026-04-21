import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("06-observability/03-cost-tracking", () => {
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

  test("at least one chat model call captured", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("inputTokens is greater than 0", () => {
    const r = result.userReturn as {
      modelId: string;
      inputTokens: number;
      outputTokens: number;
      inputCost: number;
      outputCost: number;
      totalCost: number;
    };
    expect(r.inputTokens).toBeGreaterThan(0);
  });

  test("outputTokens is greater than 0", () => {
    const r = result.userReturn as {
      modelId: string;
      inputTokens: number;
      outputTokens: number;
      inputCost: number;
      outputCost: number;
      totalCost: number;
    };
    expect(r.outputTokens).toBeGreaterThan(0);
  });

  test("totalCost is greater than 0", () => {
    const r = result.userReturn as {
      modelId: string;
      inputTokens: number;
      outputTokens: number;
      inputCost: number;
      outputCost: number;
      totalCost: number;
    };
    expect(r.totalCost).toBeGreaterThan(0);
  });

  test("totalCost equals inputCost + outputCost within floating-point tolerance", () => {
    const r = result.userReturn as {
      modelId: string;
      inputTokens: number;
      outputTokens: number;
      inputCost: number;
      outputCost: number;
      totalCost: number;
    };
    expect(Math.abs(r.totalCost - (r.inputCost + r.outputCost))).toBeLessThan(1e-9);
  });

  test("modelId is a non-empty string", () => {
    const r = result.userReturn as { modelId: string };
    expect(typeof r.modelId).toBe("string");
    expect(r.modelId.length).toBeGreaterThan(0);
  });
});

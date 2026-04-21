import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("06-observability/02-custom-callbacks", () => {
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

  test("events array has at least 2 entries", () => {
    const r = result.userReturn as { events: Array<{ type: string }> };
    expect(Array.isArray(r.events)).toBe(true);
    expect(r.events.length).toBeGreaterThanOrEqual(2);
  });

  test("events includes at least one handleLLMStart entry", () => {
    const r = result.userReturn as { events: Array<{ type: string }> };
    const hasStart = r.events.some((e) => e.type === "handleLLMStart");
    expect(hasStart).toBe(true);
  });

  test("events includes at least one handleLLMEnd entry", () => {
    const r = result.userReturn as { events: Array<{ type: string }> };
    const hasEnd = r.events.some((e) => e.type === "handleLLMEnd");
    expect(hasEnd).toBe(true);
  });

  test("each event has a type string", () => {
    const r = result.userReturn as { events: Array<{ type: string }> };
    for (const evt of r.events) {
      expect(typeof evt.type).toBe("string");
      expect(evt.type.length).toBeGreaterThan(0);
    }
  });
});

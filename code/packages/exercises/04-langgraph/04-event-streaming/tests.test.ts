import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-langgraph/04-event-streaming", () => {
  let result: HarnessResult;

  // 30 s: streamEvents v2 with thinking models (Gemini 2.5 Flash) consistently exceeds bun's 5 s default
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

  test("at least one chat model call was captured", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("totalEvents >= 3 (a small graph still emits chain + model events)", () => {
    const r = result.userReturn as { totalEvents: number };
    expect(r.totalEvents).toBeGreaterThanOrEqual(3);
  });

  test("eventTypes contains at least one key starting with 'on_'", () => {
    const r = result.userReturn as { eventTypes: Record<string, number> };
    const hasOnPrefix = Object.keys(r.eventTypes).some((k) => k.startsWith("on_"));
    expect(hasOnPrefix).toBe(true);
  });
});

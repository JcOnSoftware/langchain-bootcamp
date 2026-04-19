import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-agents-tools/03-multi-tool-recovery", () => {
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
    // If the broken tool's exception leaked out of the agent the harness
    // would throw here — so "did not throw" is itself a signal of recovery.
    result = await runUserCode(EXERCISE_FILE);
  });

  test("runUserCode did not throw (agent recovered from the failing tool)", () => {
    expect(result).toBeDefined();
    expect(Array.isArray(result.calls)).toBe(true);
  });

  test("agent loop made at least two model calls", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("userReturn.answer is a non-empty string", () => {
    const ret = result.userReturn as { answer?: unknown };
    expect(typeof ret.answer).toBe("string");
    expect(String(ret.answer).length).toBeGreaterThan(0);
  });

  test("userReturn.errorSeen is true — the broken tool was actually invoked", () => {
    const ret = result.userReturn as { errorSeen?: unknown };
    expect(ret.errorSeen).toBe(true);
  });
});

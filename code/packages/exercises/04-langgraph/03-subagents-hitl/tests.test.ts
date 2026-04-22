import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-langgraph/03-subagents-hitl", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    // No live API required — this exercise is pure graph plumbing.
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("no chat model calls (this exercise is pure graph plumbing)", () => {
    expect(result.calls).toHaveLength(0);
  });

  test("first invoke triggered an interrupt", () => {
    const r = result.userReturn as { interrupted: boolean };
    expect(r.interrupted).toBe(true);
  });

  test("second invoke (via Command({resume})) completed the graph", () => {
    const r = result.userReturn as { resumed: boolean };
    expect(r.resumed).toBe(true);
  });

  test("final state carries the plan, approval, and result", () => {
    const r = result.userReturn as {
      final: { plan?: string; approval?: string; result?: string };
    };
    expect(typeof r.final.plan).toBe("string");
    expect((r.final.plan ?? "").length).toBeGreaterThan(0);
    expect(r.final.approval).toBe("approved");
    expect((r.final.result ?? "").length).toBeGreaterThan(0);
  });
});

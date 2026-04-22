import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-langgraph/05-checkpoint-resume", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    // No live API required — pure graph checkpoint/resume semantics.
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("no chat model calls (this exercise is pure graph plumbing)", () => {
    expect(result.calls).toHaveLength(0);
  });

  test("preResumeNext has at least one pending node (graph is paused)", () => {
    const r = result.userReturn as { preResumeNext: string[] };
    expect(r.preResumeNext.length).toBeGreaterThanOrEqual(1);
  });

  test("postResumeNext is empty (graph completed after resume)", () => {
    const r = result.userReturn as { postResumeNext: string[] };
    expect(r.postResumeNext.length).toBe(0);
  });

  test("resumedWith matches the Command({ resume }) value", () => {
    const r = result.userReturn as { resumedWith: string };
    expect(r.resumedWith).toBe("go");
  });

  test("final state carries prepared=true, approval='go', finalized=true", () => {
    const r = result.userReturn as {
      final: { prepared?: boolean; approval?: string; finalized?: boolean };
    };
    expect(r.final.prepared).toBe(true);
    expect(r.final.approval).toBe("go");
    expect(r.final.finalized).toBe(true);
  });
});

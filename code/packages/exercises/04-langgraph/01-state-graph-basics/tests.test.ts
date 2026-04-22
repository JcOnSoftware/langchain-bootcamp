import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-langgraph/01-state-graph-basics", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("no chat model calls (this exercise has no LLM)", () => {
    expect(result.calls).toHaveLength(0);
  });

  test("final.counter is 15 (reducer summed n1 + n2 contributions)", () => {
    const final = result.userReturn as { final: { counter: number } };
    expect(final.final.counter).toBe(15);
  });

  test("final.log has 2 entries (reducer concatenated both nodes)", () => {
    const final = result.userReturn as { final: { log: string[] } };
    expect(final.final.log).toHaveLength(2);
  });

  test("nodesVisited is ['n1', 'n2'] in order", () => {
    const r = result.userReturn as { nodesVisited: string[] };
    expect(r.nodesVisited).toEqual(["n1", "n2"]);
  });
});

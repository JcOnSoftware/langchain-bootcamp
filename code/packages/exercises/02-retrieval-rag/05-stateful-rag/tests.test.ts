import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-retrieval-rag/05-stateful-rag", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const providerKey =
      provider === "anthropic" ? "ANTHROPIC_API_KEY"
      : provider === "openai" ? "OPENAI_API_KEY"
      : "GEMINI_API_KEY";
    if (!process.env[providerKey]) {
      throw new Error(`${providerKey} not set — this exercise hits the real API.`);
    }
    if (provider === "anthropic" && !process.env["OPENAI_API_KEY"]) {
      throw new Error(
        "OPENAI_API_KEY not set — Anthropic has no native embeddings, so OpenAI is required as a fallback.",
      );
    }
    result = await runUserCode(EXERCISE_FILE);
  });

  test("makes exactly two chat model calls (one per turn)", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("both turns use the configured provider", () => {
    const provider = process.env["LCDEV_PROVIDER"] ?? "anthropic";
    const expected =
      provider === "anthropic" ? /claude-/
      : provider === "openai" ? /gpt-/
      : /gemini-/;
    for (const call of result.calls) {
      expect(call.response.model ?? "").toMatch(expected);
    }
  });

  test("returns a { turn1, turn2 } object with non-empty strings", () => {
    const ret = result.userReturn as { turn1?: unknown; turn2?: unknown };
    expect(typeof ret.turn1).toBe("string");
    expect(typeof ret.turn2).toBe("string");
    expect((ret.turn1 as string).length).toBeGreaterThan(0);
    expect((ret.turn2 as string).length).toBeGreaterThan(0);
  });
});

import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// This exercise is Anthropic-only: extended thinking is not supported by OpenAI or Gemini.
const skipIfNotAnthropic = process.env["LCDEV_PROVIDER"] !== "anthropic"
  && process.env["LCDEV_PROVIDER"] !== undefined;

describe("05-advanced-patterns/04-extended-thinking", () => {
  let result: HarnessResult;

  // Extended thinking can be slower than standard inference — allow up to 60 s.
  beforeAll(async () => {
    if (skipIfNotAnthropic) return;
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — this exercise requires the Anthropic provider.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 60_000);

  test.skipIf(skipIfNotAnthropic)(
    "at least one chat model call captured",
    () => {
      expect(result.calls.length).toBeGreaterThanOrEqual(1);
    },
  );

  test.skipIf(skipIfNotAnthropic)(
    "model id is a non-empty string",
    () => {
      const call = result.calls[0];
      expect(call).toBeDefined();
      expect(typeof call!.model).toBe("string");
      expect(call!.model.length).toBeGreaterThan(0);
    },
  );

  test.skipIf(skipIfNotAnthropic)(
    "hasThinking is true",
    () => {
      const r = result.userReturn as {
        content: Array<{ type: string }>;
        hasThinking: boolean;
        hasText: boolean;
      };
      expect(r.hasThinking).toBe(true);
    },
  );

  test.skipIf(skipIfNotAnthropic)(
    "hasText is true",
    () => {
      const r = result.userReturn as {
        content: Array<{ type: string }>;
        hasThinking: boolean;
        hasText: boolean;
      };
      expect(r.hasText).toBe(true);
    },
  );

  test.skipIf(skipIfNotAnthropic)(
    "content array contains at least one thinking block and one text block",
    () => {
      const r = result.userReturn as {
        content: Array<{ type: string }>;
        hasThinking: boolean;
        hasText: boolean;
      };
      expect(Array.isArray(r.content)).toBe(true);
      const blocks = r.content;
      expect(blocks.some((b) => b.type === "thinking")).toBe(true);
      expect(blocks.some((b) => b.type === "text")).toBe(true);
    },
  );
});

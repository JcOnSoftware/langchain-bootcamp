import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@lcdev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("06-observability/04-debug-chains", () => {
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

  test("eventTypes is a non-empty array of strings", () => {
    const r = result.userReturn as {
      eventTypes: string[];
      handlerEvents: Array<{ type: string; runId?: string }>;
    };
    expect(Array.isArray(r.eventTypes)).toBe(true);
    expect(r.eventTypes.length).toBeGreaterThan(0);
    for (const evt of r.eventTypes) {
      expect(typeof evt).toBe("string");
    }
  });

  test("eventTypes includes a model-start event (on_chat_model_start or on_llm_start)", () => {
    const r = result.userReturn as { eventTypes: string[] };
    const hasStart =
      r.eventTypes.includes("on_chat_model_start") || r.eventTypes.includes("on_llm_start");
    expect(hasStart).toBe(true);
  });

  test("eventTypes includes a model-end event (on_chat_model_end or on_llm_end)", () => {
    const r = result.userReturn as { eventTypes: string[] };
    const hasEnd =
      r.eventTypes.includes("on_chat_model_end") || r.eventTypes.includes("on_llm_end");
    expect(hasEnd).toBe(true);
  });

  test("handlerEvents has at least 2 entries", () => {
    const r = result.userReturn as {
      handlerEvents: Array<{ type: string; runId?: string }>;
    };
    expect(Array.isArray(r.handlerEvents)).toBe(true);
    expect(r.handlerEvents.length).toBeGreaterThanOrEqual(2);
  });

  test("each handlerEvent has a type string", () => {
    const r = result.userReturn as {
      handlerEvents: Array<{ type: string; runId?: string }>;
    };
    for (const evt of r.handlerEvents) {
      expect(typeof evt.type).toBe("string");
      expect(evt.type.length).toBeGreaterThan(0);
    }
  });
});

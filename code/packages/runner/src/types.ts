import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type ExerciseTarget = "starter" | "solution";

export interface RunOptions {
  entry?: string;
  onStreamEvent?: (event: unknown) => void;
}

export class HarnessError extends Error {
  override name = "HarnessError";
}

export function resolveExerciseFile(
  importMetaUrl: string,
  override?: ExerciseTarget,
): string {
  const target = override ?? (process.env["LCDEV_TARGET"] as ExerciseTarget | undefined) ?? "starter";
  if (target !== "starter" && target !== "solution") {
    throw new HarnessError(
      `Invalid LCDEV_TARGET '${target}'. Must be 'starter' or 'solution'.`,
    );
  }
  const testDir = dirname(fileURLToPath(importMetaUrl));
  return resolve(testDir, `${target}.ts`);
}

/**
 * A single chat-model interaction captured by the LangChain harness.
 *
 * Populated from `AIMessage.usage_metadata`, `.tool_calls`, `.response_metadata`,
 * and the concrete chat model's `_llmType()`. Kept deliberately flat (not a
 * raw `AIMessage`) so render/cost modules can read canonical fields without
 * depending on `@langchain/core` types.
 */
export interface CapturedCallLangChain {
  model: string;
  input: unknown;
  response: {
    model: string;
    content: unknown;
    usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens?: number;
      [k: string]: unknown;
    };
    tool_calls?: unknown[];
    response_metadata?: Record<string, unknown>;
    [k: string]: unknown;
  };
  run_id?: string;
  durationMs: number;
  streamed: boolean;
}

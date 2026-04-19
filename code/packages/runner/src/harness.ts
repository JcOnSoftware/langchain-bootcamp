import { HarnessError, type RunOptions } from "./types.ts";

export interface CapturedCall {
  request: unknown;
  response: {
    model?: string;
    usage: { input_tokens: number; output_tokens: number; [k: string]: unknown };
    [k: string]: unknown;
  };
  durationMs: number;
  streamed: boolean;
}

export interface HarnessResult {
  calls: CapturedCall[];
  lastCall: CapturedCall | undefined;
  userReturn: unknown;
}

export async function runUserCode(
  _filePath: string,
  _options: RunOptions = {},
): Promise<HarnessResult> {
  throw new HarnessError(
    "runUserCode not implemented yet — landing in Fase 2 (LangChain harness).",
  );
}

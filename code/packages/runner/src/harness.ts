/**
 * Harness entry point.
 *
 * Applies the LangChain prototype patch, imports the user exercise module,
 * invokes its default export, and returns the captured chat-model calls.
 *
 * See `harness-langchain.ts` for the prototype-patch details.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { patchBaseChatModel } from "./harness-langchain.ts";
import { HarnessError, type RunOptions, type CapturedCallLangChain } from "./types.ts";

export type CapturedCall = CapturedCallLangChain;

export interface HarnessResult {
  calls: CapturedCall[];
  lastCall: CapturedCall | undefined;
  userReturn: unknown;
}

export async function runUserCode(
  filePath: string,
  options: RunOptions = {},
): Promise<HarnessResult> {
  const calls: CapturedCall[] = [];
  const restore = patchBaseChatModel(calls);

  try {
    const absolutePath = resolve(filePath);
    const moduleUrl = `${pathToFileURL(absolutePath).href}?t=${Date.now()}`;
    const mod = (await import(moduleUrl)) as Record<string, unknown>;

    const entryName = options.entry ?? "default";
    const entry = mod[entryName];
    if (typeof entry !== "function") {
      throw new HarnessError(
        `Exercise at ${filePath} must export ${
          entryName === "default" ? "a default async function" : `function '${entryName}'`
        }, got ${typeof entry}.`,
      );
    }

    const userReturn = await (entry as () => unknown | Promise<unknown>)();

    return {
      calls,
      lastCall: calls[calls.length - 1],
      userReturn,
    };
  } finally {
    restore();
  }
}

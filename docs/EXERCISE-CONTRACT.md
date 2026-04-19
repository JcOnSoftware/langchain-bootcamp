# Exercise contract

Every exercise under `code/packages/exercises/<track>/<id>/` MUST follow this contract. Contributors: a PR that doesn't meet it will not merge.

This document is the LangChain-flavored adaptation of the sibling contract in `ai-dev-bootcamp`. The mental model is the same — the critical difference is that our assertions target **LangChain-level** signals (intercepted via the harness's `BaseChatModel` prototype patch), NOT raw provider-SDK payloads.

## Required files

Each exercise directory contains exactly these files:

| Path | Purpose |
|---|---|
| `<locale>/exercise.md` | Locale-scoped learner-facing problem statement. At minimum `es/exercise.md` AND `en/exercise.md` MUST exist. Each declared locale gets its own subdir. |
| `starter.ts` | TODO-template code the learner edits. Exports `default async function run()`. Locale-neutral. |
| `solution.ts` | Working reference implementation. Same signature as `starter.ts`. Locale-neutral. |
| `tests.test.ts` | Assertions run by `lcdev verify`. Uses `@lcdev/runner`. |
| `meta.json` | Machine-readable metadata (see schema). |

Example directory layout:

```
01-hello-chain/
├── es/
│   └── exercise.md        ← Spanish problem statement (required)
├── en/
│   └── exercise.md        ← English problem statement (required)
├── starter.ts
├── solution.ts
├── tests.test.ts
└── meta.json
```

Root-level `exercise.md` MUST NOT exist. The CLI walks `{id}/{locale}/exercise.md` — a root-level `exercise.md` is rejected in CI.

The `.test.ts` suffix is required — Bun's test discovery depends on it.

## `exercise.md` required sections

Each `<locale>/exercise.md` MUST contain these sections. Section order MUST match across locales; heading text may be translated but semantics MUST NOT change.

1. **`# NN · <title>`** — H1 title matching `meta.json.title`.
2. **`## Objetivo` / `## Goal`** — What the learner will build, in 2-4 sentences.
3. **`## Contexto` / `## Context`** — Concepts the learner needs to understand BEFORE touching code. No inline code required.
4. **`## Qué tienes que completar` / `## What to complete`** — Step-by-step of what to implement in `starter.ts`.
5. **`## Cómo verificar` / `## How to verify`** — Concrete `lcdev` commands (`verify`, `verify --solution`, `run --solution`).
6. **`## Criterio de éxito` / `## Success criteria`** — Bullet list of what the tests check. Expressed as properties, not code.
7. **`## Pista` / `## Hint`** — Small code snippet or pattern that unblocks a stuck learner.

## Spanish tone: peruano neutro with tuteo

Every `es/exercise.md` MUST be written in **Peruvian neutral Spanish with tuteo**. Allowed forms: `tú`, `tienes`, `puedes`, `quieres`, `ejecuta`, `prueba`, `verifica`, `sabes`, `ponte`, `arranca`. Banned forms (voseo): `querés`, `tenés`, `podés`, `sabés`, `pegá`, `corré`, `elegí`, `probá`, `verificá`, `dale`, `ponete`, `empezá`.

Peruvian slang (`pata`, `causa`, `chamba`, `al toque`) is banned in docs and commits. Pan-Latin warm words (`bueno`, `genial`, `enseguida`) are fine.

A grep gate enforces this:

```bash
rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete|empezá|cancelá)\b' code/packages/exercises/
```

Must return zero hits before a PR merges.

## `starter.ts` requirements

- First non-empty lines: a `// Docs:` comment block with canonical LangChain URLs. Format:
  ```ts
  // Docs:
  //   LCEL fundamentals — https://docs.langchain.com/oss/javascript/langchain/lcel
  //   RunnableSequence — https://docs.langchain.com/oss/javascript/langchain/runnables
  //   ChatPromptTemplate — https://docs.langchain.com/oss/javascript/langchain/prompts
  ```
  Rationale: the learner edits in an IDE — doc links must be visible without tab-switching.
- Must `import { createChatModel, type ChatModelProvider } from "@lcdev/runner"` and resolve the provider via `process.env["LCDEV_PROVIDER"]`, mapping to the right `{X}_API_KEY` env.
- Must export `default async function run()` returning the exercise's declared output type.
- TODOs must be concrete and actionable, not vague (`// TODO: do the thing` is NOT acceptable).
- `starter.ts` MUST typecheck with `bunx tsc --noEmit` even when the learner hasn't filled in the TODOs. Use `void` statements on unused imports if needed.

## `solution.ts` requirements

- Same signature and imports as `starter.ts`.
- Idiomatic, minimal working implementation. No clever tricks — this is the reference the learner peeks at when stuck.
- Must pass all assertions in `tests.test.ts` when run with `LCDEV_TARGET=solution`.

## `tests.test.ts` requirements

- Imports from `@lcdev/runner`: `runUserCode`, `resolveExerciseFile`, `type HarnessResult`.
- Uses `resolveExerciseFile(import.meta.url)` — never hardcodes `./starter.ts`. This is how `LCDEV_TARGET=solution` works.
- Guards on the provider's API key in `beforeAll`, throwing a clear error if missing.
- Asserts on **SHAPE** (call count, model id, token usage, userReturn type), NOT on literal LLM text.
- Prefer `toMatch(/regex/)` over exact string equality. Prefer `.toBeGreaterThan(0)` over exact token counts.

### `LCDEV_TARGET` contract

```ts
// In tests.test.ts — always use the helper, never hardcode.
const EXERCISE_FILE = resolveExerciseFile(import.meta.url);
```

`resolveExerciseFile` looks at the calling test file's directory and returns either:
- `{exercise-dir}/starter.ts` when `LCDEV_TARGET` is unset or `"starter"`
- `{exercise-dir}/solution.ts` when `LCDEV_TARGET=solution`

This keeps the same test file honest for both targets.

### Harness capture shape

The harness patches `BaseChatModel._generate` and `._streamResponseChunks` on the prototype. Every model call within `runUserCode` is intercepted and recorded as:

```ts
interface CapturedCallLangChain {
  model: string;                      // provider's _llmType(), e.g. "anthropic"
  input: unknown;                     // raw input passed to model.invoke
  response: {
    model: string;                    // model id from response metadata (e.g. "claude-haiku-4-5")
    content: unknown;                 // AIMessage.content
    usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens?: number;
    };
    tool_calls?: unknown[];
    response_metadata?: Record<string, unknown>;
  };
  run_id?: string;
  durationMs: number;
  streamed: boolean;
}

interface HarnessResult {
  calls: CapturedCallLangChain[];
  lastCall: CapturedCallLangChain | undefined;
  userReturn: unknown;
}
```

## Assert-on-SHAPE discipline

Good and bad examples side by side:

**Good — structural:**
```ts
test("makes exactly one model call", () => {
  expect(result.calls).toHaveLength(1);
});

test("model id matches the configured provider", () => {
  expect(result.lastCall?.response.model ?? "").toMatch(/claude-/);
});

test("reports positive token usage", () => {
  const usage = result.lastCall?.response.usage;
  expect(usage?.input_tokens ?? 0).toBeGreaterThan(0);
  expect(usage?.output_tokens ?? 0).toBeGreaterThan(0);
});

test("returns a non-empty string", () => {
  expect(typeof result.userReturn).toBe("string");
  expect(String(result.userReturn).length).toBeGreaterThan(0);
});
```

**Bad — content-dependent (flaky, will break on provider drift):**
```ts
// DO NOT DO THIS
expect(result.userReturn).toBe("LCEL stands for LangChain Expression Language.");
expect(result.lastCall?.response.content).toContain("LangChain");
expect(result.lastCall?.response.usage.input_tokens).toBe(42);
```

Why: LLM output is non-deterministic by design. Temperature, version drift, provider updates, and regional model differences all shift the exact text. Tests that pin on text are false-failure factories.

### Tool-calling exercises

When an exercise binds tools:

```ts
test("binds the expected tools", () => {
  expect(result.lastCall?.response.tool_calls).toBeDefined();
  const calls = result.lastCall?.response.tool_calls as Array<{ name: string }>;
  expect(calls.map((c) => c.name)).toContain("get_weather");
});
```

Never assert on the exact argument values the model chose — assert on the shape of the call (name, required keys).

## `meta.json` schema

```json
{
  "id": "<kebab-case id matching directory name>",
  "track": "<track slug, e.g. 01-composition>",
  "title": "<human-readable title matching exercise.md H1>",
  "version": "<semver>",
  "valid_until": "<YYYY-MM-DD — when content may need review>",
  "concepts": ["<tag>", "<tag>"],
  "estimated_minutes": 10,
  "requires": ["<other exercise id>"],
  "model_cost_hint": "<optional: '~$X per verify run'>",
  "locales": ["es", "en"]
}
```

Every field is declared in `ExerciseMeta` in `code/packages/cli/src/exercises.ts`. Rules:

- `id` MUST equal the directory name.
- `track` MUST equal the parent directory name.
- `title` MUST match the H1 of every locale's `exercise.md`.
- `valid_until` default: 6 months from creation. The weekly CI health-check warns when this date approaches.
- Bump `version` major when the concept being taught changes — this resets learner progress for that exercise.
- `concepts` is a flat tag list (lowercase, kebab-case).
- `requires` is a list of other exercise ids that should be completed first.
- `model_cost_hint` is optional but recommended for anything beyond a single short call.
- `locales` is REQUIRED, non-empty, and every declared locale must map to an existing `<locale>/exercise.md`. Conversely, every `<locale>/` subdir must be declared in `locales`. Supported values: `"es"`, `"en"`. Any other value is a contract violation.
- Both `"es"` and `"en"` are required for all exercises (repo is public).

## Cost discipline

- Default models in solutions: Haiku / GPT-4o-mini / Gemini Flash.
- If an exercise MUST use a larger model, justify it in `meta.json.model_cost_hint` and the exercise rationale.
- Total v0.1 bootcamp target: under ~$3 to complete end-to-end for a learner across all 30 exercises.

## Playground (informational)

Exercises can be executed for inspection (not validated) via `lcdev run <id> [--solution] [--stream-live]`. Return shapes that are plain objects with labeled fields (like `{ short, long }`) render more cleanly than deep nested structures.

## Review checklist (for contributors)

Before opening a PR:

- [ ] `starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json` present at exercise root.
- [ ] `meta.json.locales` declares every present `<locale>/` subdir, and vice-versa (no undeclared dirs, no declared-but-missing dirs).
- [ ] Every declared locale has a complete `<locale>/exercise.md` with the 7 required sections in order.
- [ ] `es/exercise.md` uses peruano neutro + tuteo. The voseo grep returns zero hits.
- [ ] `en/exercise.md` is present and complete.
- [ ] `starter.ts` has the `// Docs:` comment header with canonical LangChain URLs.
- [ ] All doc URLs resolve (canonical, no redirects).
- [ ] `lcdev verify <id>` fails on `starter.ts` with a clean error.
- [ ] `LCDEV_TARGET=solution lcdev verify <id>` passes all tests.
- [ ] `bunx tsc --noEmit` passes from `code/`.
- [ ] `meta.json.id` matches directory; `meta.json.track` matches parent.
- [ ] Tests assert on SHAPE, never on LLM text content.

## Embeddings capture gap (v0.1)

The harness patches `BaseChatModel._generate` and `._streamResponseChunks` on the prototype. That surface catches every chat-model invocation but DOES NOT cover `Embeddings.prototype.embedDocuments` or `Embeddings.prototype.embedQuery`. In RAG exercises the retrieval step (embedding the query, embedding the corpus) therefore runs under the harness WITHOUT being recorded in `result.calls`.

Test-writing implication:

- `result.calls.length` counts chat-model calls only. For a pure retrieval exercise (exercises 01, 02, 04 in track `02-retrieval-rag`) the correct assertion is `expect(result.calls).toHaveLength(0)`.
- For a RAG exercise with one generation step (exercise 03) the correct assertion is `expect(result.calls).toHaveLength(1)`.
- Never assert on "embedding calls made" — that signal is not captured in v0.1.

This gap is intentional for v0.1: a single surface (`BaseChatModel`) keeps the harness simple and keeps exercise tests deterministic. The natural home for embeddings cost/latency visibility is track `06-observability`, where dedicated exercises will add opt-in capture via callbacks.

## Corpus fixtures

Starting with Fase 4 (track `02-retrieval-rag`), the convention is **inline-corpus-per-exercise**: every exercise ships its own `const CORPUS = [...]` at the top of `starter.ts` / `solution.ts`. No shared fixtures directory, no loaders from disk.

Why:

- **Self-contained files**: the learner reads the full pipeline (corpus → chain) in one place, without tab-switching.
- **Readable diffs**: version-control shows exactly how the corpus changed when an exercise evolves.
- **No import path gymnastics**: the 6-file template stays minimal — meta, solution, starter, tests, and two locale docs.

What NOT to do:

- Do NOT create a `packages/exercises/_fixtures/` directory for cross-exercise corpora.
- Do NOT load corpora from external `.json` / `.txt` files under the exercise directory.
- Do NOT import a corpus from a sibling exercise — copy it instead, even at the cost of duplication. Each exercise must stand on its own.

If a future track needs genuinely large corpora (hundreds of docs), that's a separate architectural decision — raise it via `/sdd-new`, do not set the precedent silently.

## Agents & tool-call assertions

Starting with Fase 5 (track `03-agents-tools`), exercises invoke agent loops that call the model multiple times per run. The harness's `BaseChatModel.invoke` patch automatically captures `AIMessage.tool_calls` on every intercepted call — `result.calls[i].response.tool_calls` is populated whenever the model decided to call tools. No extra wiring, no callbacks.

Two rules for tool-call assertions:

1. **Assert on tool NAME, never on ARG VALUES.** The model chooses arg shapes non-deterministically (e.g. `"Lima"` vs `"Lima, Peru"` vs `"lima"`), so pinning them is a false-failure factory. Names are part of the tool contract and stable:
   ```ts
   // Good
   expect(toolCalls[0]?.name).toBe("get_weather");

   // Bad — flaky
   expect(toolCalls[0]?.args).toEqual({ city: "Lima" });
   ```
2. **Use lower-bound `calls.length >= N` for agent loops.** A ReAct agent with a small model may iterate more than the reference solution did — asserting `=== 2` breaks on model drift. If the shape matters, assert ranges or filter by `response.tool_calls?.length >= 1`:
   ```ts
   const withTools = result.calls.filter((c) => (c.response.tool_calls ?? []).length >= 1);
   expect(withTools.length).toBeGreaterThanOrEqual(1);
   ```

Exception: exercises that do NOT run an agent loop (e.g. `01-bind-tools`, which calls `bound.invoke` once) can legitimately use `expect(result.calls).toHaveLength(1)`.

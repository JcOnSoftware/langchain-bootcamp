# Exploration: fase-3-composition (LCEL track 01 — 5 exercises)

## Current State

**Runner harness** (commit `2348c33`) patches `BaseChatModel.prototype.invoke` and `._streamIterator`. Confirmed by reading `@langchain/core@1.1.40`:
- `RunnableSequence.invoke` (base.js line 931-933) iterates `step.invoke(...)` for each step → model's patched `invoke` is hit for every LCEL pipe like `prompt | model | parser`.
- `Runnable.batch` default (base.js line 96) fans out to per-item `invoke()` → patch captures each item.
- `Runnable._streamIterator` (base.js line 110) defaults to `yield this.invoke(...)`. Sequence override calls each step; when the step is a chat model, either `invoke` (patched) or `_streamIterator` (patched) runs.

**Conclusion**: the harness has **no capture gap** for LCEL composition use cases — no work needed at the runner layer for Fase 3.

**CLI layer** (commit `40f8765`) is fully provisioned: `init`, `list`, `verify`, `run`, `progress`, `open`, `next` all work against the unified exercise layout `packages/exercises/{track}/{exercise}/...`.

**Exercise package** is empty — `packages/exercises/package.json` exists but no track directories.

**Integration tests**: `cli.integration.test.ts` has 7 failures because it expects `01-first-call` (a name carried over from the sibling). PLAN.md specifies `01-hello-chain` as Fase 3's first exercise — these tests need renaming, not a new exercise id.

**Render gap**: `render.ts` has shape detectors for Anthropic `Message`, OpenAI `ChatCompletion`, Gemini `GenerateContentResponse`. None match a LangChain `AIMessage`. When a user exercise returns an AIMessage (the default LCEL shape), the fallback JSON.stringify path prints the full AIMessage object — correct but ugly.

## Affected Areas

- `code/packages/exercises/01-composition/{01-05}/` — 5 new exercise directories (currently don't exist).
- `code/packages/exercises/package.json` — already scoped with LangChain deps (from Fase 1); no changes needed.
- `code/packages/cli/src/render.ts` — add an `isAIMessage` branch that extracts `.content` string for readable output.
- `code/packages/cli/src/commands/cli.integration.test.ts` — rename `01-first-call` → `01-hello-chain` in 7 assertions.
- `code/packages/runner/` — **NO changes** (harness confirmed sufficient).
- `code/packages/cli/src/i18n/{en,es}.json` — may need new keys for composition-specific error messages; TBD during apply.
- `docs/EXERCISE-CONTRACT.md` — port from sibling with LangChain-level assert examples (optional but valuable; PLAN.md allows either Fase 1 or Fase 3).

## Approaches

### 1. Exercise Lineup (the 5 exercises)

Locked-in proposal based on PLAN.md track-01 description ("LCEL: prompt | model | parser, chains secuenciales, branching, custom runnables, .batch()") and progression pedagogy:

| # | Id | Focus | Key LangChain API |
|---|---|---|---|
| 1 | `01-hello-chain` | First pipe: `prompt \| model \| parser` | `ChatPromptTemplate`, `StringOutputParser`, `.pipe()` |
| 2 | `02-sequential` | Chain of two stages: extractor → summarizer | Two pipes connected by pure-function step |
| 3 | `03-branch` | Conditional routing by input shape | `RunnableBranch` or ternary routing with `RunnableLambda` |
| 4 | `04-custom-runnable` | Inject a transformation between model and parser | `RunnableLambda`, `.pipe()` composition |
| 5 | `05-batch` | Process a list of inputs in parallel | `chain.batch([...])` with `maxConcurrency` |

**Effort: Medium** — each exercise = 5 files (`meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `es/exercise.md`, `en/exercise.md`) = **30 files**. Each solution is ~20-40 lines. Each tests file asserts on captured calls from the harness.

### 2. Docs URL Anchoring

LangChain 1.0 canonical docs live under `https://docs.langchain.com/oss/javascript/langchain/...`. For each starter `// Docs:` header, anchor to the most specific relevant page:

- LCEL fundamentals → `/oss/javascript/langchain/lcel`
- RunnableSequence → `/oss/javascript/langchain/runnables/sequence`
- RunnableBranch → `/oss/javascript/langchain/runnables/branch`
- RunnableLambda → `/oss/javascript/langchain/runnables/lambda`
- batch() → `/oss/javascript/langchain/runnables/interface#batch`
- OutputParsers → `/oss/javascript/langchain/output_parsers`

**Approach A (preferred)**: use the paths above as the canonical anchors. They follow LangChain's current v1 URL scheme. If a path 404s during apply, course-correct inline — docs URLs are non-critical (exercises work without them; they're reader aids).

**Approach B (rejected)**: web-verify every URL in exploration. Out of scope — exploration should be fast. Apply phase can validate if needed.

**Effort: Low** — one line per starter.

### 3. Integration Test Handling

**Option A (recommended)**: rename `01-first-call` → `01-hello-chain` in `cli.integration.test.ts` (7 occurrences). Test names follow the actual exercise.
- Pros: single source of truth; no alias magic; tests clearly name what they verify.
- Cons: none meaningful.

**Option B (rejected)**: add an id-alias table so `01-first-call` resolves to `01-hello-chain`.
- Pros: keeps test file untouched.
- Cons: invents permanent alias for a legacy name; test assertions still check exercise.md content which will differ; only pushes the rename downstream.

**Effort: Low** — 7 string replacements in one file.

### 4. Render: `isAIMessage` branch

**In scope for Fase 3**. Rationale: once exercises land, `lcdev run 01-hello-chain --solution` is the default way to see output. Without an `isAIMessage` branch, users see a giant JSON blob instead of the model's text. One-time cost, multi-exercise payoff.

Shape:
```ts
function isAIMessage(v: unknown): v is { content: string | unknown[]; response_metadata?: unknown } {
  return typeof v === "object" && v !== null
    && "content" in v
    && (v as { _getType?: () => string })._getType?.() === "ai";
}
```

And in `renderReturn`: check `isAIMessage(value)` first, extract `.content` (string OR first text block from array content). Keep existing SDK-shape branches as fallbacks — they still work for users who return raw SDK results.

**Effort: Low** — ~20 lines in `render.ts`, 2-3 unit tests.

### 5. Exercise Contract Doc

**Deferred** to a dedicated task in Fase 3's apply phase (not separate sub-phase). `docs/EXERCISE-CONTRACT.md` gets ported from sibling with LangChain-level assert examples once the first 1-2 exercises solidify the conventions.

## Recommendation

**Approach lineup** (Section 1) + docs anchoring (Section 2 Approach A) + test rename (Section 3 Option A) + render branch (Section 4) + deferred contract doc (Section 5).

Scope per SDD phase breakdown:
- **Propose**: lock the 5 exercise ids + scope affected packages.
- **Spec**: Given/When/Then per exercise (input shape, expected captured calls, expected `userReturn`); shared harness-assert scenarios.
- **Design**: exercise directory skeleton; `resolveExerciseFile` flow confirmation; `isAIMessage` render branch design.
- **Tasks**: hierarchical breakdown (infra: render branch + contract doc / per-exercise (×5): files + tests / fixups: integration tests / i18n keys if any).
- **Apply (TDD)**: RED (tests) → GREEN (solution) → REFACTOR per exercise; iterate until verify passes.
- **Verify**: `bun test` green end-to-end (including the 7 ex-failures); `bunx tsc --noEmit` clean; run `lcdev verify 01-hello-chain --solution` as smoke.
- **Archive**: merge delta specs → `openspec/specs/`; move folder; commit `feat(exercises): track 01-composition end-to-end (5 exercises)`.

## Risks

- **Live API expectations**: tests will hit the chosen provider (default Anthropic). CI weekly health-check must gate on ANTHROPIC_API_KEY. Apply phase decides whether Fase 3 tests skip-if-no-key vs fail-if-no-key; likely skip for unit-ish cases, fail for `verify` target (matches sibling pattern).
- **LangChain minor bumps during apply**: `@langchain/core@^1.1.0` accepts 1.1.x / 1.2.x. If a point release changes `usage_metadata` shape or adds deprecation noise, the harness capture could mis-populate `usage.total_tokens`. Mitigation: pin exact version in package.json if anything breaks.
- **Prompt drift**: model output variability. Asserts MUST be on call SHAPE (model name, tools bound, LCEL edges traversed), not text content. Confirmed in harness design; just needs discipline per exercise.
- **Peruano neutro tuteo**: `es/exercise.md` files are long-form Spanish prose. Risk of unnoticed voseo. Mitigation: add a grep check at verify time (`rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete)\b' code/packages/exercises/` must return zero).

## Ready for Proposal

**Yes**. The 5 exercises are locked, the harness has no capture gap, docs anchoring is a trivial per-file task, integration tests need a one-file rename, and render gets a small `isAIMessage` addition. Scope is clearly bounded and no blocking unknowns remain.

Orchestrator: next phase is `sdd-propose` with change-name `fase-3-composition`.

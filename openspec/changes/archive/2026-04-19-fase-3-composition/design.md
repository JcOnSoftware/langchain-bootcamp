# Design: Fase 3 — Track 01 Composition

## Technical Approach

Copy-and-evolve the sibling's exercise pattern, swapping SDK-specific assertions for LangChain-level ones. Each exercise lives under `packages/exercises/01-composition/{id}/` with the contract defined in `exercise-contract` spec. Tests assert on `CapturedCallLangChain` shape produced by the existing `BaseChatModel` prototype patch — the runner is untouched. Render gets a structural `isAIMessage` check so `lcdev run` prints readable text.

## Architecture Decisions

| Decision | Choice | Alternative | Rationale |
|---|---|---|---|
| Exercise layout | Per-exercise dir under track dir | Flat | Locales + multi-file contract need a dir |
| Chat model factory | `createChatModel(provider, apiKey, model?)` helper in `cli/src/provider/index.ts` | Per-exercise direct instantiation | Single place to pick `ChatAnthropic` / `ChatOpenAI` / `ChatGoogleGenerativeAI`; exercises import one name, stay provider-agnostic |
| Model defaults | Anthropic haiku, OpenAI gpt-4o-mini, Gemini 2.5-flash | Let exercises hardcode | Cheapest credible models by provider; Fase 3 estimates <$0.01 per verify run |
| isAIMessage detection | Structural (`_getType?.() === "ai"` + `content` field) | Import `AIMessage` from `@langchain/core` | CLI stays free of `@langchain/*` runtime deps; harness already isolates CLI from core |
| Integration tests | Rename `01-first-call` → `01-hello-chain` | Id alias table | Single source of truth; tests describe real exercise |
| Test key gating | `beforeAll` throws if `{provider}_API_KEY` missing | Skip tests silently | Loud fail-fast matches sibling; users run verify explicitly |
| Assert discipline | SHAPE-only (call count, model id, LCEL edges, userReturn keys) | Partial text matches | Model output drifts; shape is stable per spec |
| Voseo guard | `rg`-based grep in sdd-verify phase | Tooling in package scripts | Verify is the natural gate; no new runtime tooling needed |

## Data Flow

```
  Student code              Runner patch               Harness capture
  ─────────────             ─────────────              ───────────────
  chain = prompt            patchBaseChatModel         push to calls[]:
      .pipe(model)    ─→    intercepts model.invoke  ─→  { model, input,
      .pipe(parser)         (+ _streamIterator)            response, usage,
  await chain.invoke()      returns unchanged               tool_calls, ... }
                                                                │
  await run()  ─────────────────────────────────────────────────┘
  ↓
  userReturn + calls ──→ tests.test.ts shape asserts  (via runUserCode)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `code/packages/exercises/01-composition/01-hello-chain/{meta.json,starter.ts,solution.ts,tests.test.ts,es/exercise.md,en/exercise.md}` | Create | 6 files |
| `code/packages/exercises/01-composition/02-sequential/…` | Create | 6 files |
| `code/packages/exercises/01-composition/03-branch/…` | Create | 6 files |
| `code/packages/exercises/01-composition/04-custom-runnable/…` | Create | 6 files |
| `code/packages/exercises/01-composition/05-batch/…` | Create | 6 files |
| `code/packages/cli/src/provider/index.ts` | Modify | Add `createChatModel(provider, apiKey, opts?)` returning `BaseChatModel` |
| `code/packages/cli/src/render.ts` | Modify | Add `isAIMessage` + `extractAIText` + priority branch in `renderReturn` |
| `code/packages/cli/src/render.test.ts` | Modify | Add 3 cases (detect, extract, priority) |
| `code/packages/cli/src/commands/cli.integration.test.ts` | Modify | Rename `01-first-call` → `01-hello-chain` (7 spots) |
| `docs/EXERCISE-CONTRACT.md` | Create | LangChain-level assert examples |

## Interfaces / Contracts

```ts
// cli/src/provider/index.ts — new export
export function createChatModel(
  provider: SupportedProvider,
  apiKey: string,
  opts?: { model?: string; temperature?: number },
): BaseChatModel;
```

```ts
// cli/src/render.ts — new helpers
export function isAIMessage(v: unknown): v is AIMessageLike;
export function extractAIText(msg: AIMessageLike): string;

interface AIMessageLike {
  content: string | Array<{ type: string; text?: string }>;
  _getType?: () => string;
}
```

Exercises import model via factory:

```ts
// solution.ts (shape)
import { resolveExerciseFile } from "@lcdev/runner";
import { createChatModel } from "@lcdev/cli/provider";   // workspace path

export default async function run() {
  const model = createChatModel(
    (process.env["LCDEV_PROVIDER"] ?? "anthropic") as SupportedProvider,
    process.env["ANTHROPIC_API_KEY"]!,   // or OPENAI_API_KEY / GEMINI_API_KEY
  );
  // … LCEL chain here
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `isAIMessage`, `extractAIText`, `renderReturn` priority | `render.test.ts` with fake AIMessage objects; no real models |
| Unit | `createChatModel` returns correct concrete class | Dynamic check: `chat._llmType()` returns expected provider string |
| Integration | 5 exercises pass their own `tests.test.ts` via `runUserCode` | Real provider call gated by `{X}_API_KEY`; shape asserts only |
| Integration | `lcdev verify 01-hello-chain --solution` full CLI path | `cli.integration.test.ts` (7 renames land) |
| Verify-phase | No voseo in `es/` content | `rg -i` guard in sdd-verify |

## Migration / Rollout

No migration. First-time content. Each exercise is self-contained; revertable via `git rm -r` of its directory.

## Open Questions

- [ ] **CLI import from exercises**: importing `createChatModel` from `@lcdev/cli/provider` requires exposing that subpath. Alternative is to re-export from `@lcdev/runner`. Resolve during apply phase — if bun workspaces need an explicit subpath export in `cli/package.json`, add it; else export from runner. **Decision defers to apply**, no blocking concern.
- [ ] **Branch exercise input shape**: whether `03-branch` routes on message length, regex match, or a classifier call determines whether the chain has 1 or 2 model calls. Lock this in at apply — likely length-based (deterministic, no extra API cost).

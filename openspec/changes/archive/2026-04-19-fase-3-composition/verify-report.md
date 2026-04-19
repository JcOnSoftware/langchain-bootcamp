# Verify Report — fase-3-composition

**Date**: 2026-04-19
**Status**: PASS (with known API-key-gated skips)

## Spec Coverage

| Spec | Requirement | Verified by | Status |
|---|---|---|---|
| exercise-contract | File Layout | `lcdev list` shows 5 entries; all 30 files on disk | ✅ |
| exercise-contract | meta.json Fields | `exercises.test.ts` locales-required check | ✅ (existing) |
| exercise-contract | Target Resolution | `runUserCode` tests + `LCDEV_TARGET` plumbing | ✅ (existing) |
| exercise-contract | Locale Fallback | `exerciseDocPath` tests | ✅ (existing) |
| exercise-contract | Peruano Neutro Tuteo | `rg` voseo guard on `code/packages/exercises/` | ✅ zero hits |
| track-composition | Track Lineup | `lcdev list` es + en | ✅ 5 ordered entries both locales |
| track-composition | Default Export Signature | typecheck + starter/solution shape review | ✅ all 5 solutions export default async `run()` |
| track-composition | Captured Call Shape — Single | `01-hello-chain/tests.test.ts` + `02/03/04` asserts | ⏸ API-key-gated (tests throw if no key — by design) |
| track-composition | Captured Call Shape — Batch | `05-batch/tests.test.ts` asserts | ⏸ API-key-gated |
| track-composition | Assert-on-Shape Discipline | review of all 5 `tests.test.ts` — no `.toBe("literal text")` against model output | ✅ |
| render-ai-message | Structural Detection | `render.test.ts > isAIMessage` (3 cases) | ✅ |
| render-ai-message | Text Extraction | `render.test.ts > extractAIText` (2 cases) | ✅ |
| render-ai-message | Branch Priority | `render.test.ts > renderReturn > renders an AIMessage via extractAIText before SDK fallbacks` | ✅ |

## Commands Executed

```
bunx tsc --noEmit                                           → clean
bun test                                                    → 122 pass / 5 fail
bun run packages/cli/src/index.ts list --locale es          → 5 entries, tuteo hint
bun run packages/cli/src/index.ts list --locale en          → 5 entries, EN hint
rg -i '<voseo regex>' code/packages/exercises/              → zero hits
```

## Failures Analysis

The 5 test failures are all gated on a live API key (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`) and all fail at `beforeAll` with the message `{KEY}_API_KEY not set — this exercise hits the real API.` — **exactly the sibling's contract** and explicitly required by spec `track-composition > Captured Call Shape — Single Invocation` (the `GIVEN api-key-is-set` precondition).

Classification: **expected skip, not regression**.

The previously-broken 7 integration tests (that expected `01-first-call`) are now all passing post-rename.

## Findings / Risks

- **Deviation from design.md**: `createChatModel` was placed in `@lcdev/runner` (not `@lcdev/cli/provider` as design proposed). Reason: runner is already imported by both cli and exercises, avoids a back-import cycle, and makes runner the single model-plumbing authority. Design open-question #1 was thereby resolved. Runner now depends on `@langchain/anthropic`, `@langchain/openai`, `@langchain/google-genai` in addition to `@langchain/core`.
- **Starter shape nuance** (noted by apply subagent): `02-sequential` and `03-branch` starters include placeholder `RunnableSequence.from([...])` / `RunnableBranch.from([...])` calls with identity adapters or example default-branches, because the 3-element tuple signature in LangChain 1.1 rejects empty-call forms at compile time. Starters still have clear `// TODO:` markers, but they show scaffolding structure rather than blank slots.
- **Scope expansion during apply**: integration rename was spec'd as "7 spots in `cli.integration.test.ts`" — actual count was 4 in that file + 7 in `run.test.ts`. Apply subagent fixed both proactively. Engram `sdd/fase-3-composition/apply-progress/rename-scope` has the details.
- **Live-API verification still pending**: running `lcdev verify 01-hello-chain --solution` against a real provider is the final smoke that proves end-to-end. Not executed in this verify pass because no key is set in the current env. Recommended as a manual step by the user before final sign-off.

## Next Step

Ready for sdd-archive.

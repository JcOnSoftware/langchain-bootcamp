# Proposal: Fase 3 — Track 01 Composition (5 LCEL exercises end-to-end)

## Intent

Deliver PLAN.md Fase 3: the first learnable track in langchain-bootcamp. Users finishing the sibling's native-SDK curriculum arrive here to learn LangChain's composition layer — LCEL pipes, sequential chains, branching, custom runnables, batch. Without this track, the harness + CLI are plumbing with no payload.

## Scope

### In Scope
- `packages/exercises/01-composition/` with 5 exercises (`01-hello-chain`, `02-sequential`, `03-branch`, `04-custom-runnable`, `05-batch`).
- Each exercise: `meta.json` (`locales: ["es","en"]`), `starter.ts` (TODO template + `// Docs:` header), `solution.ts`, `tests.test.ts` (harness-level asserts), `es/exercise.md` + `en/exercise.md`.
- `render.ts`: add `isAIMessage` branch so `lcdev run` prints message `.content` not raw JSON blob.
- `cli.integration.test.ts`: rename `01-first-call` → `01-hello-chain` (7 spots).
- `docs/EXERCISE-CONTRACT.md` port + LangChain-level assert examples.

### Out of Scope
- Tracks 02–06 (Fases 4–8).
- LangSmith integration (deferred to track 06).
- Per-provider exercise variants — unified curriculum.

## Capabilities

### New Capabilities
- `exercise-contract`: file layout, required fields, `resolveExerciseFile` + `LCDEV_TARGET` flow, locale fallback, peruano-neutro-tuteo requirement for Spanish content.
- `track-composition`: the 5 LCEL exercises, their expected captured-call shape, and the skills each surfaces.
- `render-ai-message`: how `lcdev run` extracts printable text from an `AIMessage` without coupling render to `@langchain/core` types.

### Modified Capabilities
None — this is the first change; `openspec/specs/` was empty.

## Approach

Copy-and-evolve from the sibling's exercise pattern; ids/content are LangChain-native. Build exercises under TDD: author `tests.test.ts` + spec-shape assertions first, then `solution.ts` to make them pass, then `starter.ts` with the solution minus the student's TODO. `render.ts` gets a structural `isAIMessage` check (no LangChain import — detect via `_getType?.() === "ai"` + `content` field). Integration tests renamed, not aliased.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/exercises/01-composition/**` | New | 30 files (5 exercises × 6 files) |
| `code/packages/cli/src/render.ts` | Modified | `isAIMessage` branch + unit tests |
| `code/packages/cli/src/commands/cli.integration.test.ts` | Modified | 7 rename replacements |
| `docs/EXERCISE-CONTRACT.md` | New | Contract + LangChain assert examples |
| `code/packages/runner/` | Untouched | Harness already sufficient |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tests hit live API and flake on model output drift | Med | Assert on captured-call SHAPE (model, LCEL edges, tool bindings) — never on text |
| Voseo sneaks into `es/exercise.md` | Med | Verify-time `rg` guard fails the suite on voseo tokens |
| `@langchain/core` 1.x minor bump changes `usage_metadata` | Low | Pin exact version if it breaks; harness already normalizes |
| Live API keys absent in CI | Med | Tests skip-if-no-key for unit-ish cases; `lcdev verify` still fails fast |

## Rollback Plan

Each exercise is self-contained under its own directory. Revert per exercise by `git rm -r code/packages/exercises/01-composition/<id>/`. Render and integration-test changes are in separate commits — `git revert` the render/test commits independently. Harness is unchanged, so rollback never affects the runner.

## Dependencies

- `@langchain/core@^1.1.0`, `@langchain/anthropic@^1.0.0`, `@langchain/openai@^1.0.0`, `@langchain/google-genai@^1.0.0` — already in `packages/exercises/package.json`.
- Live API key for at least one provider to run `lcdev verify`.

## Success Criteria

- [ ] `bun test` → all tests pass (the 7 prior failures resolved via rename + new exercise).
- [ ] `bunx tsc --noEmit` clean across all packages.
- [ ] `lcdev list` shows `01-composition` track with 5 entries in both `--locale en` and `--locale es`.
- [ ] `lcdev verify 01-hello-chain --solution` → green against a real provider.
- [ ] `rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete)\b' code/packages/exercises/` → zero hits.
- [ ] `lcdev run 01-hello-chain --solution` prints the model's text content (not a JSON object).

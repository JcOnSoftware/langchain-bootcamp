# Contributing

Thanks for considering a contribution. The review bar is: **would a senior dev learn something solid and correct from this?** Keep that goal in mind.

## Setup

Requirements:
- [Bun](https://bun.com) 1.3+
- An API key for the provider you'll use to test (Anthropic, OpenAI, or Gemini)

```bash
gh repo clone JcOnSoftware/langchain-bootcamp
cd langchain-bootcamp/code
bun install
lcdev init    # pick provider + paste key → ~/.lcdev/config.json
```

> All `bun` / `bunx` commands MUST run from `code/` — not the repo root.

## Run tests

```bash
bunx tsc --noEmit                        # must exit 0
bun test packages/cli packages/runner    # unit tests (no API, no key needed)

# Integration tests (hit the real API):
LCDEV_TARGET=solution LCDEV_PROVIDER=anthropic bun test packages/exercises
LCDEV_TARGET=solution LCDEV_PROVIDER=openai    bun test packages/exercises
LCDEV_TARGET=solution LCDEV_PROVIDER=gemini    bun test packages/exercises
```

Running one provider's integration suite costs well under $0.01.

## CI

Two workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push/PR. Typecheck + `bun test packages/cli packages/runner` (no API key, no cost).
- **`health-check.yml`** — weekly (Monday 12:00 UTC) + manual dispatch. Full exercise suite against the real API with all 3 providers. Repo secrets required: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `LANGCHAIN_API_KEY` (optional — only needed for the LangSmith tracing exercise). Catches SDK drift or model changes before learners do.

## Adding an exercise

Exercises are the **primary contribution target**. Read **[`docs/EXERCISE-CONTRACT.md`](./docs/EXERCISE-CONTRACT.md)** first — it's the formal contract. Every new exercise must ship with:

- `starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json` at the exercise root
- `es/exercise.md` AND `en/exercise.md` (both required before merge)
- A `// Docs:` header in `starter.ts` with canonical LangChain URLs

**Before investing real time, open an issue** to align on scope and placement within the curriculum.

### Verify your exercise works

```bash
# Starter should fail (incomplete implementation):
LCDEV_TARGET=starter LCDEV_PROVIDER=anthropic bun test packages/exercises/<track>/<id>/

# Solution must pass:
LCDEV_TARGET=solution LCDEV_PROVIDER=anthropic bun test packages/exercises/<track>/<id>/
```

Both checks are required before opening a PR.

## Commit conventions

- **Conventional Commits only**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- **Never add `Co-Authored-By` or AI attribution** — agents are tools, not authors
- Commits should be atomic. Prefer small focused commits over one large one
- Never skip hooks (`--no-verify`) without explicit discussion in the PR

## Pull request checklist

Before opening a PR:

- [ ] `bunx tsc --noEmit` exits 0
- [ ] `bun test packages/cli packages/runner` is green
- [ ] For exercise PRs: starter fails, solution passes (with at least one real provider)
- [ ] Both `es/` and `en/` exercise.md are present for new exercises
- [ ] PR references a GitHub issue

## Questions

Open a [Discussion](https://github.com/JcOnSoftware/langchain-bootcamp/discussions) or an issue.

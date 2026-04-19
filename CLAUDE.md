# langchain-bootcamp — Project context

Read this file first when you start a session in this repo.

## What this is

Open source, rustlings-style CLI that teaches **LangChain (TypeScript)** to senior devs through **progressive exercises with automated tests against real APIs**. Sister repo to [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) (native SDKs bootcamp).

- **Target learner**: already knows at least one native LLM SDK; here to learn framework-level abstractions.
- **Scope**: 30 exercises across 6 tracks. Provider-agnostic curriculum; one provider chosen at `init`.
- **Providers at v0.1**: Anthropic + OpenAI + Gemini, via `ChatAnthropic` / `ChatOpenAI` / `ChatGoogleGenerativeAI` from LangChain.
- **Repo**: https://github.com/JcOnSoftware/langchain-bootcamp (will be PUBLIC after Fase 0.3).
- **License**: MIT.
- **Full plan**: see [`PLAN.md`](./PLAN.md) in repo root — authoritative plan with decisions, phases, and risks.

## Stack

- **Runtime**: Bun 1.3+
- **Language**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `allowImportingTsExtensions`)
- **Framework**: `@langchain/core@^1.1`, `@langchain/langgraph@^1`, plus provider packages (`@langchain/anthropic`, `@langchain/openai`, `@langchain/google-genai`)
- **CLI**: `commander` + `@clack/prompts` + `picocolors` (mirrors sibling)
- **Binary**: `lcdev` (NOT `aidev`); config at `~/.lcdev/` (NOT `~/.aidev/`)
- **Monorepo**: Bun workspaces (no Nx/Turbo — YAGNI)
- **Tests**: `bun:test`, convention `*.test.ts`

## Layout (target — bootstrap in progress)

```
langchain-bootcamp/
├── code/                           ← all source. RUN COMMANDS FROM HERE.
│   ├── package.json                # Bun workspaces root
│   ├── tsconfig.json
│   └── packages/
│       ├── runner/                 # @lcdev/runner — harness patches BaseChatModel prototype
│       │   └── src/
│       │       ├── harness.ts              # runUserCode wrapper
│       │       ├── harness-langchain.ts    # patch BaseChatModel._generate + _streamResponseChunks
│       │       └── types.ts                # CapturedCallLangChain, HarnessResult
│       ├── cli/                    # @lcdev/cli — `lcdev` binary
│       │   └── src/
│       │       ├── index.ts        # commander + preAction
│       │       ├── commands/       # init, list, verify, progress, open, next, run
│       │       ├── exercises.ts
│       │       ├── config.ts       # ~/.lcdev/
│       │       ├── provider/       # SupportedProvider = "anthropic" | "openai" | "gemini"
│       │       └── i18n/           # en.json (default) + es.json
│       └── exercises/              # @lcdev/exercises — 30 exercises across 6 tracks
│           ├── 01-composition/
│           ├── 02-retrieval-rag/
│           ├── 03-agents-tools/
│           ├── 04-langgraph/
│           ├── 05-advanced-patterns/
│           └── 06-observability/
├── docs/
│   └── EXERCISE-CONTRACT.md        # adapted from sibling — LangChain-level asserts
├── .github/workflows/              # PR CI + weekly health-check
├── PLAN.md                         # authoritative plan (read first)
├── README.md + README.es.md
└── LICENSE (MIT)
```

## Critical rules (non-negotiable)

1. **Run `bun`/`bunx` commands from `code/`** — not from the repo root.
2. **Modern CLI tools**: `bat`, `eza`, `fd`, `rg`, `sd` — NOT `cat`, `ls`, `find`, `grep`, `sed`.
3. **Commits**: conventional commits only. **NEVER** add `Co-Authored-By` or AI attribution.
4. **Never build after changes** — tests verify correctness. Typecheck with `bunx tsc --noEmit`.
5. **Never skip hooks** (`--no-verify`, `--amend` on published commits) unless the user explicitly asks.
6. **Destructive git ops** (`reset --hard`, `push --force`, `branch -D`) require explicit user approval.
7. **No Co-Authored-By / no AI attribution** on commits. Ever.

## Key decisions (see PLAN.md for rationale)

- **Copy-and-evolve** from sibling, NOT shared package. The sibling is not touched.
- **Unified curriculum** (one set of 30 exercises), NOT per-provider tracks — LangChain's value prop IS the abstraction.
- **3 providers from v0.1** (Anthropic + OpenAI + Gemini), chosen at `lcdev init`.
- **Harness**: patch `BaseChatModel._generate` and `._streamResponseChunks` on the prototype. Single surface vs three. NO LangSmith callbacks (extra key = fricción).
- **Version locks**: `@langchain/core@^1.1`, `@langchain/langgraph@^1`. LangChain 1.0 GA (Sept 2025) commits to no-breaking until v2.0.
- **i18n**: `en` (default) + `es` from day one.

## Execution phases (from PLAN.md)

- **Fase 0.3** — bootstrap repo (git init, `bun init`, configs, stub README, CLAUDE.md, LICENSE, .gitignore, first commit, `gh repo create`).
- **Fase 1** — CLI core copy-and-rename from sibling (aidev → lcdev, ~/.aidev/ → ~/.lcdev/).
- **Fase 2** — LangChain harness (`BaseChatModel` prototype patch).
- **Fase 3** — Track `01-composition` end-to-end (5 exercises).
- **Fase 4–8** — Tracks `02-retrieval-rag` through `06-observability` (one track per PR).
- **Fase 9** — Release v0.1.0.

## Exercise contract

Inherits from sibling with one key difference: asserts are **LangChain-level** (capture via `BaseChatModel` patch), NOT SDK-level.

Files at exercise root (one `exercise.md` per declared locale):

| File | Purpose |
|---|---|
| `<locale>/exercise.md` | Learner statement; `locales: ["es","en"]` at minimum. |
| `starter.ts` | TODO template. `// Docs:` header with canonical LangChain URLs. |
| `solution.ts` | Reference impl. Locale-neutral. |
| `tests.test.ts` | Uses `resolveExerciseFile(import.meta.url)` + `LCDEV_TARGET` env. |
| `meta.json` | `{ id, track, title, version, valid_until, concepts, estimated_minutes, requires, locales }` |

Adapted `EXERCISE-CONTRACT.md` lives in `docs/` (ported in Fase 1 or Fase 3).

## Harness contract (preview — implemented in Fase 2)

- Exercise exports `default async function run()` — harness imports + invokes.
- Harness patches `BaseChatModel._generate` and `._streamResponseChunks` on the prototype; restores in `finally`.
- Captures `CapturedCallLangChain { model, input, output, tool_calls, run_id }`.
- Tests assert on **structure** (model used, tools bound, LCEL shape, graph edges) — NOT on literal LLM text.
- `resolveExerciseFile(import.meta.url)` + `LCDEV_TARGET=starter|solution` switches target without file swaps.

## CLI (`lcdev`) — preview

```
lcdev init                           # provider + API key + locale → ~/.lcdev/config.json
lcdev list [--provider] [--locale]   # 30 exercises across 6 tracks
lcdev open [<id>] [--solution]       # open in editor
lcdev next                           # open first incomplete
lcdev verify <id> [--solution]       # run tests; record progress on pass
lcdev progress                       # dashboard
lcdev run <id> [--solution] [--stream-live]  # execute for inspection
```

Resolution: `--flag` → env var (`LCDEV_PROVIDER`, `LCDEV_LOCALE`) → `~/.lcdev/config.json` → defaults (`anthropic`, `en`).

## Persistence references

Engram is the memory backend. This repo uses project slug `langchain-bootcamp`.

| Topic key | Content |
|---|---|
| `langchain-bootcamp/overview` | Project overview |
| `langchain-bootcamp/plan` | Authoritative plan (mirror of PLAN.md) |
| `sdd-init/langchain-bootcamp` | SDD context once initialized |

Retrieve with `mem_search(query: "<topic>", project: "langchain-bootcamp")` → `mem_get_observation(id)`.

## When in doubt

- **Adding an exercise** → read `docs/EXERCISE-CONTRACT.md` (ported in Fase 1 or Fase 3).
- **Big architectural change** (new track, framework version bump, harness strategy change) → use SDD via `/sdd-new <change>`.
- **Small fix** (typo, doc link, version bump) → direct edit + conventional commit.
- **Sibling repo**: reference only — do NOT edit `ai-dev-bootcamp/` from this session.

# langchain-bootcamp

[![CI](https://github.com/JcOnSoftware/langchain-bootcamp/actions/workflows/ci.yml/badge.svg)](https://github.com/JcOnSoftware/langchain-bootcamp/actions/workflows/ci.yml)

> [🇪🇸 Lee esto en español →](./README.es.md)

**Rustlings for LangChain devs.** A hands-on bootcamp that teaches [LangChain](https://js.langchain.com/) (TypeScript) through 30 progressive exercises with automated tests against real APIs.

Sister repo to [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) — that one teaches the **native SDKs** (Anthropic, OpenAI, Gemini). This one picks up from there and teaches the **abstraction on top**: composition, retrieval, agents, graphs, structured output, observability — all provider-agnostic.

## Who this is for

Two profiles are welcome — no prerequisite to start.

- **You've done [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) (or have equivalent experience with a native SDK).** Jump straight into Track 01. LangChain's abstractions will click fast because you've already seen the metal underneath.
- **You're coming directly to learn LangChain without having touched a native SDK.** You can start here too. The curriculum assumes you know TypeScript and have a baseline sense of what an LLM is (prompt, completion, tokens) — but it does NOT assume you've written code against `@anthropic-ai/sdk`, `openai`, or `@google/genai`. If you want extra grounding while you solve the exercises, `ai-dev-bootcamp` is the recommended parallel resource (not a prerequisite).

## Status

**v0.1.0 — shipped.** All 6 tracks × 5 exercises = 30 runnable exercises, 3 providers, bilingual (en/es), CI green.

## The curriculum — 6 tracks, 30 exercises

| Track | Exercises | What you learn |
|-------|-----------|----------------|
| **01 — Composition** | 5 | LCEL: `prompt \| model \| parser`, sequential chains, branching, custom runnables, `.batch()` |
| **02 — Retrieval & RAG** | 5 | Document loaders, vector stores, basic RAG, reranking/hybrid, stateful RAG with history |
| **03 — Agents & tools** | 5 | `.bindTools()`, `createAgent()`, multi-tool + error recovery, agents with memory, streaming steps |
| **04 — LangGraph** | 5 | State graph basics, ReAct as explicit graph, subagents + HITL, event streaming, checkpointing |
| **05 — Advanced patterns** | 5 | Structured output with Zod, fallback/retry, streaming partial JSON, extended thinking, tool schema validation |
| **06 — Observability** | 5 | LangSmith tracing (optional), custom callback handlers, cost tracking, chain debugging, production checklist |

Providers supported at `init`: **Anthropic**, **OpenAI**, **Gemini** — you pick one, the exercises run against it. The curriculum itself is unified — the whole point of LangChain is provider abstraction.

## Coming from ai-dev-bootcamp? Here's what maps

Optional reading — a concrete bridge between the sibling's tracks and this one's. If you've done any of these in the sibling, you've already built base for the matching track here. If you haven't, this is also the map for what to go reinforce in `ai-dev-bootcamp` if a concept feels thin while you're solving an exercise.

| Sibling track (ai-dev-bootcamp) | Prepares you for… |
|---|---|
| `01-foundations` (any provider) | Track 01 Composition, Track 05 Advanced patterns — what a chat completion is, tokens, basic streaming |
| `02-caching` / `02-context-management` / `02-context-caching` | Track 06 Observability (cost tracking) — usage metadata and why it matters |
| `03-tool-use` / `03-function-calling` | Track 03 Agents-tools, Track 04 LangGraph — the tool mechanics underneath `.bindTools()` and `createAgent()` |
| `04-rag` (any provider) | Track 02 Retrieval-RAG — embeddings, vector search, chunking; in LangChain all of this lives behind abstractions |
| `05-agents` (any provider) | Track 03 Agents-tools, Track 04 LangGraph — the manual agent loop vs. the explicit graph |
| `06-mcp` / `06-evals-production` / `06-advanced-features` | Track 05 Advanced patterns, Track 06 Observability — structured output, fallbacks, production checklist |

You don't need to have completed the sibling to start here. The table is a map in case you want to reinforce a specific concept while solving an exercise.

## Quick start

Requires [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows) and [VS Code](https://code.visualstudio.com/) (for `lcdev open` and `lcdev next`).

**API keys** — get one for the provider you pick:
- **Anthropic**: <https://console.claude.com/settings/keys>
- **OpenAI**: <https://platform.openai.com/api-keys>
- **Google (Gemini)**: <https://aistudio.google.com/apikey>

```bash
gh repo clone JcOnSoftware/langchain-bootcamp
cd langchain-bootcamp/code
bun install
```

### Enable the `lcdev` command

```bash
# Mac / Linux:
bun run setup

# Windows PowerShell:
powershell -File bin/setup.ps1
```

The setup script adds `code/bin/` to your PATH (zsh/bash/fish autodetected on Unix; user PATH on Windows). Safe to run multiple times.

### First run

```bash
lcdev init                  # provider + API key + locale (en/es) → ~/.lcdev/config.json
lcdev list                  # browse exercises grouped by track
lcdev next                  # open the next incomplete exercise in VS Code
```

## Working on exercises

| Command | What it does |
|---------|--------------|
| `lcdev list` | Browse exercises grouped by track, pick one to open |
| `lcdev open <id>` | Open a specific exercise in VS Code |
| `lcdev open <id> --solution` | View the reference solution |
| `lcdev open` | Interactive picker — browse and select |
| `lcdev next` | Open the next incomplete exercise |
| `lcdev verify <id>` | Run tests against your implementation |
| `lcdev run <id>` | Execute and see model output |
| `lcdev progress` | Dashboard with completion per track |

If you want more base on native SDKs first, [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) is the sibling repo and is fully functional today.

## Contributing

New exercises, bug fixes, and translations are welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, tests, commit conventions, and how to author a new exercise per the contract.

## License

MIT — see [LICENSE](./LICENSE).

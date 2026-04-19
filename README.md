# langchain-bootcamp

> [🇪🇸 Leé esto en español →](./README.es.md)

**Rustlings for LangChain devs.** A hands-on bootcamp that teaches [LangChain](https://js.langchain.com/) (TypeScript) through 30 progressive exercises with automated tests against real APIs.

Sister repo to [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) — that one teaches the **native SDKs** (Anthropic, OpenAI, Gemini). This one picks up from there and teaches the **abstraction on top**: composition, retrieval, agents, graphs, structured output, observability — all provider-agnostic.

## Who this is for

Two profiles are welcome — no prerequisite to start.

- **You've done [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) (or have equivalent experience with a native SDK).** Jump straight into Track 01. LangChain's abstractions will click fast because you've already seen the metal underneath.
- **You're coming directly to learn LangChain without having touched a native SDK.** You can start here too. The curriculum assumes you know TypeScript and have a baseline sense of what an LLM is (prompt, completion, tokens) — but it does NOT assume you've written code against `@anthropic-ai/sdk`, `openai`, or `@google/genai`. If you want extra grounding while you solve the exercises, `ai-dev-bootcamp` is the recommended parallel resource (not a prerequisite).

## Status

**v0.1 — in bootstrap.** Curriculum is designed (6 tracks × 5 exercises), infra is being ported from the sibling repo.

See [`PLAN.md`](./PLAN.md) for the full plan, decisions, and execution phases.

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

Not yet. The CLI (`lcdev`) is not built yet. Come back for v0.1.0.

In the meantime, if you want to build base: [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) is the sibling repo and is fully functional today.

## License

MIT — see [LICENSE](./LICENSE).

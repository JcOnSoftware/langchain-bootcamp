# langchain-bootcamp

> [🇪🇸 Leé esto en español →](./README.es.md)

**Rustlings for LangChain devs.** A hands-on bootcamp that teaches [LangChain](https://js.langchain.com/) (TypeScript) through 30 progressive exercises with automated tests against real APIs.

Sister repo to [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) — that one teaches the **native SDKs** (Anthropic, OpenAI, Gemini). This one picks up from there and teaches the **abstraction on top**: composition, retrieval, agents, graphs, structured output, observability — all provider-agnostic.

**Audience**: devs who already know at least one native SDK and want to level up to framework-level patterns without re-learning the basics.

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

## Quick start

Not yet. The CLI (`lcdev`) is not built yet. Come back for v0.1.0.

## License

MIT — see [LICENSE](./LICENSE).

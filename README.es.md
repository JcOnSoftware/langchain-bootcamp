# langchain-bootcamp

> [🇬🇧 Read this in English →](./README.md)

**Rustlings para devs de LangChain.** Un bootcamp hands-on que enseña [LangChain](https://js.langchain.com/) (TypeScript) a través de 30 ejercicios progresivos con tests automáticos contra APIs reales.

Repo hermano de [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) — ese enseña los **SDKs nativos** (Anthropic, OpenAI, Gemini). Este arranca donde termina el otro y enseña la **abstracción arriba**: composición, retrieval, agentes, grafos, structured output, observability — todo provider-agnostic.

**Público**: devs que ya saben al menos un SDK nativo y quieren subir a patrones de framework sin re-aprender lo básico.

## Estado

**v0.1 — en bootstrap.** El curriculum está diseñado (6 tracks × 5 ejercicios), la infra se está portando del repo hermano.

Mirá [`PLAN.md`](./PLAN.md) para el plan completo, decisiones y fases de ejecución.

## Curriculum — 6 tracks, 30 ejercicios

| Track | Ejercicios | Qué se aprende |
|-------|------------|----------------|
| **01 — Composition** | 5 | LCEL: `prompt \| model \| parser`, chains secuenciales, branching, custom runnables, `.batch()` |
| **02 — Retrieval & RAG** | 5 | Document loaders, vector stores, RAG básico, reranking/hybrid, RAG stateful con history |
| **03 — Agents & tools** | 5 | `.bindTools()`, `createAgent()`, multi-tool con error recovery, agents con memoria, streaming de steps |
| **04 — LangGraph** | 5 | State graph basics, ReAct como grafo explícito, subagents + human-in-loop, event streaming, checkpointing |
| **05 — Advanced patterns** | 5 | Structured output con Zod, fallback/retry, streaming de JSON parcial, extended thinking, validación de tool schemas |
| **06 — Observability** | 5 | LangSmith tracing (opcional), custom callback handlers, cost tracking, debugging de chains, production checklist |

Providers soportados al `init`: **Anthropic**, **OpenAI**, **Gemini** — elegís uno, los ejercicios corren contra ése. El curriculum en sí es unificado — el valor central de LangChain ES la abstracción sobre providers.

## Quick start

Todavía no. La CLI (`lcdev`) no existe aún. Volvé para la v0.1.0.

## Licencia

MIT — mirá [LICENSE](./LICENSE).

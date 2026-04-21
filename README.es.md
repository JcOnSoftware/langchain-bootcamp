# langchain-bootcamp

> [🇬🇧 Read this in English →](./README.md)

**Rustlings para devs de LangChain.** Un bootcamp hands-on que enseña [LangChain](https://js.langchain.com/) (TypeScript) a través de 30 ejercicios progresivos con tests automáticos contra APIs reales.

Repo hermano de [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) — ese enseña los **SDKs nativos** (Anthropic, OpenAI, Gemini). Este arranca donde termina el otro y enseña la **abstracción de arriba**: composición, retrieval, agentes, grafos, structured output, observability — todo provider-agnostic.

## Para quién es esto

Dos perfiles son bienvenidos — sin prerequisito para empezar.

- **Ya hiciste [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) (o tienes experiencia equivalente con un SDK nativo).** Ve directo al Track 01. Las abstracciones de LangChain te van a hacer click rápido porque ya viste el metal debajo.
- **Vienes directo a aprender LangChain sin haber tocado un SDK nativo.** Puedes empezar igual. El curriculum asume que sabes TypeScript y tienes nociones mínimas de qué es un LLM (prompt, completion, tokens) — pero NO asume que hayas escrito código contra `@anthropic-ai/sdk`, `openai`, o `@google/genai`. Si quieres contexto extra mientras resuelves los ejercicios, `ai-dev-bootcamp` es el recurso paralelo recomendado (no prerequisito).

## Estado

**v0.1 — curriculum completo.** Los 6 tracks × 5 ejercicios = 30 ejercicios ejecutables. Falta cerrar el release wiring (tag `v0.1.0` + CI workflows + release notes).

Mira [`PLAN.md`](./PLAN.md) para el plan completo, decisiones y fases de ejecución.

## Curriculum — 6 tracks, 30 ejercicios

| Track | Ejercicios | Qué se aprende |
|-------|------------|----------------|
| **01 — Composition** | 5 | LCEL: `prompt \| model \| parser`, chains secuenciales, branching, custom runnables, `.batch()` |
| **02 — Retrieval & RAG** | 5 | Document loaders, vector stores, RAG básico, reranking/hybrid, RAG stateful con history |
| **03 — Agents & tools** | 5 | `.bindTools()`, `createAgent()`, multi-tool con error recovery, agents con memoria, streaming de steps |
| **04 — LangGraph** | 5 | State graph basics, ReAct como grafo explícito, subagents + human-in-loop, event streaming, checkpointing |
| **05 — Advanced patterns** | 5 | Structured output con Zod, fallback/retry, streaming de JSON parcial, extended thinking, validación de tool schemas |
| **06 — Observability** | 5 | LangSmith tracing (opcional), custom callback handlers, cost tracking, debugging de chains, production checklist |

Providers soportados al `init`: **Anthropic**, **OpenAI**, **Gemini** — eliges uno, los ejercicios corren contra ese. El curriculum en sí es unificado — el valor central de LangChain ES la abstracción sobre providers.

## ¿Vienes de ai-dev-bootcamp? Mapa concreto de qué te sirve

Lectura opcional — un puente explícito entre los tracks del hermano y los de este repo. Si hiciste alguno de estos en el sibling, ya tienes base armada para el track que le mapea aquí. Si no los hiciste, también te sirve como mapa de qué ir a reforzar al `ai-dev-bootcamp` si un concepto te queda flojo mientras resuelves un ejercicio.

| Track en ai-dev-bootcamp | Te deja preparado para… |
|---|---|
| `01-foundations` (cualquier provider) | Track 01 Composition, Track 05 Advanced patterns — qué es un chat completion, tokens, streaming básico |
| `02-caching` / `02-context-management` / `02-context-caching` | Track 06 Observability (la parte de cost tracking) — usage metadata y por qué importa |
| `03-tool-use` / `03-function-calling` | Track 03 Agents-tools, Track 04 LangGraph — la mecánica de tools debajo de `.bindTools()` y `createAgent()` |
| `04-rag` (cualquier provider) | Track 02 Retrieval-RAG — embeddings, vector search, chunking; en LangChain todo eso vive detrás de abstracciones |
| `05-agents` (cualquier provider) | Track 03 Agents-tools, Track 04 LangGraph — el agent loop manual vs. el grafo explícito |
| `06-mcp` / `06-evals-production` / `06-advanced-features` | Track 05 Advanced patterns, Track 06 Observability — structured output, fallbacks, production checklist |

No necesitas haber completado el sibling para empezar aquí. La tabla es un mapa por si quieres reforzar un concepto específico mientras resuelves un ejercicio.

## Quick start

Requiere [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows) y [VS Code](https://code.visualstudio.com/) (para `lcdev open` y `lcdev next`).

**API keys** — saca una del provider que elijas:
- **Anthropic**: <https://console.claude.com/settings/keys>
- **OpenAI**: <https://platform.openai.com/api-keys>
- **Google (Gemini)**: <https://aistudio.google.com/apikey>

```bash
gh repo clone JcOnSoftware/langchain-bootcamp
cd langchain-bootcamp/code
bun install
```

### Habilita el comando `lcdev`

```bash
# Mac / Linux:
bun run setup

# Windows PowerShell:
powershell -File bin/setup.ps1
```

El script de setup agrega `code/bin/` al PATH (autodetecta zsh/bash/fish en Unix; user PATH en Windows). Puedes correrlo varias veces sin problema.

### Primera corrida

```bash
lcdev init                  # provider + API key + locale (en/es) → ~/.lcdev/config.json
lcdev list                  # explora ejercicios agrupados por track
lcdev next                  # abre el siguiente ejercicio pendiente en VS Code
```

## Trabajando los ejercicios

| Comando | Qué hace |
|---------|----------|
| `lcdev list` | Explora ejercicios por track y elige uno para abrir |
| `lcdev open <id>` | Abre un ejercicio específico en VS Code |
| `lcdev open <id> --solution` | Muestra la solución de referencia |
| `lcdev open` | Picker interactivo — explora y selecciona |
| `lcdev next` | Abre el siguiente ejercicio incompleto |
| `lcdev verify <id>` | Corre los tests contra tu implementación |
| `lcdev run <id>` | Ejecuta y muestra el output del modelo |
| `lcdev progress` | Dashboard de completitud por track |

Si quieres más base de SDKs nativos antes, [`ai-dev-bootcamp`](https://github.com/JcOnSoftware/ai-dev-bootcamp) es el repo hermano y está totalmente funcional hoy.

## Licencia

MIT — mira [LICENSE](./LICENSE).

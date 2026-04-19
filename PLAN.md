# Plan: `langchain-bootcamp` — sister repo to ai-dev-bootcamp

## Contexto

`ai-dev-bootcamp` (v3.0 público, MIT) enseña los SDKs nativos de Anthropic, OpenAI y Gemini a devs senior — 90 exercises, 3 providers, bilingüe, harness que monkey-patchea prototipos de SDK. LangChain quedó deferida al backlog como posible `07-frameworks` track.

Metiendo LangChain como track del repo actual rompe la tesis pedagógica ("foundations before frameworks"), explota el scope (LangChain ≠ 5 exercises), y genera asserts SDK-level sobre código framework-level (code smell). La decisión ya tomada: **repo hermano**, no track.

Este plan crea `/Users/juancarlosyoveracruz/work/jc/projects/new-tools/langchain-bootcamp/` como **nuevo directorio hermano** de `ai-dev-bootcamp/` dentro de `new-tools/`. Copiado pragmático one-time de la infra del repo actual (copy-and-evolve confirmado), y curriculum unificado provider-agnóstico con los 3 providers (Anthropic + OpenAI + Gemini) desde v0.1 — la abstracción ES el producto de LangChain.

**Importante**: una vez hecho el copy inicial en Fase 1, `langchain-bootcamp/` es un repo totalmente auto-contenido. No hay dependencias de runtime ni de build contra `ai-dev-bootcamp/`. El trabajo futuro de LangChain pasa EXCLUSIVAMENTE en `new-tools/langchain-bootcamp/`.

## Decisiones locked-in (con su razón)

| Decisión | Elección | Razón |
|---|---|---|
| Nombre repo | `langchain-bootcamp` | Paralelo a `ai-dev-bootcamp`, claro, no sobreclaima ("frameworks" dejaría afuera Haystack/LlamaIndex — eso no es este repo) |
| Path | `new-tools/langchain-bootcamp/` | Hermano en el mismo parent; separable en cualquier momento |
| Binario | `lcdev` | Espeja `aidev`; `lc` colisiona con tools comunes, `langchain-dev` es largo |
| Config dir | `~/.lcdev/` | Cero colisión con `~/.aidev/`; progreso independiente |
| Curriculum | **Unificado, no per-provider** | ChatAnthropic/OpenAI/Google heredan uniformes de `BaseChatModel` — per-provider tracks triplica scope para duplicar lecciones y contradice el value-prop de LangChain (abstracción) |
| Providers soportados | Anthropic + OpenAI + Gemini al `init` | El alumno elige uno; los exercises corren contra ése |
| Harness strategy | Patchar `BaseChatModel._generate` + `._streamResponseChunks` | Sobrevive bumps de SDK; una sola superficie vs tres; alineado con extension model de LangChain. NO usar LangSmith callbacks (requiere key extra — fricción) |
| Extracción de core | **Copy-and-evolve, NO shared package** | YAGNI: sólo hay 2 bootcamps. `@aidev/cli-core` se justifica cuando aparezca el 3º, no antes. El repo actual no se toca |
| Versiones LangChain | Lock a `@langchain/core@^1.1`, `@langchain/langgraph@^1` | LangChain 1.0 GA (sept 2025) con compromiso de no-breaking hasta v2.0 |
| i18n | `en` (default) + `es` desde día 1 | Mismo patrón que sibling; costo marginal bajo con mecánica ya resuelta |
| Exercise contract | Idéntico a ai-dev-bootcamp | `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `<locale>/exercise.md` |
| Release inicial | `v0.1.0`, no `v1.0.0` | Espacio para iterar sin compromiso de estabilidad SDK-level |
| CI | GitHub Actions: PR CI + weekly health check | Copiar workflows del sibling, adaptar secrets |

## Curriculum — 6 tracks / 30 exercises

Skip basics (el alumno viene de `ai-dev-bootcamp`). Cada track entrega valor que el SDK nativo no da.

| Track | Exercises | Qué se aprende |
|---|---|---|
| `01-composition` | 5 | LCEL: `prompt \| model \| parser`, chains secuenciales, branching, custom runnables, `.batch()` |
| `02-retrieval-rag` | 5 | Document loaders, vector stores (in-memory + real), basic RAG, reranking/hybrid search, RAG stateful con history |
| `03-agents-tools` | 5 | `.bindTools()`, `createAgent()`, multi-tool con error recovery, agent con memoria, streaming de steps |
| `04-langgraph` | 5 | State graph basics, ReAct como grafo explícito, subagents + human-in-loop, streaming de eventos, checkpointing/resume |
| `05-advanced-patterns` | 5 | Structured output con Zod, fallback/retry, streaming de JSON parcial, extended thinking, tool-schema validation |
| `06-observability` | 5 | LangSmith tracing (opcional con key), custom callback handlers, cost tracking, debugging chains, production checklist |

**Deferidos para v0.2+**: track 07 provider deep-dives (Anthropic caching/citations específico vía LangChain), Gemini Live via LangChain si emerge.

## Arquitectura del repo

```
langchain-bootcamp/
├── code/
│   ├── package.json            # bun workspaces, name: "langchain-bootcamp"
│   ├── tsconfig.json           # copiar del sibling (strict + noUncheckedIndexedAccess)
│   └── packages/
│       ├── runner/             # @lcdev/runner
│       │   └── src/
│       │       ├── harness.ts           # runUserCode wrapper
│       │       ├── harness-langchain.ts # patch BaseChatModel prototype
│       │       └── types.ts             # CapturedCallLangChain, HarnessResult
│       ├── cli/                # @lcdev/cli — binario `lcdev`
│       │   └── src/
│       │       ├── index.ts    # commander + preAction
│       │       ├── commands/   # init, list, verify, progress, open, next, run
│       │       ├── exercises.ts
│       │       ├── config.ts   # ~/.lcdev/
│       │       ├── provider/   # SupportedProvider = "anthropic" | "openai" | "gemini"
│       │       └── i18n/       # en.json + es.json (strings reescritos)
│       └── exercises/          # @lcdev/exercises
│           ├── 01-composition/
│           ├── 02-retrieval-rag/
│           ├── 03-agents-tools/
│           ├── 04-langgraph/
│           ├── 05-advanced-patterns/
│           └── 06-observability/
├── docs/
│   └── EXERCISE-CONTRACT.md    # copiar + adaptar (asserts LangChain-level, no SDK-level)
├── .github/workflows/          # PR CI + health-check weekly
├── README.md + README.es.md
└── LICENSE (MIT)
```

## Fases de trabajo (recomendación de ejecución incremental)

Cada fase = una PR. No hacer todo en un big bang.

### Fase 0 — Nuevo directorio + persistir plan + handoff

**0.1 Crear directorio + persistir el plan**
- `mkdir /Users/juancarlosyoveracruz/work/jc/projects/new-tools/langchain-bootcamp`
- Copiar este plan a `new-tools/langchain-bootcamp/PLAN.md` — queda versionado con el repo desde el primer commit. El archivo original de `~/.claude/plans/` es efímero.

**0.2 Handoff (STOP)**
- Después de crear el directorio y dejar `PLAN.md` adentro, **la sesión actual se detiene acá**. Claude Code en esta sesión corre desde `ai-dev-bootcamp/`, así que ejecutar las siguientes fases desde acá es forzar la herramienta.
- El usuario abre una nueva sesión de Claude Code desde `new-tools/langchain-bootcamp/` (`cd new-tools/langchain-bootcamp && claude`) y retoma desde Fase 0.3 leyendo `PLAN.md`.
- Esta sesión NO hace `git init`, ni `gh repo create`, ni bootstrap de bun. Eso lo arranca la sesión nueva en el path correcto.

**0.3 — (próxima sesión, arranque) Repo bootstrap**
- Desde el nuevo directorio: `git init -b main`, `gh repo create JcOnSoftware/langchain-bootcamp --public --license MIT --source . --remote origin`
- `bun init` + workspaces + `tsconfig.json` espejando sibling (strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `allowImportingTsExtensions`)
- README stub bilingüe, LICENSE (MIT), `.gitignore`, `CLAUDE.md` nuevo específico de este repo
- Commit `chore: bootstrap langchain-bootcamp`

### Fase 1 — CLI core (copy-and-rename)
- Copiar `code/packages/cli/src/{config.ts,exercises.ts,render.ts,i18n/,commands/,provider/}` desde sibling
- `sd 'aidev' 'lcdev'` en rutas y strings donde aplique; `~/.aidev/` → `~/.lcdev/`
- Simplificar `provider/types.ts`: aún se elige Anthropic/OpenAI/Gemini pero para ELEGIR qué `ChatX` instanciar, no para routear a 3 harnesses
- `i18n/en.json` + `es.json`: reescribir strings para lenguaje LangChain
- Smoke: `bun run packages/cli/src/index.ts init` corre sin romper

### Fase 2 — LangChain harness
- `runner/src/harness-langchain.ts`: importa `BaseChatModel` de `@langchain/core`, monkey-patchea `._generate` y `._streamResponseChunks` en el prototype; restora en `finally`
- `types.ts`: `CapturedCallLangChain { model, input, output, tool_calls, run_id }`
- Test con mock: patch captura, exercise sintético invoca, asserts validan shape
- Commit `feat(runner): BaseChatModel prototype harness`

### Fase 3 — Track `01-composition` (5 exercises) end-to-end
- Ejercicio por ejercicio con contract respetado: `meta.json` con `locales: ["es","en"]`, bilingüe, `starter.ts` con `// Docs:` header, `solution.ts` idempotente, `tests.test.ts` con `resolveExerciseFile`
- Integration tests reales contra Anthropic (default) — guard en `beforeAll` por key
- Primer track verificado: `lcdev verify 01-hello-chain --solution` pasa real API
- Commit por exercise o batch de 5

### Fase 4–8 — Tracks 02–06
- Mismo patrón, una PR por track
- Cada PR incluye: 5 exercises + README update + i18n strings si aplica

### Fase 9 — Release v0.1.0
- `.github/workflows/` copiados + adaptados
- Tag anotado + `gh release create v0.1.0 --latest`
- Cross-link desde README de `ai-dev-bootcamp` → sibling

## Archivos críticos a consultar / copiar

| De ai-dev-bootcamp | Uso en langchain-bootcamp |
|---|---|
| `code/packages/cli/src/config.ts` | Base de `lcdev` config; rename namespace |
| `code/packages/cli/src/i18n/{index.ts,types.ts}` | Copia exacta de mecánica |
| `code/packages/cli/src/exercises.ts` | Reusable, reparametrizar path de exercises (sin provider subdir) |
| `code/packages/cli/src/commands/{init,list,verify,progress,open,next,run}.ts` | Copia + simplificación (single-track-set, no per-provider subdir) |
| `code/packages/cli/src/render.ts` | Copia — render es framework-agnostic |
| `code/packages/cli/src/cost.ts` | Copia y adaptar: LangChain normaliza usage en `AIMessage.response_metadata.tokenUsage` |
| `code/packages/runner/src/types.ts` | Base para `CapturedCallLangChain` |
| `code/packages/runner/src/harness.ts` | Patrón de `runUserCode` con `AIDEV_TARGET` + `resolveExerciseFile` |
| `docs/EXERCISE-CONTRACT.md` | Copia y ajustar ejemplos para LangChain |
| `.github/workflows/*.yml` | Copia con secrets reconfigurados |

## Scope risk / no-scope

**NO incluir en v0.1**:
- LangSmith obligatorio (hacerlo opcional en track 06)
- Tracks per-provider — el alumno ya sabe los SDKs, vino acá por la abstracción
- `@aidev/cli-core` como package publicable — YAGNI hasta que haya un 3º bootcamp
- Framework comparatives (Haystack, LlamaIndex) — scope creep

**Churn watch**: LangChain 1.0 commit de no-breaking hasta v2.0. Si v2.0 sale dentro del primer año, replicar el precedente v0→v1: ~20% de rewrite esperado. Lockear minors en `package.json`.

## Verification (cómo validar end-to-end después de ejecutar)

```bash
cd /Users/juancarlosyoveracruz/work/jc/projects/new-tools/langchain-bootcamp/code
bunx tsc --noEmit              # clean
bun run packages/cli/src/index.ts init   # pick provider + paste key
lcdev list                     # 30 exercises, 6 tracks
lcdev verify 01-hello-chain --solution   # pasa contra real API
lcdev progress                 # dashboard
bun test                       # toda la suite verde con key válida
```

Chequeos finales:
- `gh release list` muestra `v0.1.0`
- `ai-dev-bootcamp/README.md` linkea a `langchain-bootcamp`
- `~/.lcdev/config.json` existe y NO pisa `~/.aidev/`

## Decisiones confirmadas

- ✅ **Copy-and-evolve** para el core compartido (NO extracción a `@aidev/cli-core`). Se copia una sola vez en Fase 1; después los repos divergen libremente.
- ✅ **3 providers desde v0.1** (Anthropic + OpenAI + Gemini) con curriculum unificado provider-agnóstico.
- ✅ **Nuevo directorio** en `new-tools/langchain-bootcamp/`. El trabajo de LangChain abandona `ai-dev-bootcamp/` a partir del primer commit.

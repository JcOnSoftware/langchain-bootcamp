# Proposal: Fase 8 — Track 06 Observability (5 exercises)

## Intent

Cerrar el curriculum de 30 ejercicios con el track "production-facing observability". Después de Fase 7 (advanced-patterns) el learner ya sabe CONSTRUIR chains robustas; Fase 8 le enseña a VERLAS, MEDIRLAS y DEBUGGEARLAS una vez corriendo: tracing, callbacks custom, costo real por call, debug con `streamEvents`, y un capstone de production-checklist que combina todo. Es el arco "cómo opero esto en prod" y deja el runway listo para release (Fase 9).

## Scope

### In Scope
- `packages/exercises/06-observability/` con 5 ejercicios: `01-langsmith-tracing`, `02-custom-callbacks`, `03-cost-tracking`, `04-debug-chains`, `05-production-checklist`.
- Cada ejercicio: `meta.json` (con `locales: ["es","en"]`), `starter.ts`, `solution.ts`, `tests.test.ts`, `es/exercise.md`, `en/exercise.md` (peruano neutro tuteo).
- APIs canónicas: `BaseCallbackHandler`, `RunCollectorCallbackHandler`, `LangChainTracer`, `streamEvents({ version: "v2" })`, `getGraph()`, `withRetry`, `withFallbacks`, `usage_metadata`.
- Ejercicio 01 con `skipIf(!process.env.LANGCHAIN_API_KEY)` para el bloque `LangChainTracer`; `RunCollectorCallbackHandler` corre siempre offline.
- Shape-only asserts (idéntica disciplina que Fases 3-7).

### Out of Scope
- Round-trip real contra LangSmith API (frágil; `RunCollectorCallbackHandler` captura offline igual).
- Nuevos runtime deps (`langsmith@0.5.20` ya transitive de `@langchain/core@1.1.40`).
- Extensiones al harness — la captura actual cubre los 5 ejercicios.
- Tablas de costo fuera de los 3 providers del curriculum (Anthropic/OpenAI/Gemini).
- Deep-dives por provider (v0.2+).
- Release infra / packaging (Fase 9).
- `setVerbose`/`setDebug` — NO existen en `@langchain/core@1.1.40`; usamos `streamEvents v2` + console-spy handler.

## Capabilities

### New Capabilities
- `track-observability`: los 5 ejercicios, shapes esperadas (`collector.tracedRuns.length >= 1`, `userReturn.events` con tipos lifecycle, `userReturn.cost > 0`, event types de `streamEvents v2` presentes, `wrapperTypes[]` con los 5 nombres de wrapper, `callSucceeded === true`).

### Modified Capabilities
None. `exercise-contract` ya cubre fixtures inline + shape-assert discipline + bilingual `{es, en}`.

## Approach

Reusar layout probado en Fases 3-7. Cada ejercicio importa directo de paquetes ya instalados:
- `@langchain/core/callbacks/base` → `BaseCallbackHandler`.
- `@langchain/core/tracers/run_collector` → `RunCollectorCallbackHandler`.
- `@langchain/core/tracers/tracer_langchain` → `LangChainTracer`.
- `@langchain/core/runnables` → `RunnableLambda`, `RunnableSequence`, `withRetry`, `withFallbacks`.
- `CapturedCallLangChain.response.usage` → cost calculator en exercise 03 (construido por learner, NO importado de `cli/src/cost.ts`).

Harness intacto — el patch de `BaseChatModel._generate` + `_streamResponseChunks` captura toda llamada con `usage` normalizado. Tests aseveran shape: `userReturn` keys, `calls.length >= N`, event types en sets esperados, nunca literal text ni exact counts.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/exercises/06-observability/**` | New | 30 files (5 ejercicios × 6 archivos) |
| `code/packages/runner/` | Untouched | Harness actual cubre los 5 casos |
| `code/packages/exercises/package.json` | Untouched | `langsmith` ya transitive; zero new deps |
| `code/packages/cli/src/cost.ts` | Untouched | Exercise 03 construye su propio calculador |
| `openspec/specs/track-observability/spec.md` | New | Delta spec |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Nota breve sobre callbacks attach pattern + streamEvents v2 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| LangSmith API/server drift | Med | `RunCollectorCallbackHandler` offline en el path crítico; `LangChainTracer` guarded por `skipIf` |
| `streamEvents v2` event count no-determinista | High | Asertar event TYPE presence (`on_chat_model_start`, `on_chat_model_end`), NO exact count |
| Cost rates drift 2026-H2 | Med | Rates hardcoded en solution con comment "update 2026-H2"; tests aseveran `cost > 0`, no aritmética exacta salvo fixtures fijas |
| Production-checklist fragility (string-match user code) | High | Asertar sobre metadata/invocaciones capturadas (`wrapperTypes[]`, collector runs), NO patterns en texto del código |
| `ConsoleCallbackHandler` pollute test stdout | Med | Exercise 04 usa spy handler (captura a array) en lugar de `ConsoleCallbackHandler` directo |
| Token count variable entre providers infla cost asserts | Med | Asertar `inputTokens > 0`, `outputTokens > 0`, `cost > 0` — no valores exactos |
| `langsmith` transitive version bump | Low | Import desde `@langchain/core/tracers/*` (re-export estable), NO desde `langsmith` directo |
| Voseo drift en es/exercise.md | Med | `rg` guard en PR CI (tú/tienes/puedes/arranca) |

## Rollback Plan

Cada ejercicio es self-contained bajo su propio directorio. `git rm -r code/packages/exercises/06-observability/<id>/` revierte uno sin tocar el resto. Harness intacto, sin deps nuevas — nada que desinstalar.

## Dependencies

Ya instaladas (bun.lock): `@langchain/core@1.1.40`, `@langchain/anthropic@1.3.26`, `@langchain/openai@1.4.4`, `@langchain/google-genai@1.0.3`, `langsmith@0.5.20` (transitive), `zod@3.25.76`.

API keys: chat-provider key (Anthropic/OpenAI/Gemini). Ejercicio 01 bloque `LangChainTracer` requiere `LANGCHAIN_API_KEY` opcional; sin ella hace skip del bloque, NO falla el test entero.

## Success Criteria

- [ ] `bun test` → Fases 3–7 siguen verdes; Fase 8 tests gated on chat key con fail-fast.
- [ ] `LCDEV_TARGET=solution bun test` → todas las soluciones pasan live (esperado ~229 + ~20 nuevos = ~249 pass).
- [ ] `bunx tsc --noEmit` clean.
- [ ] `lcdev list` muestra 30 entradas total (6 tracks × 5).
- [ ] `lcdev verify 01-langsmith-tracing --solution` verde con chat key; bloque `LangChainTracer` skipped sin `LANGCHAIN_API_KEY`, verde con ella.
- [ ] `lcdev verify 05-production-checklist --solution` verde; `wrapperTypes[]` contiene los 5 wrappers.
- [ ] Voseo `rg` guard devuelve zero hits en `06-observability/**/es/*.md`.
- [ ] `lcdev run 04-debug-chains --solution` imprime event stream legible.
- [ ] `lcdev run 03-cost-tracking --solution` imprime cost breakdown con `inputTokens`, `outputTokens`, `cost` numérico.

## Open Questions

Ninguna pendiente. Exploration confirmó todas las APIs, transitive deps, shapes de captura y versiones. Recomendación aplicada: production-checklist (05) usa chain stub determinista con primary-fails-once para validar fallback sin pollution de rate-limits. Listo para `sdd-spec` + `sdd-design` en paralelo.

# Proposal: Fase 7 — Track 05 Advanced Patterns (5 exercises)

## Intent

Deliver PLAN.md Fase 7: the "production-shaped primitives" track that closes the arc after composition (Fase 3), RAG (Fase 4), agents (Fase 5) y graphs (Fase 6). Estas son las piezas que el learner va a usar tal cual en apps reales: salida tipada, resiliencia con fallback/retry, streaming parcial para UX, razonamiento profundo con Claude, y validación de schemas en tools. Cierra la curva técnica antes de entrar a observability (Fase 8).

## Scope

### In Scope
- `packages/exercises/05-advanced-patterns/` con 5 ejercicios: `01-structured-output-zod`, `02-fallback-retry`, `03-streaming-json`, `04-extended-thinking`, `05-tool-schema-validation`.
- Cada ejercicio: `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `es/exercise.md`, `en/exercise.md`.
- APIs canónicas: `withStructuredOutput`, `withFallbacks`, `withRetry`, `JsonOutputParser`, `ChatAnthropic({ thinking })`, `tool()` + Zod.
- Ejercicio 04 con guard de provider (Anthropic-only; skip en OpenAI/Gemini).

### Out of Scope
- Extensiones al harness o nuevos helpers de runner.
- LangSmith / tracing / observability (eso es Fase 8).
- Ejercicios por-provider (mantenemos curriculum unificado).
- Comparativas Haystack / LlamaIndex.
- Retry policies custom con jitter — sólo `withRetry` base.
- Streaming de tool calls parciales — sólo JSON output streaming.

## Capabilities

### New Capabilities
- `track-advanced-patterns`: los 5 ejercicios, shapes esperadas por test (parsed output via `withStructuredOutput`, fallback/retry attempts, chunk counts en streaming, thinking blocks en `AIMessage.content`, `ToolInputParsingException` en validation).

### Modified Capabilities
None. `exercise-contract` ya cubre fixtures inline + shape-assert discipline.

## Approach

Reusar el layout probado en Fases 3-6. Cada ejercicio importa directo de paquetes ya instalados:
- `@langchain/core/runnables` para `RunnableLambda`, `RunnableSequence`.
- `@langchain/core/output_parsers` para `JsonOutputParser`.
- `@langchain/core/tools` + `zod` para `tool()`.
- `@langchain/core/utils/json_schema` para `toJsonSchema` (no `zod-to-json-schema`).
- `@langchain/anthropic` para `ChatAnthropic({ thinking })` en 04.

Harness intacto — el patch de `BaseChatModel._generate` captura toda llamada. Tests aseveran shape: `result.userReturn` keys, `calls.length >= N`, `calls[0].response.content` contiene `{type:"thinking"}` en 04, etc. Ejercicio 04 detecta provider via `process.env.LCDEV_PROVIDER` y hace `test.skipIf(provider !== "anthropic")`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/exercises/05-advanced-patterns/**` | New | 30 files (5 ejercicios × 6 archivos) |
| `code/packages/runner/` | Untouched | Harness suficiente tal cual |
| `code/packages/exercises/package.json` | Untouched | `zod`, `@langchain/core`, `@langchain/anthropic` ya instalados |
| `openspec/specs/track-advanced-patterns/spec.md` | New | Delta spec |
| `docs/EXERCISE-CONTRACT.md` | Optional append | Nota breve sobre skip-guards por provider |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Provider drift en shape de `withStructuredOutput` | Med | Aseverar sobre `result.userReturn` (valor parseado), NO sobre raw message |
| Thinking `budgetTokens` floor (1024) + prompts largos inflan costo | Med | Prompts cortos; budgetTokens=1024 fijo |
| Chunk count en streaming no-determinista entre providers | High | Asertos `> 1`, nunca `== N` |
| Zod v3 vs v4 confusion | Low | Confirmed v3 (`@langchain/core` usa overloads `ZodV3Like`) |
| Ejercicio 04 falla silenciosamente en OpenAI/Gemini | Med | `test.skipIf` explícito + mensaje en `exercise.md` |
| Fallback se dispara pero test espera primary ok | Med | Primary es `RunnableLambda` determinista que tira una vez; asertar `calls.length == 1` en fallback |
| `ToolInputParsingException` name cambia entre versiones | Low | Asertar `err instanceof Error` + substring check, no class exacta |
| Voseo drift en es/exercise.md | Med | `rg` guard unchanged |

## Rollback Plan

Cada ejercicio es self-contained bajo su propio directorio. `git rm -r code/packages/exercises/05-advanced-patterns/<id>/` revierte uno sin tocar el resto. Harness intacto, sin deps nuevas — nada que desinstalar.

## Dependencies

Ya instaladas: `@langchain/core@1.1.40`, `@langchain/anthropic@^1.0.0`, `@langchain/openai`, `@langchain/google-genai`, `zod@3.25.76`.

API keys: chat-provider key only. Ejercicio 04 requiere `ANTHROPIC_API_KEY`; los otros 4 corren en cualquier provider soportado.

## Success Criteria

- [ ] `bun test` → Fases 3+4+5+6 solution-target tests siguen verdes; Fase 7 tests gated on chat key con fail-fast.
- [ ] `LCDEV_TARGET=solution bun test` → todas las soluciones pasan live (esperado ~209 + ~20 nuevos = ~229 pass).
- [ ] `bunx tsc --noEmit` clean.
- [ ] `lcdev list` muestra 25 entradas total (5 tracks × 5).
- [ ] `lcdev verify 04-extended-thinking --solution` verde con `ANTHROPIC_API_KEY`; skipped con otros providers.
- [ ] `lcdev verify 05-tool-schema-validation --solution` verde (no LLM needed).
- [ ] Voseo `rg` guard devuelve zero hits.
- [ ] `lcdev run 03-streaming-json --solution` imprime chunks parciales legibles.

## Open Questions

Ninguna pendiente. Exploration confirmó todas las APIs, shapes de captura, y versiones. Listo para `sdd-spec` + `sdd-design` en paralelo.

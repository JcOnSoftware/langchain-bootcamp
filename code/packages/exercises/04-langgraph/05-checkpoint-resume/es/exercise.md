# 05 · Checkpoint + resume: interrupt, inspect, Command({resume})

## Objetivo

Practicar el ciclo completo de pausa/inspección/resume con un grafo de 3 pasos y un `MemorySaver`. Sin LLM — esto es plumbing puro, para aislar la mecánica.

## Contexto

Este es el patrón de producción para cualquier workflow con human-in-the-loop o aprobaciones manuales:

1. El grafo corre hasta un nodo que llama `interrupt(...)`.
2. El checkpointer (`MemorySaver`, Postgres, Redis, lo que uses en prod) persiste el estado parcial indexado por `thread_id`.
3. Tu código consulta el estado vía `graph.getState({ configurable: { thread_id } })` — obtienes `.next` (nodos pendientes), `.values` (estado actual), `.tasks[*].interrupts` (info del interrupt).
4. El humano responde (UI, Slack, email, lo que sea).
5. Tu código invoca otra vez con `graph.invoke(new Command({ resume: <valor_del_humano> }), thread)` — el grafo REANUDA desde el mismo nodo, y el `interrupt(...)` retorna `<valor_del_humano>`.

## ADVERTENCIA CRÍTICA

**Nunca envuelvas `graph.invoke` en `try/catch`.** El `GraphInterrupt` propaga por excepción; atraparlo silencia el checkpoint. Este ejercicio lo muestra explícito — fíjate en los comentarios del solution.

## Qué tienes que completar

Abre `starter.ts`. Dos TODOs:

1. **Los 3 nodos**:
   - `step1_prepare`: `() => ({ prepared: true })`
   - `step2_pause`: `() => { const approval = interrupt({ question: "proceed?" }); return { approval: String(approval) }; }`
   - `step3_finalize`: `() => ({ finalized: true })`
2. **El grafo**: añade los 3 nodos + edges lineales `START → step1 → step2 → step3 → END`. Compila con `{ checkpointer: new MemorySaver() }`.

Luego en `run()`:

1. Primera `graph.invoke({}, thread)` → el grafo corre hasta `step2_pause`, lanza `interrupt`, y **halts**.
2. `const pre = await graph.getState(thread);` → `pre.next` debería ser `["step2_pause"]` o similar (el nodo pendiente).
3. Segunda `graph.invoke(new Command({ resume: "go" }), thread)` → el grafo reanuda. `interrupt(...)` en step2 retorna `"go"`, que se guarda en `approval`. Después corre `step3_finalize` y termina.
4. `const post = await graph.getState(thread);` → `post.next` vacío, `post.values` tiene los tres flags finales.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 05-checkpoint-resume --solution   # sin API key
lcdev run    05-checkpoint-resume --solution   # inspecciona el flujo
```

## Criterio de éxito

- Cero llamadas al modelo.
- `preResumeNext.length >= 1` — el grafo está pausado.
- `postResumeNext.length === 0` — completó después del resume.
- `resumedWith === "go"` — el valor pasado por `Command({ resume })`.
- `final.prepared === true && final.approval === "go" && final.finalized === true`.

## Pista — `thread_id`

Si cambias el `thread_id` entre la primera y la segunda invocación, pierdes el estado. Son sesiones separadas. Usa el mismo string en ambas.

## Pista — `Command({ resume })`

`Command` es el mecanismo para RETOMAR una ejecución pausada. Cuando invocas con un `Command({ resume: X })`:

- LangGraph busca el último checkpoint de ese `thread_id`.
- Encuentra el nodo donde se lanzó `interrupt`.
- Retoma la función del nodo desde el `interrupt(...)` — que ahora retorna `X`.
- Continúa con los nodos restantes.

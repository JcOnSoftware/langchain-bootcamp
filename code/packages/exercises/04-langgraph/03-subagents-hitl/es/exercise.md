# 03 · Subagentes + human-in-the-loop (interrupt / resume)

## Objetivo

Combinar dos patrones poderosos de LangGraph: **composición de grafos** (un grafo chico como nodo de otro) y **HITL** (interrupt + Command para pausar hasta que un humano responda).

## Contexto

Un **subgrafo** se compila aparte y se pasa como nodo del grafo externo. Los campos del estado se comparten por **nombre de clave**: si tu outer state tiene `plan: Annotation<string>` y el subgrafo también, los updates fluyen entre ambos.

Un **interrupt** es el primitivo HITL de LangGraph. Al llamar `interrupt({ question: "..." })` dentro de un nodo, el grafo:

1. Lanza un `GraphInterrupt` especial que se propaga hasta la raíz.
2. El checkpointer (MemorySaver) guarda el estado parcial.
3. El `invoke` devuelve — el grafo está PAUSADO.
4. Tú inspeccionas con `graph.getState(thread)` y ves `.next` con los nodos pendientes.
5. Cuando el humano responde, haces `graph.invoke(new Command({ resume: "approved" }), thread)`.
6. El valor pasado en `resume` se convierte en el valor de retorno de `interrupt(...)` — la función donde estaba pausado el nodo sigue desde ahí.

## ADVERTENCIA CRÍTICA

**NUNCA envuelvas `graph.invoke(...)` en `try/catch`.** `GraphInterrupt` usa el mecanismo de excepciones para propagar hacia arriba; si lo atrapas, silencias la pausa y el checkpointer nunca guarda nada. Esto es por diseño.

## Qué tienes que completar

Abre `starter.ts`. Tres TODOs:

1. **Subgrafo** — un nodo `buildPlan` que retorna `{ plan: "Step 1: ... Step 2: ..." }`. `START → buildPlan → END`.
2. **`decideNode`** — llama `interrupt({ question })` para pausar, y después retorna `{ approval, result: "..." }` usando el valor que llegó del `resume`.
3. **Grafo externo** — agrega el subgrafo como nodo (`addNode("planStage", subgraph)`) + el `decideNode`. Edges: `START → planStage → decide → END`. Compila con `MemorySaver`.

Luego en el `run()`:

1. Primera invocación: `await graph.invoke({}, thread)` — debería colgarse en el `decide` por el interrupt.
2. Inspecciona con `graph.getState(thread)` — `state.next` debería tener nodos pendientes.
3. Segunda invocación: `await graph.invoke(new Command({ resume: "approved" }), thread)` — completa el grafo.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 03-subagents-hitl --solution   # referencia (sin API key)
lcdev run    03-subagents-hitl --solution   # inspecciona el estado final
```

## Criterio de éxito

- Cero llamadas al modelo (este ejercicio es plumbing puro).
- `interrupted === true` (la primera invocación se pausó).
- `resumed === true` (la segunda invocación completó el grafo).
- `final.plan` no vacío, `final.approval === "approved"`, `final.result` no vacío.

## Pista — thread_id

El `configurable.thread_id` es la CLAVE de la persistencia. Dos invocaciones con el mismo `thread_id` comparten estado; con `thread_id` diferente son sesiones independientes. Si te olvidas de pasarlo, el checkpointer tira error.

## Pista — detectar interrupt

La forma más portable de detectar que el grafo está pausado:

```ts
const state = await graph.getState(thread);
const pausedNodes = Array.from(state.next ?? []);
// pausedNodes.length > 0 ⇒ el grafo tiene trabajo pendiente
```

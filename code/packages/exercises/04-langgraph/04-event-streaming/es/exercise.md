# 04 · Event streaming con `graph.streamEvents`

## Objetivo

Consumir el stream de **eventos tipados** que emite un grafo mientras corre. En Fase 5 viste `agent.stream(..., { streamMode: "values" })` — snapshots de estado. Acá ves lo más granular que ofrece LangChain: `streamEvents({ version: "v2" })`.

## Contexto

`streamEvents` emite un evento por cada hito dentro del grafo:

- `on_chain_start` / `on_chain_end` — entrada/salida de cada nodo o del grafo completo.
- `on_chat_model_start` / `on_chat_model_stream` / `on_chat_model_end` — cada llamada al chat model (y sus deltas de streaming si el modelo lo soporta).
- `on_tool_start` / `on_tool_end` — tool calls cuando hay tools.
- Otros eventos internos de LangChain (LLM, runnable, etc.).

Es la misma telemetría que usa LangSmith por dentro. Para observabilidad + debugging en producción, es la API canónica.

## Qué tienes que completar

Abre `starter.ts`. Dos TODOs:

1. **`ask` node** — llama al modelo con un `HumanMessage` que use `state.topic`. Retorna `{ reply: stringContent }`.
2. **Consumir el stream** — `graph.streamEvents({ topic }, { version: "v2" })` devuelve un async iterable. Itera con `for await (const evt of stream)`, y cuenta `evt.event` en `eventTypes[...]` sumando `totalEvents`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 04-event-streaming --solution   # con API key
lcdev run    04-event-streaming --solution   # ver el mapa de eventos
```

## Criterio de éxito

- Al menos **una** llamada al modelo capturada por el harness.
- `totalEvents >= 3` — incluso un grafo chico emite varios eventos (graph start + node + model + node end + graph end, como mínimo).
- `eventTypes` tiene al menos una clave que empieza con `on_` (todos los eventos de LangChain siguen ese patrón).

## Pista

```ts
const stream = graph.streamEvents({ topic: "X" }, { version: "v2" });
for await (const evt of stream) {
  eventTypes[evt.event] = (eventTypes[evt.event] ?? 0) + 1;
  totalEvents++;
}
```

`version: "v2"` es OBLIGATORIO — v1 está deprecated y el schema de eventos cambió.

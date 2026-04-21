# 04 · Debug chains — stream events v2 y spy handler

## Objetivo

Usar `streamEvents({ version: "v2" })` para observar el flujo interno de una cadena LangChain y combinar esa visibilidad con un spy handler que captura eventos a nivel de callbacks.

## Contexto

`streamEvents` es el equivalente de un profiler para chains: cada nodo de la cadena emite eventos tipados en tiempo real. Con `{ version: "v2" }`, los eventos siguen el formato estructurado `{ event: string, name: string, run_id: string, data: {...} }`.

Para un chat model, los eventos más importantes son:
- `on_chat_model_start` — el modelo recibió el input.
- `on_chat_model_stream` — llegó un chunk de respuesta.
- `on_chat_model_end` — la respuesta está completa.

Un spy handler (`BaseCallbackHandler`) complementa `streamEvents`: los callbacks se ejecutan a nivel del modelo, antes de que los datos suban al nivel de la cadena. Juntos dan visibilidad completa.

El flujo es:
```ts
const stream = model.streamEvents(input, { version: "v2", callbacks: [spy] });
for await (const evt of stream) {
  // evt.event es el tipo, e.g. "on_chat_model_start"
}
```

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Completar `SpyHandler`**: en `handleLLMStart` y `handleLLMEnd`, push `{ type, runId }` a `this.handlerEvents`.
2. **Iterar `streamEvents`**: crea un `Set<string>()` para `eventTypes` y agrega `evt.event` en cada iteración.
3. **Pasar el spy** en `{ callbacks: [spy] }` dentro de `streamEvents`.
4. **Retornar** `{ eventTypes: [...eventTypes], handlerEvents: spy.handlerEvents }`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 04-debug-chains              # tu código
lcdev verify 04-debug-chains --solution   # referencia
lcdev run    04-debug-chains --solution   # ver qué tipos de eventos se emiten
```

## Criterio de éxito

- Al menos una llamada al modelo es capturada por el harness.
- `eventTypes` contiene al menos `on_chat_model_start` o `on_llm_start`.
- `eventTypes` contiene al menos `on_chat_model_end` o `on_llm_end`.
- `handlerEvents.length >= 2` — el spy capturó start y end.
- Cada entrada en `handlerEvents` tiene un `type` string no vacío.

## Pista

El tipo de cada evento viene en `evt.event`. Usa un `Set<string>` para deduplicar — el stream emite muchos eventos, algunos repetidos:

```ts
const eventTypes = new Set<string>();
const stream = model.streamEvents(
  [new HumanMessage("...")],
  { version: "v2", callbacks: [spy] },
);
for await (const evt of stream) {
  eventTypes.add(evt.event);
}
// [...eventTypes] → ["on_chat_model_start", "on_chat_model_stream", "on_chat_model_end"]
```

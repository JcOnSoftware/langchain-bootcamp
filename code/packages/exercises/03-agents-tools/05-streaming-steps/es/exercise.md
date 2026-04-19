# 05 · Streaming de pasos intermedios del agente

## Objetivo

Observar al agente en vivo: mientras piensa, mientras llama las tools y cuando emite la respuesta final. Hasta ahora usaste `.invoke(...)`, que te da el resultado final en un solo `await`. Ahora vas a usar `.stream(...)` con `streamMode: "values"` para recibir una serie de **snapshots** del estado del grafo. Cada snapshot es la foto del estado completo en ese momento.

## Contexto

LangGraph soporta varios modos de streaming para un mismo grafo:

- **`values`** (el que usamos aquí): cada snapshot es el estado completo (acumulado) del grafo después de cada paso. Ideal para UI que quieren pintar "cómo va" sin tracking manual.
- **`updates`**: solo los deltas por nodo — útil cuando tienes muchos nodos y no quieres re-renderizar todo.
- **`messages`**: streamea tokens de los `AIMessage` a medida que llegan (más granular, más ruido).

Para agentes ReAct construidos con `createReactAgent`, `values` es el default razonable: vas a ver un snapshot después del primer paso del modelo (con `tool_calls`), otro después de que la tool se ejecute (con el `ToolMessage` añadido), y uno más con la respuesta final del asistente. Para este prompt simple, eso son al menos dos snapshots; puede haber más si el loop itera.

El harness captura cada llamada al modelo dentro del stream igual que en `invoke`. Lo que cambia es tu código: en lugar de un `await` plano, iteras el stream con `for await`.

## Qué tienes que completar

Abre `starter.ts`. Cuatro TODOs:

1. **Construye el agente** con `createReactAgent({ llm: model, tools: [weatherTool] })`.
2. **Streamea una sola corrida** con `streamMode: "values"`:
   ```ts
   const stream = await agent.stream(
     { messages: [new HumanMessage("What's the weather in Paris?")] },
     { streamMode: "values" },
   );
   ```
3. **Recolecta los snapshots** con `for await (const snap of stream) { snapshots.push(snap); }`.
4. **Devuelve** `{ snapshotCount: snapshots.length, finalMessages: snapshots.at(-1)?.messages ?? [] }`.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 05-streaming-steps

# La solución
lcdev verify 05-streaming-steps --solution

# Ver los snapshots a medida que llegan
lcdev run 05-streaming-steps --solution --stream-live
```

## Criterio de éxito

- Al menos **una** llamada al modelo capturada (`result.calls.length >= 1`).
- El id del modelo coincide con el proveedor configurado.
- `userReturn.snapshotCount >= 2` — el agente emitió al menos dos snapshots (estado inicial + uno después de pensar, probablemente más).
- `userReturn.finalMessages.length >= 2` — la última foto del estado incluye al menos el `HumanMessage` y un `AIMessage` (normalmente más si hubo tool call).

## Pista

El patrón es mecánico:

```ts
const stream = await agent.stream(
  { messages: [new HumanMessage("What's the weather in Paris?")] },
  { streamMode: "values" },
);

const snapshots = [];
for await (const snap of stream) {
  snapshots.push(snap);
  // Para debug visual: console.log(snap.messages.length, "messages so far");
}
```

Si quieres ver cómo crece el estado, logueá `snap.messages.length` en cada iteración: vas a ver 1, luego 2 (se añadió el `AIMessage`), luego 3 (se añadió el `ToolMessage`), luego 4 (el `AIMessage` final). Ese crecimiento MONÓTONO es la firma de `streamMode: "values"`.

# 02 · ReAct como grafo explícito

## Objetivo

Reimplementar un agente ReAct (pensar → usar tool → responder) como un `StateGraph` explícito, con dispatcher de tools **hecho a mano**. En Fase 5 usaste `createReactAgent` — ahora ves qué hace por dentro.

## Contexto

Un agente ReAct en LangGraph es en realidad un grafo simple:

```
START → agent → [¿hay tool_calls?] → tools → agent → END
                                      ▲       │
                                      └───────┘
```

- Nodo **`agent`**: invoca el chat model con el historial de mensajes. Si el modelo decide usar una tool, el `AIMessage` resultante trae `tool_calls`.
- Nodo **`tools`**: itera sobre `tool_calls`, ejecuta cada tool, y produce `ToolMessage[]` como actualización del estado.
- **Edge condicional**: después de `agent`, si hay `tool_calls` → ir a `tools`; si no → ir a `END`.

El ciclo termina cuando el modelo devuelve una respuesta final (sin `tool_calls`).

## Qué tienes que completar

Abre `starter.ts`. Cuatro TODOs:

1. **`agentNode`** — llama al modelo con `state.messages`. Devuelve `{ messages: [reply] }`.
2. **`toolsNode`** — lee `state.messages.at(-1).tool_calls`, invoca cada tool vía `toolsByName[tc.name].invoke(tc.args)`, envuelve el resultado en `ToolMessage({ content, tool_call_id: tc.id })`. Devuelve `{ messages: [...toolMessages] }`.
3. **`routeFromAgent`** — si el último mensaje tiene `tool_calls`, retorna `"tools"`; si no, retorna `END`.
4. **Grafo** — arma el grafo con los dos nodos, el edge condicional, y la arista de regreso `tools → agent`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 02-react-as-graph --solution   # referencia (requiere API key)
lcdev run    02-react-as-graph --solution   # ver la respuesta final
```

## Criterio de éxito

- El grafo hace **al menos 2** llamadas al modelo (una para decidir la tool, otra para responder).
- Al menos una llamada capturada tiene `response.tool_calls.length >= 1`.
- El nombre del `tool_call` coincide con una de las tools definidas (`get_weather` o `get_time`).
- `answer` es un string no vacío.
- `messages.length >= 3` (human + ai con tool_calls + ai-final, al mínimo).

## Pista — `MessagesAnnotation`

`MessagesAnnotation` es un prebuilt que ya trae el reducer `addMessages` listo. Tu estado solo tiene `messages: BaseMessage[]`; cuando un nodo devuelve `{ messages: [nuevoMsg] }`, el reducer APPENDS a la lista en vez de reemplazarla.

## Pista — edge condicional

```ts
.addConditionalEdges("agent", routeFromAgent, ["tools", END])
```

El tercer argumento (`pathMap`) es opcional pero ayuda al typecheck — declara los destinos posibles que el router puede retornar.

## Anti-patrón a evitar

No uses `ToolNode` del prebuilt. El objetivo de este ejercicio es ver el dispatcher a mano. El `ToolNode` lo usarás en otros ejercicios, pero ahora toca entender qué hace.

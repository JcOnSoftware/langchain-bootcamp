# 02 · Agente ReAct con createReactAgent

## Objetivo

Subir un nivel respecto al ejercicio 01: en lugar de vincular la tool y leer un único `tool_call`, vas a delegarle al agente el loop completo de razonamiento ↔ ejecución. `createReactAgent` es el building block prebuilt de LangGraph que arma por ti el grafo ReAct clásico (pensar → usar tool → observar → responder). Lo tuyo es darle el modelo, las tools y una pregunta; lo demás es orquestación interna.

## Contexto

ReAct = **Rea**son + **Act**. El modelo alterna pasos de razonamiento ("para contestar esto necesito X") con pasos de acción ("llamo la tool X"), lee el resultado, y decide si ya puede responder o si necesita otro paso. Hacerlo a mano implicaría bucles, condiciones y manejo de mensajes — `createReactAgent` encapsula todo eso en un CompiledStateGraph que responde a `.invoke({ messages: [...] })`.

Dos cosas importantes:

1. El agente mantiene un array de mensajes creciente. Al final, `result.messages` contiene: tu `HumanMessage`, uno o más `AIMessage` con `tool_calls`, los `ToolMessage` con los resultados, y el `AIMessage` final con la respuesta en lenguaje natural.
2. El harness de `@lcdev/runner` intercepta CADA llamada al modelo durante el loop. Si el agente itera dos veces, verás dos entradas en `result.calls`.

## Qué tienes que completar

Abre `starter.ts`. Cuatro TODOs:

1. **Define dos tools**: `get_weather({ city })` y `get_time({ tz })`. Cada una devuelve un string corto. Las descripciones son lo que el modelo lee para decidir cuándo llamar cada una — sé específico.
2. **Construye el agente** con `createReactAgent({ llm: model, tools: [weatherTool, timeTool] })`.
3. **Invoca el agente** con un único `HumanMessage`: `"What's the weather in Lima and what time is it there?"`. La pregunta pide datos de ambas tools a propósito.
4. **Extrae la respuesta final**: es el último item de `result.messages`. Devuelve `{ answer, messages: result.messages }`.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 02-react-agent

# La solución
lcdev verify 02-react-agent --solution

# Ver la traza completa (mensajes + respuesta)
lcdev run 02-react-agent --solution
```

## Criterio de éxito

- El loop del agente hace al menos **dos** llamadas al modelo (`result.calls.length >= 2`): una para decidir las tools y otra (o varias) para componer la respuesta. Con modelos pequeños puede iterar más — usamos `>=` a propósito.
- El id del modelo coincide con el proveedor configurado (`claude-*`, `gpt-*` o `gemini-*`).
- Al menos **una** de las llamadas capturadas trae `response.tool_calls` con largo `>= 1`.
- `userReturn.answer` es un string no vacío con la respuesta en lenguaje natural.
- `userReturn.messages` tiene al menos 3 elementos (human + assistant con tool_calls + assistant final; usualmente más).

## Pista

La forma canónica es así de corta:

```ts
const agent = createReactAgent({ llm: model, tools: [weatherTool, timeTool] });

const result = await agent.invoke({
  messages: [new HumanMessage("What's the weather in Lima and what time is it there?")],
});

const finalMessage = result.messages.at(-1);
const answer = typeof finalMessage?.content === "string"
  ? finalMessage.content
  : JSON.stringify(finalMessage?.content);
```

Para inspeccionar qué decidió el agente paso a paso, recorre `result.messages` y observa el tipo de cada uno (`HumanMessage`, `AIMessage` con `tool_calls`, `ToolMessage`). Ese es tu mapa mental del loop.

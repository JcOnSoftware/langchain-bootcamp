# 01 · Vincula una tool y lee los tool_calls

## Objetivo

Enseñarle al modelo a decidir, por su cuenta, cuándo una herramienta es mejor que responder de memoria. Vas a definir una tool con `tool(...)`, vincularla al chat model con `bindTools([...])` y leer el `AIMessage.tool_calls` que devuelve la primera (y única) llamada. Nada de agentes todavía: solo el paso cero.

## Contexto

Un "tool call" es una respuesta estructurada del modelo donde, en vez de texto, te devuelve `{ name, args, id }`: su intención de ejecutar una función. Tú decides si la corres o la ignoras. LangChain normaliza este formato para los tres proveedores (Anthropic, OpenAI, Gemini), así que el mismo código funciona con cualquiera de los tres.

`bindTools` devuelve un modelo nuevo con las tools registradas. El modelo NO las ejecuta: solo las ofrece y el consumidor decide. Ese es el corazón del patrón "tool use" y la base sobre la que se construyen los agentes ReAct que vienen en los siguientes ejercicios.

## Qué tienes que completar

Abre `starter.ts`. Hay cuatro TODOs:

1. **Define el cuerpo de `weatherTool`**: recibe `{ city }` y devuelve un string como `` `Sunny in ${city}, 22°C.` ``.
2. **Vincula la tool** al modelo con `model.bindTools([weatherTool])`.
3. **Invoca el modelo vinculado** con dos mensajes:
   - Un `SystemMessage` que OBLIGUE a usar la tool: `"You MUST call the get_weather tool for any weather question. Do not answer from your own knowledge."`
   - Un `HumanMessage` con la pregunta (`"What's the weather in Lima?"`).
4. **Devuelve** `{ toolCalls: ai.tool_calls ?? [], finalMessage: ai }`.

No seteas `tool_choice` a propósito: se comporta distinto en cada proveedor y el prompt firme basta para este ejercicio.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 01-bind-tools

# La solución de referencia
lcdev verify 01-bind-tools --solution

# Ver el AIMessage completo (content + tool_calls)
lcdev run 01-bind-tools --solution
```

## Criterio de éxito

- Exactamente **una** llamada al modelo (`result.calls.length === 1`). Aquí no hay loop de agente: es un único turno.
- El modelo decidió llamar al menos una tool (`result.lastCall.response.tool_calls.length >= 1`).
- La tool invocada se llama exactamente `get_weather` (asserción sobre el NOMBRE, no sobre los argumentos).
- `userReturn.toolCalls` es un array con al menos un elemento.

## Pista

El patrón se ve así de simple:

```ts
const bound = model.bindTools([weatherTool]);

const ai = (await bound.invoke([
  new SystemMessage("You MUST call the get_weather tool..."),
  new HumanMessage("What's the weather in Lima?"),
])) as AIMessage;

console.log(ai.tool_calls);
// → [{ name: "get_weather", args: { city: "Lima" }, id: "toolu_..." , type: "tool_call" }]
```

Nota importante: el harness también captura los `tool_calls` en `result.lastCall.response.tool_calls`, así que tus tests pueden asertar sobre el NOMBRE de la tool sin depender de los argumentos que el modelo haya elegido (que son no-deterministas).

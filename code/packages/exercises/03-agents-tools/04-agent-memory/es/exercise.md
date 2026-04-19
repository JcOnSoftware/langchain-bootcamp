# 04 · Memoria del agente con MemorySaver

## Objetivo

Hasta ahora cada invocación del agente empezaba de cero: ni recordaba la pregunta anterior ni sus propias respuestas. Para construir asistentes conversacionales reales necesitas **persistencia de estado entre turnos**. LangGraph lo resuelve con **checkpointers**: guardan el estado del grafo después de cada paso y lo re-hidratan si vuelves a invocar con el mismo `thread_id`.

## Contexto

Un checkpointer es "memoria del grafo", no memoria del modelo. Después de cada nodo ejecutado, el grafo serializa su estado completo (mensajes, variables auxiliares, lo que sea) y lo guarda bajo una clave. La clave la decides tú cuando invocas: se llama `thread_id`.

Regla crítica: **los dos turnos tienen que compartir el MISMO `thread_id`**. Si usas ids distintos, cada invocación arranca una conversación nueva y el modelo responde como si jamás hubiera visto tu primera pregunta. El `config` se pasa como segundo argumento a `.invoke(...)`:

```ts
const config = { configurable: { thread_id: "session-1" } };
```

Para v0.1 usamos `MemorySaver`, el checkpointer en memoria. En producción usarías el de SQLite, Postgres o Redis — pero la API es idéntica, solo cambias la clase.

El harness intercepta cada llamada al modelo igual que siempre, así que verás al menos dos entradas en `result.calls` (una por turno del agente). Si el agente decide llamar la tool en cualquier turno, verás más.

## Qué tienes que completar

Abre `starter.ts`. Cinco TODOs:

1. **Crea el checkpointer**: `const checkpointer = new MemorySaver();`.
2. **Construye el agente** con `createReactAgent({ llm, tools: [weatherTool], checkpointer })`.
3. **Define el config con un `thread_id` estable**: `const config = { configurable: { thread_id: "session-1" } };`. AMBOS turnos tienen que usarlo.
4. **Invoca dos veces** con el MISMO `config`:
   - Turno 1: `"What's the weather in Lima?"`.
   - Turno 2: `"What about in Cusco? Compare to the previous answer."` (la segunda referencia obliga al modelo a recordar).
5. **Devuelve** `{ turn1, turn2 }` con el `.content` de cada respuesta final (serializa si no es string).

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 04-agent-memory

# La solución
lcdev verify 04-agent-memory --solution

# Ver las dos respuestas
lcdev run 04-agent-memory --solution
```

## Criterio de éxito

- Al menos **dos** llamadas al modelo (`result.calls.length >= 2`) — una por turno (posiblemente más si el agente llama tools).
- El id del modelo coincide con el proveedor configurado (`claude-*`, `gpt-*` o `gemini-*`).
- `userReturn.turn1` es un string no vacío.
- `userReturn.turn2` es un string no vacío.

## Pista

El patrón canónico:

```ts
const checkpointer = new MemorySaver();
const agent = createReactAgent({ llm: model, tools: [weatherTool], checkpointer });

const config = { configurable: { thread_id: "session-1" } };

const first = await agent.invoke(
  { messages: [new HumanMessage("What's the weather in Lima?")] },
  config,
);

const second = await agent.invoke(
  { messages: [new HumanMessage("What about in Cusco? Compare to the previous answer.")] },
  config,
);
```

Si te da curiosidad el mecanismo: corre `lcdev run 04-agent-memory --solution` y mira el `turn2`. Tiene que mencionar Lima o comparar explícitamente con la respuesta anterior — si no, sospecha: seguramente pasaste `thread_id` distinto en cada turno.

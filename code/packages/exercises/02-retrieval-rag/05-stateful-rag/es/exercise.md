# 05 · RAG con estado: RunnableWithMessageHistory

## Objetivo

Envolver una cadena RAG con `RunnableWithMessageHistory` para que mantenga historial de conversación por sesión. El segundo turno de la conversación ("¿Y si el libro está dañado?") solo tiene sentido porque el primero ya estableció el contexto ("¿Cuál es la ventana de devolución?"). Sin historial, el modelo queda ciego.

## Contexto

### Estado vs stateless

LCEL puro es stateless: cada `invoke` empieza desde cero. Eso escala bien, pero no sirve para conversaciones. `RunnableWithMessageHistory` es el wrapper que te permite agregar estado POR SESIÓN sin reescribir tu cadena.

Cómo funciona bajo el capó:

1. Tú le pasas una `runnable` (tu cadena RAG normal) y una función `getMessageHistory(sessionId)` que le dice cómo cargar/guardar el historial.
2. Antes de invocar la runnable, inyecta los mensajes pasados en el `MessagesPlaceholder("history")` del prompt.
3. Después de la respuesta, guarda el par (pregunta del usuario, respuesta del modelo) en el historial de esa sesión.
4. Todo eso se activa cuando invocas con `{ configurable: { sessionId: "..." } }`.

### `InMemoryChatMessageHistory`

En producción usarías Postgres, Redis, o DynamoDB. Para ejercicios y prototipos, `InMemoryChatMessageHistory` vive en un `Map` en memoria — cero infra, perfecto para aprender.

## Qué tienes que completar

Abre `starter.ts`. Cuatro TODOs:

1. **Prompt con historial**: `ChatPromptTemplate.fromMessages([...])` con tres slots en este orden: `system` (con `{context}`), `MessagesPlaceholder("history")`, y `human` (`{question}`).
2. **Cadena RAG interna**: recibe `{ question }`, usa `RunnablePassthrough.assign({ context: async (input) => formatDocs(await retriever.invoke(input.question)) })`, luego `prompt → model → StringOutputParser`.
3. **Envolver con `RunnableWithMessageHistory`**: usa un `Map<string, InMemoryChatMessageHistory>` como backend. `inputMessagesKey: "question"`, `historyMessagesKey: "history"`.
4. **Invocar dos veces** con el MISMO `sessionId`: `"What's the return window?"` y luego `"And what if the book is damaged?"`. Devuelve `{ turn1, turn2 }`.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 05-stateful-rag

# La solución de referencia
lcdev verify 05-stateful-rag --solution

# Ver los dos turnos en acción
lcdev run 05-stateful-rag --solution
```

## Criterio de éxito

- Exactamente **dos** llamadas al modelo (una por turno). `result.calls.length === 2`.
- Ambas llamadas usan el modelo del proveedor configurado (regex `claude-*`, `gpt-*`, `gemini-*`).
- El retorno es `{ turn1, turn2 }` con ambos strings no vacíos.

## Pista

El patrón más limpio:

```ts
const sessions = new Map<string, InMemoryChatMessageHistory>();

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: ragChain,
  getMessageHistory: (sessionId: string) => {
    let h = sessions.get(sessionId);
    if (!h) { h = new InMemoryChatMessageHistory(); sessions.set(sessionId, h); }
    return h;
  },
  inputMessagesKey: "question",
  historyMessagesKey: "history",
});

const config = { configurable: { sessionId: "test-session-1" } };
const turn1 = await chainWithHistory.invoke({ question: "..." }, config);
const turn2 = await chainWithHistory.invoke({ question: "..." }, config);
```

Clave: el `sessionId` debe ser el MISMO en los dos invokes; si lo cambias, el segundo turno empieza con historial vacío y la prueba de "contexto heredado" pierde sentido.

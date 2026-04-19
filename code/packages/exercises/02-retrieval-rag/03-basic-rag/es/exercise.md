# 03 · Cadena RAG de extremo a extremo

## Objetivo

Armar tu primera cadena RAG completa: corpus → embeddings → vector store → retriever → inyección de contexto en el prompt → modelo → parser. Es el patrón canónico que vas a reutilizar en todos los sistemas RAG de aquí en adelante; una vez que lo compones a mano, las abstracciones de alto nivel dejan de parecer magia.

## Contexto

RAG (Retrieval-Augmented Generation) resuelve una limitación concreta del LLM: no conoce tus datos privados y no recuerda lo que pasó después de su fecha de corte. En vez de reentrenar el modelo, le pasas contexto relevante en el prompt, recuperado dinámicamente con una búsqueda semántica.

La arquitectura tiene dos fases:

1. **Indexación** (offline, una vez): embeber el corpus y guardarlo en un vector store.
2. **Consulta** (online, por cada pregunta): embeber la pregunta, traer los top-k documentos más cercanos, inyectarlos en el prompt, llamar al modelo.

LCEL es la herramienta para componer la fase de consulta como una cadena legible. `RunnablePassthrough.assign({ ... })` te permite agregar campos derivados sin perder los originales — clave para inyectar el `context` sin romper el input.

## Qué tienes que completar

Abre `starter.ts`. Cuatro TODOs:

1. **Indexa el corpus**: crea `Document[]`, arma el `MemoryVectorStore`, y pide un `retriever = vectorStore.asRetriever({ k: 3 })`.
2. **Arma el prompt** con dos mensajes:
   - `"system"`: instrucción para responder SOLO desde `{context}` y admitir si no hay suficiente info.
   - `"human"`: `"{question}"`.
3. **Recupera fuentes** llamando `retriever.invoke(question)`.
4. **Compón la cadena**:
   ```
   RunnablePassthrough.assign({ context: (input) => formatDocs(input.sources) })
     .pipe(prompt)
     .pipe(model)
     .pipe(new StringOutputParser())
   ```
   Invoca con `{ question, sources }` y devuelve `{ answer, sources }`.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 03-basic-rag

# La solución de referencia
lcdev verify 03-basic-rag --solution

# Ver la respuesta con las fuentes
lcdev run 03-basic-rag --solution
```

## Criterio de éxito

- Exactamente **una** llamada al modelo de chat (`result.calls.length === 1`). La recuperación no cuenta — el harness de v0.1 no intercepta embeddings.
- El id del modelo coincide con el proveedor configurado (`claude-*`, `gpt-*` o `gemini-*`).
- El retorno es `{ answer, sources }` con `answer` string no vacío y `sources` array con al menos un `Document`.
- Cada `Document` de `sources` tiene `pageContent` no vacío.

## Pista

El truco del patrón es separar "qué recuperas" de "cómo lo inyectas". Recupera fuera de la cadena (para poder devolverlas junto con la respuesta), y dentro de la cadena solo derivas el `context` a partir de esas fuentes:

```ts
const sources = await retriever.invoke(question);

const chain = RunnablePassthrough.assign({
  context: new RunnableLambda({
    func: (input: { question: string; sources: Document[] }) => formatDocs(input.sources),
  }),
})
  .pipe(prompt)
  .pipe(model)
  .pipe(new StringOutputParser());

const answer = await chain.invoke({ question, sources });
```

Así devuelves `{ answer, sources }` sin tener que llamar al retriever dos veces.

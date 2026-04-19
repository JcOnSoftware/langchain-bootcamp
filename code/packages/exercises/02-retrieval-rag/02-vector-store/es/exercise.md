# 02 · Embeber un corpus en MemoryVectorStore y consultarlo

## Objetivo

Embeber un pequeño corpus (8 textos sobre bebidas), indexarlo en `MemoryVectorStore`, y recuperar los 3 más cercanos a una consulta semántica. Es el esqueleto de cualquier sistema RAG — entender esta pieza aislada hace que los ejercicios siguientes encajen sin fricción.

## Contexto

Una **embedding** es un vector de números reales que representa el "significado" de un texto en un espacio de alta dimensión. Textos con significado parecido caen cerca en ese espacio. Una similarity search es, literalmente, buscar los vectores más cercanos (coseno, por defecto) al vector de tu consulta.

`MemoryVectorStore` es el store más simple: vive en memoria, cero infraestructura. Perfecto para ejercicios y prototipos. En producción lo cambias por pgvector, Qdrant o lo que corresponda — la API de LangChain es la misma.

**Nota clave**: Anthropic no tiene embeddings nativos en LangChain 1.x. `createEmbeddings(...)` hace fallback a `OpenAIEmbeddings` automáticamente, así que necesitas `OPENAI_API_KEY` si tu `LCDEV_PROVIDER` es Anthropic.

## Qué tienes que completar

Abre `starter.ts`. Tres TODOs:

1. **Convierte `CORPUS` en `Document[]`** con `metadata.source = entry.id`. Mismo patrón del ejercicio anterior.
2. **Crea el store** con `MemoryVectorStore.fromDocuments(docs, embeddings)`. Una sola línea — la factoría se encarga de llamar a `embeddings.embedDocuments` internamente.
3. **Consulta** con `store.similaritySearch(query, 3)`. Usa una consulta como `"a strong, pressurized coffee shot with crema"`; debería devolver "espresso" entre los top 3.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 02-vector-store

# La solución de referencia
lcdev verify 02-vector-store --solution

# Ver qué docs salieron como top-3
lcdev run 02-vector-store --solution
```

## Criterio de éxito

- Cero llamadas al modelo de chat. `result.calls.length === 0` — el harness NO captura `embedDocuments`/`embedQuery` en v0.1. Eso llega en el track 06 (observability).
- El retorno es `{ results }` con un array de `Document`.
- `results.length === 3` (exactamente, no más, no menos).
- Cada documento devuelto tiene `pageContent` no vacío.

## Pista

```ts
const docs = CORPUS.map(
  (e) => new Document({ pageContent: e.text, metadata: { source: e.id } }),
);

const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
const results = await store.similaritySearch("a strong, pressurized coffee shot with crema", 3);
```

Si la consulta no saca "espresso" en el top 3, revisa que el corpus esté entero (todos los 8 docs) y que la consulta mencione atributos semánticos del espresso (presión, crema, shot), no palabras genéricas como "coffee".

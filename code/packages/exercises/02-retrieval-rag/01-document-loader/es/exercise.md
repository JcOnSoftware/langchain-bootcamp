# 01 · Construir y dividir un corpus de Documents

## Objetivo

Antes de embebidos, antes de vectores, antes de RAG, hay un paso aburrido pero fundamental: convertir texto plano en `Document[]` y partirlo en trozos manejables. En este ejercicio armas un corpus pequeño de artículos de soporte y lo divides con `RecursiveCharacterTextSplitter`. Sin APIs, sin costos.

## Contexto

Un `Document` en LangChain es solo `{ pageContent: string, metadata: Record<string, unknown> }`. Parece poco, pero ese `metadata` es el hilo que conecta un chunk con su artículo original, su URL, su autor, o lo que tú decidas rastrear después.

`RecursiveCharacterTextSplitter` parte el texto intentando respetar separadores naturales (párrafos → frases → espacios → caracteres) en ese orden. Los parámetros importan:

- `chunkSize`: tamaño máximo deseado por chunk.
- `chunkOverlap`: caracteres que se repiten entre chunks vecinos para no perder contexto en los bordes.

## Qué tienes que completar

Abre `starter.ts`. Hay tres TODOs:

1. **Construye el `Document[]`** a partir del `CORPUS` inline. Cada `Document` debe llevar `metadata: { source: entry.id }` — ese `source` es tu rastro de auditoría más adelante.
2. **Configura el splitter** con `chunkSize: 180` y `chunkOverlap: 20`. Los números no son arbitrarios: con textos de 200-400 caracteres obligan al splitter a partir en al menos un chunk por artículo.
3. **Llama a `splitter.splitDocuments(sourceDocs)`** y devuélvelo como `chunks`.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 01-document-loader

# La solución de referencia
lcdev verify 01-document-loader --solution

# Ver el output con los chunks reales
lcdev run 01-document-loader --solution
```

## Criterio de éxito

- Cero llamadas al modelo (`result.calls.length === 0`). Este ejercicio es puramente local.
- El valor de retorno es un objeto `{ chunks }` con un array.
- Se producen al menos **5 chunks** (uno por artículo, como mínimo).
- Cada chunk tiene `pageContent` no vacío y un objeto `metadata`.
- El conjunto de valores `metadata.source` cubre las 5 fuentes originales.

## Pista

El patrón canónico es simple:

```ts
const sourceDocs = CORPUS.map(
  (entry) => new Document({ pageContent: entry.text, metadata: { source: entry.id } }),
);

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 180, chunkOverlap: 20 });
const chunks = await splitter.splitDocuments(sourceDocs);
```

Si quieres experimentar, prueba a bajar `chunkSize` a 80 y ver cómo crece el número de chunks. Esa es la intuición que vas a necesitar en el próximo ejercicio.

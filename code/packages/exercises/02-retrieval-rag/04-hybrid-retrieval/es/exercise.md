# 04 · Recuperación híbrida: MMR + reranking por keywords

## Objetivo

La búsqueda semántica pura es potente pero ciega a coincidencias literales. Este ejercicio combina dos técnicas complementarias: **MMR** (Maximal Marginal Relevance) para traer candidatos relevantes y diversos, y un **keyword-boost** simple para empujar hacia arriba los documentos que contienen palabras clave del dominio.

## Contexto

### MMR — relevancia con diversidad

`similaritySearch` te devuelve los top-k más cercanos, pero esos k pueden ser casi duplicados entre sí (pensando lo mismo con otras palabras). MMR pide más candidatos (`fetchK`) y elige `k` que maximizan un compromiso entre "cerca de la consulta" y "lejos de los ya elegidos". Resultado: diversidad sin perder pertinencia.

### Keyword-boost — lo literal importa

Cuando tu dominio tiene términos específicos (nombres de APIs, errores concretos, siglas), un match exacto en el `pageContent` suele ser más valioso que una similitud semántica difusa. Un reranker simple que ordena por "número de keywords presentes" antes de devolver resulta sorprendentemente efectivo.

### `RunnableLambda`

Para que tu reranker sea una pieza de LCEL (pipeable, debugeable, componible), envuélvelo en un `RunnableLambda`. Una función pura → un `Runnable`. Es el puente entre código JS plano y el pipeline declarativo.

## Qué tienes que completar

Abre `starter.ts`. Tres TODOs:

1. **Implementa `keywordBoost(docs)`**: cuenta cuántas `KEYWORDS` aparecen (case-insensitive) en cada `pageContent` y reordena DESCENDENTE por esa cuenta. Ante empate, conserva el orden de entrada (sort estable).
2. **MMR search**: `vectorStore.maxMarginalRelevanceSearch(QUERY, { k: 4, fetchK: 8 })`. El `fetchK: 8` trae los 8 más relevantes; MMR elige los 4 finales buscando diversidad.
3. **Invoca el reranker**: `RunnableLambda` envolviendo `keywordBoost`, luego `.invoke(raw)`.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 04-hybrid-retrieval

# La solución de referencia
lcdev verify 04-hybrid-retrieval --solution

# Ver el efecto del reranking en la práctica
lcdev run 04-hybrid-retrieval --solution
```

## Criterio de éxito

- Cero llamadas al modelo de chat.
- El retorno es `{ raw, reranked }` con exactamente 4 `Document` en cada array.
- Al menos uno de los dos documentos top-2 de `reranked` contiene literalmente la palabra `"exception"` en su `pageContent`.
- El conjunto de documentos en `reranked` es el mismo que en `raw` (misma gente, otro orden).

## Pista

El sort estable en JS viene gratis desde ES2019. Patrón clásico:

```ts
function keywordBoost(docs: Document[]): Document[] {
  const scored = docs.map((doc) => {
    const text = doc.pageContent.toLowerCase();
    const hits = KEYWORDS.filter((k) => text.includes(k.toLowerCase())).length;
    return { doc, hits };
  });
  scored.sort((a, b) => b.hits - a.hits);
  return scored.map((s) => s.doc);
}
```

El `map→sort→map` te da un reranker puro, testeable, y fácil de extender: agregar un peso por recencia o por fuente es solo sumar al score.

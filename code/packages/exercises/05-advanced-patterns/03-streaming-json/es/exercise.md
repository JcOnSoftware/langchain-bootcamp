# 03 · Streaming JSON — objetos parseados incrementalmente con JsonOutputParser

## Objetivo

Hacer streaming de una respuesta JSON desde cualquier modelo y recolectar los objetos parciales a medida que llegan. Encadenarás `prompt → model → JsonOutputParser` y llamarás `.stream()` en vez de `.invoke()`.

## Contexto

`JsonOutputParser` hace dos cosas: parsea el texto crudo del modelo como JSON, y — cuando se usa con `.stream()` — emite objetos parciales ensamblados incrementalmente a medida que llegan los tokens. Al terminar el stream, el último chunk es el objeto parseado completamente.

Esto es especialmente útil para UIs que quieren renderizar datos estructurados progresivamente, sin esperar la respuesta completa.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Definir un `ChatPromptTemplate`** que pida un objeto JSON con exactamente tres campos: `name`, `capital`, `population` para un país específico.
2. **Crear una instancia de `JsonOutputParser`**.
3. **Encadenar** `prompt.pipe(model).pipe(parser)`.
4. **Hacer stream** con `chain.stream({})` y recolectar todos los chunks emitidos en un array.
5. **Retornar** `{ chunks, final: chunks.at(-1) }`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 03-streaming-json              # tu código
lcdev verify 03-streaming-json --solution   # referencia
lcdev run    03-streaming-json --solution   # inspeccionar los chunks
```

## Criterio de éxito

- `result.userReturn.chunks.length > 1` — se emitió más de un objeto parcial.
- `result.userReturn.final` es un objeto no nulo con las claves esperadas.
- Al menos una llamada al modelo es capturada con `streamed === true`.

## Pista

Llamar `.stream()` dispara `_streamIterator` en el modelo subyacente — el harness lo captura con `streamed: true`. El `JsonOutputParser` transforma tokens de texto crudo en objetos JSON parciales:

```ts
const stream = await chain.stream({});
const chunks: unknown[] = [];
for await (const chunk of stream) {
  chunks.push(chunk);
}
// chunks = [{}, { name: "" }, { name: "Peru" }, { name: "Peru", capital: "" }, ...]
```

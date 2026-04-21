# 01 · LangSmith tracing — recolección de runs y callbacks de observabilidad

## Objetivo

Instrumenta una cadena LangChain con `RunCollectorCallbackHandler` para capturar runs de forma offline, y aprende a agregar `LangChainTracer` cuando tienes una API key de LangSmith configurada.

## Contexto

LangChain tiene un sistema de callbacks que dispara eventos en cada etapa del ciclo de vida de una llamada: inicio, nuevo token, fin, error. `RunCollectorCallbackHandler` acumula todos esos eventos en memoria — sin necesidad de una cuenta de LangSmith — en `collector.tracedRuns`. Es ideal para debug local y tests.

`LangChainTracer` hace lo mismo pero envía los runs a la plataforma LangSmith (si tienes `LANGCHAIN_API_KEY`). Puedes combinar ambos en el mismo array de callbacks: el collector siempre activo, el tracer solo cuando la key está disponible.

El array de callbacks se pasa en el segundo argumento de `model.invoke(input, { callbacks })`. Cada handler en el array recibe los mismos eventos en paralelo.

El escenario de `LangChainTracer` se omite automáticamente si `LANGCHAIN_API_KEY` no está configurada.

### Gotcha — flush de uploads a LangSmith

`LangChainTracer` delega los uploads HTTP a una instancia del `Client` de `langsmith`. Esos uploads son **batched y async**: el tracer encola cada run y los envía por bloques. En scripts de vida corta (como `lcdev run` o un bun test), el proceso de Node.js termina antes de que el queue se vacíe — y los runs nunca llegan a tu dashboard de LangSmith, aunque el código haya corrido y la API key sea válida.

El fix es explícito: crea el `Client` tú mismo, pásaselo a `LangChainTracer({ client })`, y haz `await client.awaitPendingTraceBatches()` antes de retornar. Esto bloquea hasta que todos los batches pendientes hayan sido enviados.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Crear el collector**: `const collector = new RunCollectorCallbackHandler()`.
2. **Construir el array de callbacks**: siempre incluye `collector`; si `process.env["LANGCHAIN_API_KEY"]` existe, instancia `const client = new Client()` y agrega `new LangChainTracer({ client })` — así puedes flushearlo después.
3. **Invocar el modelo** con un mensaje simple pasando `{ callbacks }` como segundo argumento.
4. **Flush de traces pendientes** con `await client.awaitPendingTraceBatches()` cuando tracing está activo — sin esto, los runs nunca llegan a LangSmith.
5. **Retornar** el objeto con:
   - `collectedRuns`: `collector.tracedRuns` mapeado a `{ id, name, run_type }`.
   - `tracingEnabled`: `boolean` que indica si `LANGCHAIN_API_KEY` está presente.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 01-langsmith-tracing              # tu código
lcdev verify 01-langsmith-tracing --solution   # referencia
lcdev run    01-langsmith-tracing --solution   # inspeccionar el objeto retornado
```

## Criterio de éxito

- Al menos una llamada al modelo es capturada por el harness.
- `collectedRuns.length >= 1` — el collector recolectó al menos un run.
- Cada run tiene las claves `id`, `name` y `run_type` con valores de tipo string.
- `tracingEnabled` refleja correctamente si `LANGCHAIN_API_KEY` está en el entorno.
- El test de `LangChainTracer` se omite (no falla) si no tienes `LANGCHAIN_API_KEY`.

## Pista

La clave: el array de callbacks se construye dinámicamente según el entorno. Un patrón limpio:

```ts
const tracingEnabled = !!process.env["LANGCHAIN_API_KEY"];
const client = tracingEnabled ? new Client() : undefined;
const callbacks =
  tracingEnabled && client
    ? [collector, new LangChainTracer({ client })]
    : [collector];

await model.invoke([new HumanMessage("...")], { callbacks });

if (client) {
  await client.awaitPendingTraceBatches();
}
```

Después del invoke, `collector.tracedRuns` ya tiene los runs populados. Mapéalos con `.map(r => ({ id: r.id, name: r.name, run_type: r.run_type }))`. Si te saltas el `awaitPendingTraceBatches()`, los tests pasan igual (el collector trabaja offline) pero LangSmith no te va a mostrar nada.

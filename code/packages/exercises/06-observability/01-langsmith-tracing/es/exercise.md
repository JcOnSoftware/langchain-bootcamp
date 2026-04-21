# 01 · LangSmith tracing — recolección de runs y callbacks de observabilidad

## Objetivo

Instrumenta una cadena LangChain con `RunCollectorCallbackHandler` para capturar runs de forma offline, y aprende a agregar `LangChainTracer` cuando tienes una API key de LangSmith configurada.

## Contexto

LangChain tiene un sistema de callbacks que dispara eventos en cada etapa del ciclo de vida de una llamada: inicio, nuevo token, fin, error. `RunCollectorCallbackHandler` acumula todos esos eventos en memoria — sin necesidad de una cuenta de LangSmith — en `collector.tracedRuns`. Es ideal para debug local y tests.

`LangChainTracer` hace lo mismo pero envía los runs a la plataforma LangSmith (si tienes `LANGCHAIN_API_KEY`). Puedes combinar ambos en el mismo array de callbacks: el collector siempre activo, el tracer solo cuando la key está disponible.

El array de callbacks se pasa en el segundo argumento de `model.invoke(input, { callbacks })`. Cada handler en el array recibe los mismos eventos en paralelo.

El escenario de `LangChainTracer` se omite automáticamente si `LANGCHAIN_API_KEY` no está configurada.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Crear el collector**: `const collector = new RunCollectorCallbackHandler()`.
2. **Construir el array de callbacks**: siempre incluye `collector`; si `process.env["LANGCHAIN_API_KEY"]` existe, también agrega `new LangChainTracer()`.
3. **Invocar el modelo** con un mensaje simple pasando `{ callbacks }` como segundo argumento.
4. **Retornar** el objeto con:
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
const callbacks = tracingEnabled
  ? [collector, new LangChainTracer()]
  : [collector];

await model.invoke([new HumanMessage("...")], { callbacks });
```

Después del invoke, `collector.tracedRuns` ya tiene los runs populados. Mapéalos con `.map(r => ({ id: r.id, name: r.name, run_type: r.run_type }))`.

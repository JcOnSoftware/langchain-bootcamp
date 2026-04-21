# 05 · Production checklist — retry, fallback, costo, error boundary y run collector

## Objetivo

Combinar las 5 técnicas de producción de este track en una sola cadena endurecida: reintentos automáticos, modelo de respaldo, logging de costo, captura de errores y recolección de runs. Este es el ejercicio capstone de observabilidad.

## Contexto

En producción, una sola llamada al modelo puede fallar por rate limits, latencia, errores de red o respuestas malformadas. Una cadena robusta tiene capas de defensa:

1. **`withRetry({ stopAfterAttempt: N })`** — reintenta automáticamente en errores transitorios.
2. **`withFallbacks([backupModel])`** — si el modelo principal agota los intentos, el backup toma el control.
3. **Cost callback** (`BaseCallbackHandler.handleLLMEnd`) — registra tokens usados por cada llamada.
4. **Error-boundary callback** (`handleLLMError`) — captura errores sin crashear la aplicación.
5. **`RunCollectorCallbackHandler`** — recolecta runs offline para debug posterior.

Las capas se encadenan así:
```ts
const modelWithRetry = primaryModel.withRetry({ stopAfterAttempt: 2 });
const modelWithFallback = modelWithRetry.withFallbacks([backupModel]);
await modelWithFallback.invoke(input, { callbacks: [costCb, errorBoundaryCb, collector] });
```

`wrapperTypes` es un array declarativo — defines tú mismo los nombres que resumen qué técnicas aplicaste. El test verifica que declares los 5 strings esperados.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Crear el modelo principal** con `.withRetry({ stopAfterAttempt: 2 })`.
2. **Encadenar el fallback** con `.withFallbacks([backupModel])`.
3. **Completar `CostCallbackHandler.handleLLMEnd`**: extraer tokens de `output.llmOutput` y pushear a `this.costLog`.
4. **Completar `ErrorBoundaryHandler.handleLLMError`**: pushear el error a `this.errors`.
5. **Instanciar los 3 callbacks** e invocar la cadena con todos.
6. **Declarar `wrapperTypes`** = `["withRetry", "withFallbacks", "costCallback", "errorBoundary", "runCollector"]`.
7. **Retornar** el objeto con `wrapperTypes`, `callSucceeded: true`, `tracedRuns: collector.tracedRuns`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 05-production-checklist              # tu código
lcdev verify 05-production-checklist --solution   # referencia
lcdev run    05-production-checklist --solution   # inspeccionar las capas activas
```

## Criterio de éxito

- Al menos una llamada al modelo es capturada por el harness.
- `wrapperTypes.length >= 5`.
- `wrapperTypes` contiene exactamente: `"withRetry"`, `"withFallbacks"`, `"costCallback"`, `"errorBoundary"`, `"runCollector"`.
- `callSucceeded === true`.
- `tracedRuns.length >= 1` — el collector recolectó al menos un run.

## Pista

El orden de las capas importa: retry primero, fallback envuelve el retry. Los callbacks van en el `invoke`, no en el constructor del modelo:

```ts
const modelWithRetry = createChatModel(provider, apiKey).withRetry({ stopAfterAttempt: 2 });
const modelWithFallback = modelWithRetry.withFallbacks([createChatModel(provider, apiKey) as any]);

await modelWithFallback.invoke(input, {
  callbacks: [costCallback, errorBoundary, collector],
});
```

# 02 · Fallback y Retry — chains resilientes cuando falla el primario

## Objetivo

Construir una chain que maneja con gracia el fallo de un primario y redirige a un modelo de respaldo. Usarás `RunnableLambda` como primario con fallo determinista y `.withFallbacks([realModel])` para recuperarte automáticamente.

## Contexto

Los pipelines LLM en producción fallan. Los modelos se caen, los rate limits se alcanzan, las API keys vencen. `.withFallbacks([...])` de LangChain es la forma idiomática de manejarlo: defines una lista de alternativas y LangChain las intenta en orden cuando el primario lanza error.

Por razones pedagógicas, usarás un `RunnableLambda` que **siempre lanza** para simular un primario roto. El fallback es un modelo real. Esto mantiene el test determinista y consume mínimos tokens.

APIs clave:

- `RunnableLambda.from(async (input) => { ... })` — envuelve cualquier función async como `Runnable`.
- `.withRetry({ stopAfterAttempt: 1 })` — previene reintentos por defecto para que el fallback se alcance inmediatamente.
- `.withFallbacks([fallback])` — registra runnables de respaldo.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Definir un `brokenPrimary`** usando `RunnableLambda.from(...)` que siempre lanza, encadenado con `.withRetry({ stopAfterAttempt: 1 })`.
2. **Encadenarlo** con `.withFallbacks([fallbackModel])`.
3. **Invocar** la chain y extraer el contenido de texto de la respuesta.
4. **Retornar** `{ result: text, usedFallback: true }`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 02-fallback-retry              # tu código
lcdev verify 02-fallback-retry --solution   # referencia
```

## Criterio de éxito

- `result.userReturn.usedFallback === true`.
- `result.userReturn.result` es un string no vacío.
- Al menos una llamada al modelo es capturada (la del fallback).

## Pista

El harness solo captura llamadas a `BaseChatModel.invoke()`. El `RunnableLambda` lanza antes de llegar a cualquier modelo — así que `calls.length` refleja solo las invocaciones del modelo fallback.

```ts
const chain = brokenPrimary.withFallbacks([realModel]);
const response = await chain.invoke([new HumanMessage("...")]);
```

# 05 · Invocaciones en paralelo con chain.batch

## Objetivo

Ejecutar la misma cadena sobre varios inputs en paralelo usando `chain.batch([...])`. Es la forma idiomática de LCEL para procesar lotes sin escribir tu propio `Promise.all`.

## Contexto

Cada `Runnable` de LCEL expone tres métodos de invocación:

- `invoke(input)` — una sola ejecución.
- `batch(inputs[])` — varias ejecuciones en paralelo (con control de concurrencia opcional).
- `stream(input)` — streaming token por token.

`batch` no es azúcar sintáctico sobre un loop: LCEL lo paraleliza internamente, respeta rate limits, y te devuelve los resultados en el mismo orden que los inputs. Para workloads como "generar un resumen para cada documento" o "traducir tres versiones del mismo texto", `batch` es tu amigo.

## Qué tienes que completar

Abre `starter.ts`. Hay tres TODOs:

1. **Prompt** — exactamente el mismo de `01-hello-chain`: system + human con variable `{topic}`.
2. **Composición** — `prompt.pipe(model).pipe(new StringOutputParser())`.
3. **Batch** — `chain.batch([{ topic: "LCEL" }, { topic: "agents" }, { topic: "RAG" }])` y devuelve el array.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 05-batch

# La solución de referencia
lcdev verify 05-batch --solution

# Ver output real
lcdev run 05-batch --solution
```

## Criterio de éxito

- La cadena hace exactamente **tres** llamadas al modelo (una por item del batch).
- Todas las llamadas usan el proveedor configurado.
- Los tokens de input y output son positivos en las tres llamadas.
- El valor de retorno es un array de tres strings no vacíos.

## Pista

La diferencia entre un loop y `batch` se nota cuando tienes muchos items: un loop espera cada promesa antes de lanzar la siguiente; `batch` las lanza todas en paralelo. Si quieres limitar la concurrencia:

```ts
await chain.batch(inputs, { maxConcurrency: 5 });
```

En este ejercicio tres items caben sin preocuparte por rate limits, pero acostúmbrate al patrón: `maxConcurrency` es tu válvula de escape cuando el proveedor se queja.

# 01 · Tu primer StateGraph — nodos, edges, estado tipado

## Objetivo

Construir tu primer grafo LangGraph. Dos nodos, un estado tipado con `Annotation.Root`, y aristas explícitas desde `START` hasta `END`. Es el "Hola, mundo" de los grafos. Si entiendes cómo se define el estado y cómo los reducers mergean updates entre nodos, ya tienes el 80% del modelo mental de LangGraph.

## Contexto

Un `StateGraph` es un grafo dirigido donde cada nodo es una función que recibe el estado actual y devuelve un update parcial. Los **reducers** definen cómo se mergea ese update en el estado.

En este ejercicio vas a:

1. Definir un esquema de estado con dos campos — `counter` (número con reducer de suma) y `log` (array de strings con reducer de concat).
2. Escribir dos nodos que devuelvan updates parciales.
3. Armar el grafo con `START → n1 → n2 → END`.
4. Invocarlo y devolver el estado final.

## Qué tienes que completar

Abre `starter.ts`. Tres TODOs:

1. **Define `State`** con `Annotation.Root({...})`. Cada campo usa `Annotation<T>({ reducer, default })`.
2. **Escribe los nodos** `n1` y `n2`. Cada uno retorna un update parcial (por ejemplo `{ counter: 10, log: ["n1 ran"] }`) y además hace `nodesVisited.push(...)`.
3. **Arma y compila el grafo**, y luego `await graph.invoke({ counter: 0, log: [] })`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 01-state-graph-basics              # tu código
lcdev verify 01-state-graph-basics --solution   # referencia
lcdev run    01-state-graph-basics --solution   # ver el estado final
```

## Criterio de éxito

- El grafo hace **cero** llamadas al modelo (es lógica pura, sin LLM).
- `final.counter === 15` (el reducer suma las contribuciones de ambos nodos).
- `final.log.length === 2` (el reducer concatena).
- `nodesVisited` es `["n1", "n2"]` en ese orden.

## Pista

El patrón canónico para un reducer de suma:

```ts
counter: Annotation<number>({
  reducer: (current, update) => current + update,
  default: () => 0,
}),
```

Y para concatenar listas:

```ts
log: Annotation<string[]>({
  reducer: (current, update) => [...current, ...update],
  default: () => [],
}),
```

Si omites el reducer, el default es **reemplazar** (el último update gana). Por eso los reducers personalizados son lo que hace mergear bien.

# 01 · Your first StateGraph — nodes, edges, typed state

## Goal

Build your first LangGraph graph. Two nodes, a typed state via `Annotation.Root`, and explicit edges from `START` to `END`. It's the "Hello, world" of graphs. If you understand how state is defined and how reducers merge updates between nodes, you have 80% of LangGraph's mental model.

## Context

A `StateGraph` is a directed graph where each node is a function that receives the current state and returns a partial update. **Reducers** define how that update merges into the state.

In this exercise you will:

1. Define a state schema with two fields — `counter` (number with a sum reducer) and `log` (string array with a concat reducer).
2. Write two node functions that return partial updates.
3. Build the graph `START → n1 → n2 → END`.
4. Invoke it and return the final state.

## What to complete

Open `starter.ts`. Three TODOs:

1. **Define `State`** using `Annotation.Root({...})`. Each field uses `Annotation<T>({ reducer, default })`.
2. **Write the two nodes** `n1` and `n2`. Each returns a partial update (e.g., `{ counter: 10, log: ["n1 ran"] }`) and pushes its name into `nodesVisited`.
3. **Build and compile the graph**, then `await graph.invoke({ counter: 0, log: [] })`.

## How to verify

From `code/`:

```bash
lcdev verify 01-state-graph-basics              # your code
lcdev verify 01-state-graph-basics --solution   # reference
lcdev run    01-state-graph-basics --solution   # inspect the final state
```

## Success criteria

- The graph makes **zero** model calls (this is pure logic — no LLM).
- `final.counter === 15` (reducer sums both nodes' contributions).
- `final.log.length === 2` (reducer concatenates).
- `nodesVisited` is `["n1", "n2"]` in that order.

## Hint

Canonical sum-reducer pattern:

```ts
counter: Annotation<number>({
  reducer: (current, update) => current + update,
  default: () => 0,
}),
```

And for concatenating lists:

```ts
log: Annotation<string[]>({
  reducer: (current, update) => [...current, ...update],
  default: () => [],
}),
```

If you omit the reducer, the default is **replace** (last update wins). That's why explicit reducers are what make merges behave.

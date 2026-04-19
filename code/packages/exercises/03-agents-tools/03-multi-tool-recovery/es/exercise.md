# 03 · Recuperación ante tool que falla

## Objetivo

En el mundo real las tools se caen: la API upstream devuelve 500, el timeout expira, la base de datos no responde. Un agente bien diseñado NO debe explotar cuando eso pasa — tiene que leer el error como si fuera cualquier otro output, decidir un plan B y responderle al usuario con lo que pudo recoger. En este ejercicio vas a modelar esa situación a propósito: tres tools, una de ellas condenada a fallar, y el agente tiene que hacer el trabajo igual.

## Contexto

El patrón canónico de LangChain para tools resilientes es **atrapar el error DENTRO del cuerpo de la tool y devolver un string** en vez de dejar que la excepción se propague. Así:

```ts
try {
  throw new Error("Upstream service down");
} catch (err) {
  return `Tool error: ${err.message}`;
}
```

El agente lee ese string igual que cualquier otro resultado, entiende que la tool falló, y decide usar otra. Si dejas que el error explote, el grafo del ReAct se rompe y el `invoke()` tira una excepción al caller.

Un detalle importante: los tests verifican que la tool rota realmente se llamó. Para eso usamos un flag a nivel de módulo (`let brokenInvoked = false`) que la tool flipa en su catch. Es la forma más simple de confirmar "sí, el modelo decidió llamarla, y sí, tu catch se ejecutó".

## Qué tienes que completar

Abre `starter.ts`. Cinco TODOs:

1. **`lookup_by_id({ id })`**: devuelve un string simulando un item encontrado (`Item with id "X": {...}`).
2. **`lookup_by_name({ name })`**: devuelve un string con uno o más matches.
3. **`broken_search({ query })`**: hace `throw new Error("Upstream service down")` dentro de un `try`, atrapa, pone `brokenInvoked = true`, y devuelve `"Tool error: ${err.message}"`.
4. **Construye el agente** con `createReactAgent({ llm, tools: [lookupByIdTool, lookupByNameTool, brokenSearchTool] })`.
5. **Invoca con el prompt forzante**: `"Look up 'product-42' using every available tool; report what you find."` — la palabra "every" empuja al modelo a explorar las tres tools, incluida la rota.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 03-multi-tool-recovery

# La solución
lcdev verify 03-multi-tool-recovery --solution

# Ver la traza completa
lcdev run 03-multi-tool-recovery --solution
```

## Criterio de éxito

- `runUserCode` no lanza excepción (el agente recuperó del fallo y cerró el loop limpiamente).
- El loop del agente hace al menos **dos** llamadas al modelo (`result.calls.length >= 2`).
- `userReturn.answer` es un string no vacío.
- `userReturn.errorSeen === true` — esto confirma que `broken_search` se invocó y que su catch se ejecutó. Si el flag es false, tu prompt no empujó al modelo a probar la tool rota, o la tool se registró mal.

## Pista

El truco es NO dejar que el error escape. Mira el patrón:

```ts
const brokenSearchTool = tool(
  async ({ query }) => {
    try {
      throw new Error("Upstream service down");
    } catch (err) {
      brokenInvoked = true;
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
  { name: "broken_search", description: "...", schema: z.object({ query: z.string() }) },
);
```

Si quieres ver el loop completo, `lcdev run ... --solution` imprime `result.messages` — busca el `ToolMessage` con `content: "Tool error: Upstream service down"` y el `AIMessage` siguiente donde el agente decide usar otra tool.

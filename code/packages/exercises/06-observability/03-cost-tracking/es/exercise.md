# 03 · Cost tracking — calcular el costo de tokens desde usage_metadata

## Objetivo

Leer `usage_metadata` de la respuesta del modelo, definir una tabla de precios por familia de modelos y calcular el costo exacto de cada llamada. Esta es la base para cualquier sistema de monitoreo de gasto en producción.

## Contexto

Cuando invocas un chat model con LangChain, la respuesta `AIMessage` incluye `usage_metadata` con los tokens consumidos: `input_tokens`, `output_tokens` y a veces `total_tokens`. Este campo está normalizado por LangChain — los tres proveedores (Anthropic, OpenAI, Gemini) lo reportan en la misma forma.

El costo se calcula con una tabla de precios: la mayoría de proveedores cobran diferente por tokens de entrada y de salida. Los precios están en USD por millón de tokens.

```
inputCost = (inputTokens / 1_000_000) * inputRateUSD
outputCost = (outputTokens / 1_000_000) * outputRateUSD
totalCost = inputCost + outputCost
```

El id del modelo viene de `response.response_metadata.model_name` (Anthropic) o `.model` (OpenAI/Gemini). Lo usas para buscar el rate correcto en tu tabla.

**Importante**: NO importes desde `@lcdev/runner/cost` ni de ningún otro módulo del CLI. Defines la tabla inline — ese es el punto del ejercicio.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Llenar `RATES`**: agrega entradas para los modelos que usas (`haiku`, `sonnet`, `gpt-4o-mini`, `gemini-2.5-flash`). Usa regex para que el match sea resiliente a variantes del nombre.
2. **Implementar `computeCost`**: busca el rate que hace match con `modelId` y calcula `inputCost`, `outputCost`, `totalCost`.
3. **Invocar el modelo** con un mensaje simple.
4. **Leer `usage_metadata`** de la respuesta: `(response as any).usage_metadata`.
5. **Leer `modelId`** desde `response_metadata.model_name` o `response_metadata.model`.
6. **Retornar** el objeto completo con todos los campos.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 03-cost-tracking              # tu código
lcdev verify 03-cost-tracking --solution   # referencia
lcdev run    03-cost-tracking --solution   # inspeccionar los valores de costo
```

## Criterio de éxito

- Al menos una llamada al modelo es capturada por el harness.
- `inputTokens > 0` — el modelo consumió tokens de entrada.
- `outputTokens > 0` — el modelo generó tokens de salida.
- `totalCost > 0` — el modelo tiene un rate en tu tabla y el costo se calcula correctamente.
- `Math.abs(totalCost - (inputCost + outputCost)) < 1e-9` — la aritmética es exacta.
- `modelId` es un string no vacío.

## Pista

Para leer `usage_metadata` de forma segura en TypeScript:

```ts
const usageMetadata = (response as { usage_metadata?: Record<string, unknown> }).usage_metadata;
const inputTokens = typeof usageMetadata?.["input_tokens"] === "number"
  ? usageMetadata["input_tokens"]
  : 0;
```

El `modelId` viene de `response_metadata`:

```ts
const responseMetadata = (response as { response_metadata?: Record<string, unknown> }).response_metadata;
const modelId = typeof responseMetadata?.["model_name"] === "string"
  ? responseMetadata["model_name"]
  : (typeof responseMetadata?.["model"] === "string" ? responseMetadata["model"] : "");
```

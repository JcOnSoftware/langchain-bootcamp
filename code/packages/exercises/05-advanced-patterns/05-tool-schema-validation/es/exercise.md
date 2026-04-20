# 05 · Validación de schema de tool — args con Zod usando `tool()` y `bindTools`

## Objetivo

Definir un tool con un schema Zod para sus argumentos, vincularlo a un modelo, verificar que el modelo lo llama con args válidos, y demostrar que los args inválidos son rechazados por el schema antes de que la función se ejecute.

## Contexto

`tool()` es la API recomendada de LangChain 1.x para definir tools invocables. Cuando pasas una opción `schema` con un objeto Zod, LangChain valida los args a través de ese schema cada vez que el tool es invocado — ya sea llamado por el modelo vía `bindTools` o directamente.

La validación ocurre dentro de `tool.invoke()`, no al nivel del modelo. El modelo envía `tool_calls` en JSON; LangChain parsea el JSON y valida el objeto resultante a través de Zod antes de llamar a tu función.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Agregar un campo opcional `unit`** a `WeatherArgsSchema`: `z.enum(["celsius", "fahrenheit"]).optional()`.
2. **Completar la función del tool** para que retorne un string de clima significativo.
3. **Invocar el modelo vinculado** con un system prompt que instruya usar `get_weather` y un human message preguntando por el clima en una ciudad.
4. **Ejecutar el tool** con los args de `tool_calls[0]` del modelo.
5. **Demostrar el rechazo**: llama a `weatherTool.invoke()` con args inválidos (por ejemplo, `city: 12345`) y captura el error.
6. **Retornar** `{ validResult, validationError }`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 05-tool-schema-validation              # tu código
lcdev verify 05-tool-schema-validation --solution   # referencia
lcdev run    05-tool-schema-validation --solution   # inspeccionar tool_calls
```

## Criterio de éxito

- Al menos una llamada al modelo capturada.
- `validResult` es truthy (el tool se ejecutó con args válidos).
- `WeatherArgsSchema.safeParse(tc?.args).success === true` para el tool_call del modelo.
- `validationError` es un string no vacío.

## Bonus (stretch — no está en los tests)

LangChain lanza un `ToolInputParsingException` cuando los args fallan la validación. Puedes capturarlo específicamente:

```ts
import { ToolInputParsingException } from "@langchain/core/tools";
try {
  await weatherTool.invoke({ city: 12345 as unknown as string });
} catch (err) {
  if (err instanceof ToolInputParsingException) {
    console.log("Schema rechazó los args:", err.message);
  }
}
```

Esto es útil en sistemas de producción donde quieres manejar los errores de tools de forma distinta a los errores del modelo.

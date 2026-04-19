# 02 · Cadenas secuenciales: keyword y luego haiku

## Objetivo

Encadenar dos llamadas al modelo en una sola cadena LCEL: la primera extrae una palabra clave de una oración, y la segunda escribe un haiku usando esa palabra. Es el patrón clásico "output de una etapa = input de la siguiente".

## Contexto

Hasta ahora tu cadena hacía una sola llamada al modelo. En la vida real, muchos flujos requieren varias llamadas coordinadas: una para planear, otra para ejecutar; una para extraer datos, otra para resumir. LCEL resuelve esto con `RunnableSequence.from([...])`, que ejecuta cada paso en orden y pasa el output de uno al siguiente.

La sutileza está en la forma de los datos entre etapas. La etapa 1 devuelve un `string` (keyword). La etapa 2 espera un objeto `{ keyword }` porque su prompt usa la variable `{keyword}`. Entre medio necesitas un adapter: una función pura que transforma el string en el objeto. Eso también es un Runnable implícito — LCEL lo coerce por ti.

## Qué tienes que completar

Abre `starter.ts`. Hay tres TODOs principales:

1. **Cadena de keyword (etapa 1)** — `ChatPromptTemplate` con una variable `{sentence}`. El system prompt debe pedir UNA sola palabra clave evocadora, sin puntuación. Piping: `prompt → model → parser`.
2. **Cadena de haiku (etapa 2)** — `ChatPromptTemplate` con una variable `{keyword}`. El system prompt debe pedir un haiku de tres versos (5-7-5). Piping: `prompt → model → parser`.
3. **Composición secuencial** — usa `RunnableSequence.from([keywordChain, adapter, haikuChain])`. El adapter es `(keyword: string) => ({ keyword })`.

Luego invoca con `{ sentence: "The fog rolled in over the city at dawn." }` y devuelve el haiku.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 02-sequential

# La solución de referencia
lcdev verify 02-sequential --solution

# Ver output real
lcdev run 02-sequential --solution
```

## Criterio de éxito

- La cadena hace exactamente **dos** llamadas al modelo (una por etapa).
- Ambas llamadas reportan el mismo proveedor (Anthropic → `claude-*`, OpenAI → `gpt-*`, Gemini → `gemini-*`).
- Los tokens de input y output son positivos en las dos llamadas.
- El valor de retorno es un string no vacío: el haiku final.

## Pista

Si pones directamente dos prompts con una coma entre medio, vas a obtener un error de tipos: el output de la etapa 1 es `string`, pero la etapa 2 necesita un objeto. El adapter intermedio es lo que resuelve ese "desajuste de forma":

```ts
const chain = RunnableSequence.from<{ sentence: string }, string>([
  keywordChain,                     // (input) → string
  (keyword: string) => ({ keyword }), // string → { keyword: string }
  haikuChain,                        // { keyword } → string
]);
```

Patrones así de pequeños son el corazón de LCEL: piezas atómicas que se componen.

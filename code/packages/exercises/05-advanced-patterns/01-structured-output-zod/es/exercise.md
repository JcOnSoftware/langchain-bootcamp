# 01 · Structured Output con Zod — respuestas tipadas desde cualquier modelo

## Objetivo

Obligar a cualquier chat model a devolver un objeto tipado y validado en vez de texto plano. Defines un schema Zod, se lo pasas a `model.withStructuredOutput(schema)`, y siempre obtienes un objeto TypeScript parseado.

## Contexto

`withStructuredOutput` de LangChain envuelve el chat model con el mecanismo de JSON adecuado para cada proveedor (function calling, JSON mode o JSON schema constraints — el camino correcto se elige automáticamente). Defines un solo schema Zod y LangChain lo resuelve para Anthropic, OpenAI y Gemini.

El valor de retorno de `withStructuredOutput(schema).invoke(input)` ya está parseado y tipado en TypeScript — sin `JSON.parse`, sin validación manual.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Definir `MovieSchema`** — un `z.object({...})` con al menos 4 campos: `title`, `year`, `genre`, `summary`.
2. **Envolver el modelo** con `model.withStructuredOutput(MovieSchema, { name: "movie_recommendation" })`.
3. **Invocar** con un `HumanMessage` pidiendo una recomendación de película de ciencia ficción clásica.
4. **Retornar** el resultado directamente — ya es el objeto tipado.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 01-structured-output-zod              # tu código
lcdev verify 01-structured-output-zod --solution   # referencia
lcdev run    01-structured-output-zod --solution   # inspeccionar el objeto retornado
```

## Criterio de éxito

- Al menos una llamada al modelo es capturada.
- `result.userReturn` pasa `MovieSchema.safeParse(...)` — todos los campos declarados presentes con los tipos correctos.
- `userReturn.title` es un string no vacío.
- `userReturn.year` es un número.

## Pista

La clave: `withStructuredOutput` retorna un `Runnable<BaseLanguageModelInput, z.infer<Schema>>`, no un `Runnable<..., AIMessage>`. Puedes encadenarlo con `.pipe(...)` o llamar `.invoke(...)` directamente.

```ts
const structured = model.withStructuredOutput(MovieSchema);
const result = await structured.invoke([new HumanMessage("...")]);
// result está tipado como { title: string; year: number; genre: string; summary: string }
```

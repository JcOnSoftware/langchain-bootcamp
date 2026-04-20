# 04 · Extended Thinking — trazas de razonamiento con ChatAnthropic

> **Ejercicio exclusivo de Anthropic.** Esta funcionalidad no está disponible en OpenAI ni Gemini.
> Ejecútalo con `LCDEV_PROVIDER=anthropic`.

## Objetivo

Habilitar extended thinking en `ChatAnthropic` para que el modelo produzca una traza de razonamiento interno (un bloque "thinking") antes de escribir su respuesta. Inspeccionarás `AIMessage.content` para verificar que existen tanto un bloque thinking como un bloque text.

## Contexto

Extended thinking le permite a Claude razonar en voz alta antes de comprometerse con una respuesta. El campo `AIMessage.content` se convierte en un array de bloques tipados en lugar de un string plano:

```json
[
  { "type": "thinking", "thinking": "Déjame trabajar esto paso a paso..." },
  { "type": "text", "text": "La respuesta es 5050." }
]
```

Esta es una funcionalidad exclusiva de Anthropic. LangChain la expone vía la opción `thinking` en `ChatAnthropic`.

**Nota importante sobre la API:** La API de Anthropic espera `budget_tokens` en snake_case. LangChain pasa el objeto `thinking` directamente al SDK subyacente, así que debes usar snake_case:

```ts
thinking: { type: "enabled", budget_tokens: 1024 }
```

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Agregar la config de `thinking`** al constructor de `ChatAnthropic`: `{ type: "enabled", budget_tokens: 1024 }`.
2. **Escribir un prompt** que requiera razonamiento no trivial paso a paso (por ejemplo, un problema de matemáticas, un acertijo lógico).
3. **Retornar** `{ content, hasThinking, hasText }` donde los booleanos vienen de escanear el array de contenido.

## Cómo verificar

Desde `code/` (primero configura `LCDEV_PROVIDER=anthropic`):

```bash
lcdev verify 04-extended-thinking --solution     # referencia
lcdev verify 04-extended-thinking                # tu código
```

En proveedores que no son Anthropic, la suite de tests se **omite** automáticamente (no falla).

## Criterio de éxito

- `result.calls.length >= 1`.
- `result.userReturn.hasThinking === true`.
- `result.userReturn.hasText === true`.
- `result.userReturn.content` contiene al menos un bloque `{ type: "thinking" }` y uno `{ type: "text" }`.

## Pista

`maxTokens` debe ser mayor que `budget_tokens`. Una proporción de 2:1 es segura:

```ts
const model = new ChatAnthropic({
  model: "claude-sonnet-4-5",
  apiKey,
  thinking: { type: "enabled", budget_tokens: 1024 },
  maxTokens: 2048,
});
```

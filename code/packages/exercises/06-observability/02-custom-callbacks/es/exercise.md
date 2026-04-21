# 02 · Custom callbacks — hooks de ciclo de vida con BaseCallbackHandler

## Objetivo

Crea un handler personalizado extendiendo `BaseCallbackHandler` para interceptar eventos del ciclo de vida de una llamada al modelo. Aprende qué métodos tienes disponibles y cuándo se disparan cada uno.

## Contexto

`BaseCallbackHandler` es la clase base de todos los handlers de LangChain. Al extenderla y sobrescribir sus métodos opcionales, puedes ejecutar lógica en momentos precisos del ciclo de vida: antes de que el modelo empiece (`handleLLMStart`), cuando llega cada token (`handleLLMNewToken`), y cuando la respuesta completa llega (`handleLLMEnd`).

Los métodos son opcionales — solo defines los que necesitas. Cada método recibe contexto relevante: para `handleLLMStart` recibes el objeto del modelo, los prompts y el run id; para `handleLLMEnd` recibes el resultado completo y el run id.

El handler se pasa como callback en `model.invoke(input, { callbacks: [handler] })`. LangChain invoca sus métodos automáticamente en el orden correcto.

## Qué tienes que completar

Abre `starter.ts`. Necesitas:

1. **Completar `handleLLMStart`**: push `{ type: "handleLLMStart" }` a `this.events`.
2. **Completar `handleLLMEnd`**: push `{ type: "handleLLMEnd" }` a `this.events`.
3. **Instanciar el handler** y pasarlo como callback al invoke.
4. **Retornar** `{ events: handler.events }`.

## Cómo verificar

Desde `code/`:

```bash
lcdev verify 02-custom-callbacks              # tu código
lcdev verify 02-custom-callbacks --solution   # referencia
lcdev run    02-custom-callbacks --solution   # inspeccionar los eventos capturados
```

## Criterio de éxito

- Al menos una llamada al modelo es capturada por el harness.
- `events.length >= 2` — al menos un `handleLLMStart` y un `handleLLMEnd` fueron disparados.
- `events` contiene al menos una entrada con `type === "handleLLMStart"`.
- `events` contiene al menos una entrada con `type === "handleLLMEnd"`.
- Cada entrada en `events` tiene un campo `type` de tipo string no vacío.

## Pista

La clase necesita un nombre único (la propiedad `name`). LangChain la usa internamente para identificar el handler:

```ts
class MyCallbackHandler extends BaseCallbackHandler {
  name = "my-callback-handler";
  events: Array<{ type: string }> = [];

  override handleLLMStart(_llm: Serialized, _prompts: string[], _runId: string): void {
    this.events.push({ type: "handleLLMStart" });
  }

  override handleLLMEnd(_output: LLMResult, _runId: string): void {
    this.events.push({ type: "handleLLMEnd" });
  }
}
```

El prefijo `override` es obligatorio con `noImplicitOverride` activo en este proyecto.

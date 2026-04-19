# 01 · Tu primer chain de LCEL

## Objetivo

Construir tu primera cadena LCEL: `prompt → model → parser`. Es el "Hola, mundo" de LangChain. Si entiendes cómo se compone esta cadena, ya tienes el 80% de LCEL mental.

## Contexto

LCEL (LangChain Expression Language) te permite componer `Runnable`s con el operador `.pipe()`. Cada Runnable recibe un input, lo transforma, y pasa el resultado al siguiente. No hay clases que heredar ni estado interno: es tubería pura.

En este ejercicio vas a encadenar tres piezas:

1. **`ChatPromptTemplate`** — recibe `{ topic }`, devuelve una lista de mensajes formateados.
2. **Chat model** — recibe los mensajes, devuelve un `AIMessage`.
3. **`StringOutputParser`** — recibe el `AIMessage`, devuelve el texto plano.

## Qué tienes que completar

Abre `starter.ts`. Hay tres TODOs:

1. **Arma el prompt** con `ChatPromptTemplate.fromMessages([...])`. Necesitas dos mensajes: uno `"system"` que le dé carácter al modelo y uno `"human"` que incluya la variable `{topic}`.
2. **Compón la cadena** con `.pipe(...)`. El orden es `prompt → model → parser`.
3. **Invoca la cadena** con `chain.invoke({ topic: "LCEL" })` y devuelve el string resultado.

## Cómo verificar

Desde la raíz del repo (`cd code/`):

```bash
# Tu código
lcdev verify 01-hello-chain

# La solución de referencia
lcdev verify 01-hello-chain --solution

# Ver output real
lcdev run 01-hello-chain --solution
```

## Criterio de éxito

- La cadena hace exactamente **una** llamada al modelo.
- El modelo devuelto coincide con el proveedor configurado (Anthropic → `claude-*`, OpenAI → `gpt-*`, Gemini → `gemini-*`).
- Los tokens de entrada y salida son mayores que cero.
- El valor de retorno es un string no vacío (el parser ya te lo garantiza si la cadena está bien compuesta).

## Pista

El patrón clásico es:

```ts
const chain = prompt.pipe(model).pipe(new StringOutputParser());
const respuesta = await chain.invoke({ topic: "LCEL" });
```

Si prefieres la notación explícita:

```ts
const chain = RunnableSequence.from([prompt, model, new StringOutputParser()]);
```

Ambas funcionan idénticas bajo el capó.

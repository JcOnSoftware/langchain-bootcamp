# 04 · Runnables personalizados como adaptadores de input

## Objetivo

Envolver una función pura en `RunnableLambda` para usarla como un Runnable de primera clase dentro de una cadena LCEL. El caso típico: adaptar un input crudo a la forma que espera el siguiente paso.

## Contexto

`RunnableLambda.from(fn)` convierte cualquier función sync o async en un Runnable. A partir de ahí puedes hacer `.pipe(...)` con ella como con cualquier otro componente de LCEL. No hay magia: es el mecanismo por el cual LCEL te deja colocar tu propia lógica entre pasos sin salir del pipeline.

En este ejercicio el problema concreto es: quieres invocar la cadena con un string plano como `"Explain LCEL briefly."`, no con un objeto `{ text: "..." }`. Pero el `ChatPromptTemplate` necesita un objeto con la variable `{text}`. La solución limpia es un adapter al inicio del pipe:

```
(string) → adapter → { text } → prompt → model → parser → (string)
```

El adapter es tu primer Runnable escrito "a mano".

## Qué tienes que completar

Abre `starter.ts`. Hay cuatro TODOs:

1. **Prompt** con una variable `{text}`.
2. **Adapter** — `RunnableLambda.from<string, { text: string }>((raw) => ({ text: raw }))`.
3. **Composición** — `adapter.pipe(prompt).pipe(model).pipe(new StringOutputParser())`.
4. **Invocación** — llama `chain.invoke("Explain LCEL briefly.")` (un string plano) y devuelve el resultado.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 04-custom-runnable

# La solución de referencia
lcdev verify 04-custom-runnable --solution

# Ver output real
lcdev run 04-custom-runnable --solution
```

## Criterio de éxito

- La cadena hace exactamente **una** llamada al modelo.
- El modelo devuelto coincide con el proveedor configurado.
- Los tokens de input y output son positivos.
- El valor de retorno es un string no vacío.

## Pista

Los genéricos de `RunnableLambda.from` son importantes para que TypeScript entienda el contrato:

```ts
const adapter = RunnableLambda.from<string, { text: string }>(
  (raw: string) => ({ text: raw }),
);
```

Con eso, el `adapter.pipe(prompt)` funciona porque el output del adapter es el input del prompt. Si omites los genéricos vas a ver errores tipo "unknown" propagándose hacia abajo de la cadena — diagnóstico típico cuando una cadena LCEL no typechequea.

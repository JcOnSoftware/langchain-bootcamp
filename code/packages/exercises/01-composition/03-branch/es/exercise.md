# 03 · Ruteo condicional con RunnableBranch

## Objetivo

Aprender a rutear inputs a diferentes cadenas según una condición. En este ejercicio usas la longitud del texto como discriminador: si el texto es corto, se resume en una oración; si es largo, en tres bullets.

## Contexto

`RunnableBranch` es el "if/else" de LCEL. Recibe una lista de pares `[condición, runnable]` y un runnable por defecto al final. Evalúa las condiciones en orden y ejecuta la primera que matchee; si ninguna coincide, usa el default.

Esto es útil para patrones del mundo real: routing entre diferentes prompts según el tipo de pregunta, fallback entre modelos, dispatch entre agentes, etc. La clave conceptual es que la condición es una función síncrona sobre el input — no debe llamar al modelo. El modelo se llama dentro de cada rama.

## Qué tienes que completar

Abre `starter.ts`. Hay cuatro TODOs:

1. **Dos prompts** — uno que pide un resumen de una oración, otro que pide tres bullets.
2. **Dos cadenas** — `shortChain` y `longChain`, cada una con `prompt → model → parser`.
3. **RunnableBranch** — condición: `input.text.length < 50` va a `shortChain`; el default es `longChain`.
4. **Dos invocaciones** — una con un texto corto, otra con un texto largo. Devuelve `{ short, long }`.

## Cómo verificar

Desde `code/`:

```bash
# Tu código
lcdev verify 03-branch

# La solución de referencia
lcdev verify 03-branch --solution

# Ver output real
lcdev run 03-branch --solution
```

## Criterio de éxito

- La cadena hace exactamente **dos** llamadas al modelo (una por invocación).
- Ambas llamadas usan el proveedor configurado.
- Los tokens de input y output son positivos en las dos llamadas.
- El valor de retorno es un objeto `{ short, long }` donde ambos campos son strings no vacíos.

## Pista

La signatura del branch es `RunnableBranch.from<RunInput, RunOutput>([...branches, defaultBranch])`. El tipo genérico importa: fija `RunInput` al objeto de entrada y `RunOutput` al tipo del string final.

```ts
const chain = RunnableBranch.from<BranchInput, string>([
  [(input) => input.text.length < 50, shortChain],
  longChain, // default
]);
```

Nota que el default NO va envuelto en un array — va suelto como último elemento. Es una API con un poco de forma especial.

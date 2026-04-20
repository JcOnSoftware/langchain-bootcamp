# Track Advanced Patterns Specification

## Purpose

Defines the 5 exercises of track `05-advanced-patterns` and their expected capture + return shapes. These are production-shaped primitives: typed output, resilience, streaming UX, deep reasoning, and tool schema validation.

## Requirements

### Requirement: Track Lineup

Track `05-advanced-patterns` MUST contain exactly these 5 exercises in order:

| # | id | Focus |
|---|---|---|
| 1 | `01-structured-output-zod` | `model.withStructuredOutput(zodSchema)` — typed parsed object |
| 2 | `02-fallback-retry` | `.withFallbacks([fallback])` — primary fails, fallback succeeds |
| 3 | `03-streaming-json` | `JsonOutputParser` + `.stream()` — partial JSON chunks |
| 4 | `04-extended-thinking` | `ChatAnthropic({ thinking: { type: "enabled", budgetTokens: 1024 } })` — thinking blocks in `AIMessage.content` |
| 5 | `05-tool-schema-validation` | `tool()` + Zod schema — args validated before tool runs |

#### Scenario: track listed with 5 entries per locale

- GIVEN all 5 exercise directories exist with valid `meta.json`
- WHEN `lcdev list` runs
- THEN 5 entries under `05-advanced-patterns` appear in both `--locale es` and `--locale en`

### Requirement: Exercise 01 — Structured Output with Zod

`01-structured-output-zod` MUST call `model.withStructuredOutput(zodSchema)` where `zodSchema` is a `z.object(...)` with ≥2 fields, invoke the chain with a prompt that elicits a structured reply, and return the parsed result directly as `userReturn`.

#### Scenario: userReturn matches the zod schema shape

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 1`
- AND `result.userReturn` is a non-null object
- AND every declared field of the zod schema is a key in `result.userReturn`

#### Scenario: model identity captured

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.calls[0].model` is a non-empty string (provider model id)

### Requirement: Exercise 02 — Fallback and Retry

`02-fallback-retry` MUST construct a primary runnable that deterministically throws on its first invocation (a `RunnableLambda` that throws, or a mock model), chain it with `.withFallbacks([fallbackModel])`, invoke once, and return `{ result: string, usedFallback: boolean }` where `usedFallback === true`.

#### Scenario: fallback path taken, primary rejected

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.userReturn.usedFallback === true`
- AND `result.userReturn.result` is a non-empty string

#### Scenario: fallback model captured at least once

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 1`
- AND `result.calls` contains a call from the fallback model (not the primary mock)

### Requirement: Exercise 03 — Streaming JSON

`03-streaming-json` MUST build a chain ending in `JsonOutputParser`, call `.stream(input)` to get an async iterable, collect all yielded chunks into an array, and return `{ chunks: unknown[], final: Record<string, unknown> }` where `final` is the last (fully assembled) chunk.

#### Scenario: multiple chunks emitted

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.userReturn.chunks.length > 1`
- AND `result.userReturn.final` is a non-null object (valid JSON parsed shape)

#### Scenario: final chunk parses to expected schema

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.userReturn.final` has the same top-level keys as the schema declared in the prompt

### Requirement: Exercise 04 — Extended Thinking (Anthropic-only)

`04-extended-thinking` MUST instantiate `ChatAnthropic` with `{ thinking: { type: "enabled", budgetTokens: 1024 } }`, invoke with a prompt that elicits a non-trivial answer, and return `{ content: AIMessageChunk["content"], hasThinking: boolean, hasText: boolean }`.

This exercise MUST include a `test.skipIf(process.env.LCDEV_PROVIDER !== "anthropic")` guard so it is skipped on non-Anthropic providers without marking the suite as failed.

#### Scenario: content contains both thinking and text blocks (Anthropic)

- GIVEN the exercise solution is invoked with `LCDEV_PROVIDER=anthropic` and a valid `ANTHROPIC_API_KEY`
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 1`
- AND `result.userReturn.hasThinking === true`
- AND `result.userReturn.hasText === true`
- AND `result.userReturn.content` is an array containing at least one object with `type === "thinking"` and at least one with `type === "text"`

#### Scenario: test skipped on non-Anthropic provider

- GIVEN `LCDEV_PROVIDER` is set to `"openai"` or `"gemini"`
- WHEN the test suite runs
- THEN the test is skipped (not failed)

### Requirement: Exercise 05 — Tool Schema Validation

`05-tool-schema-validation` MUST define a `tool()` with a Zod schema for its args, invoke the model with tool binding so it calls the tool with valid args, and also demonstrate the rejection path: pass invalid args directly to the tool and assert it throws. Return `{ validResult: unknown, validationError: string }`.

#### Scenario: valid args — tool executes and returns result

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.userReturn.validResult` is truthy
- AND `result.calls.length >= 1`

#### Scenario: invalid args — tool throws on validation

- GIVEN the tool's Zod schema rejects the supplied args
- WHEN the tool is invoked directly with invalid args
- THEN an error is thrown
- AND `result.userReturn.validationError` is a non-empty string describing the schema failure

### Requirement: Provider-Aware Skip Discipline

Exercise 04 MUST guard its test(s) with `test.skipIf(process.env.LCDEV_PROVIDER !== "anthropic")`. Exercises 01–03 and 05 MUST NOT contain provider-specific skip guards (they run on any supported provider).

#### Scenario: skip guard present only in exercise 04

- GIVEN a reviewer scans all 5 `tests.test.ts` files in `05-advanced-patterns`
- WHEN they search for `skipIf` or provider-conditional logic
- THEN only `04-extended-thinking/tests.test.ts` contains a `skipIf` guard

### Requirement: Shape-Only Assertion Discipline

`tests.test.ts` MUST NOT assert on literal LLM text output, raw `AIMessage` string content, or `ToolMessage` text values. Assertions MUST target: `userReturn` structural keys, `calls.length` with lower-bound `>=`, `content` array block types (e.g., `type === "thinking"`), boolean flags, and error class/message substrings.

#### Scenario: no literal-text assertions

- GIVEN a review of any `05-advanced-patterns/*/tests.test.ts`
- WHEN a reviewer scans for `.toBe("some literal text")` on message content or tool output strings
- THEN no such assertions exist

### Requirement: Bilingual Exercise Statements

Every exercise MUST have both `es/exercise.md` and `en/exercise.md`. The Spanish statement MUST use peruano neutro tuteo (tú/tienes/puedes). MUST NOT use voseo (vos/tenés/podés).

#### Scenario: bilingual files present and voseo-free

- GIVEN all 5 exercise directories under `05-advanced-patterns`
- WHEN a reviewer lists locale files and scans for voseo patterns
- THEN each directory contains exactly `es/exercise.md` and `en/exercise.md`
- AND `rg "tenés|podés|sabés|querés|arrancá" es/` returns zero matches

### Requirement: No Runner Changes

The harness in `packages/runner/` MUST remain unchanged for this track. If a test assertion requires data not currently in `CapturedCallLangChain`, the assertion MUST be rephrased to use `userReturn` fields or existing capture shape instead of extending the runner.

#### Scenario: runner package unmodified

- GIVEN the implementation of track `05-advanced-patterns` is complete
- WHEN `git diff HEAD packages/runner/` is run
- THEN the diff is empty (no changes to runner files)

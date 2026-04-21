# Track Observability Specification

## Purpose

Defines the 5 exercises of track `06-observability` and their expected capture + return shapes. These are production-facing primitives: run collection, custom lifecycle callbacks, cost calculation, stream event debugging, and a production-hardening checklist capstone.

## Requirements

### Requirement: Track Lineup

Track `06-observability` MUST contain exactly these 5 exercises in order:

| # | id | Focus |
|---|---|---|
| 1 | `01-langsmith-tracing` | `RunCollectorCallbackHandler` — offline run collection; `LangChainTracer` env-gated |
| 2 | `02-custom-callbacks` | `BaseCallbackHandler` — ≥2 lifecycle methods overridden |
| 3 | `03-cost-tracking` | `usage_metadata` — learner-built rate table, cost arithmetic |
| 4 | `04-debug-chains` | `streamEvents({ version: "v2" })` — collect event types via spy handler |
| 5 | `05-production-checklist` | retry + fallback + cost callback + error-boundary + run-collector capstone |

#### Scenario: track listed with 5 entries per locale

- GIVEN all 5 exercise directories exist with valid `meta.json`
- WHEN `lcdev list` runs
- THEN 5 entries under `06-observability` appear in both `--locale es` and `--locale en`

### Requirement: Exercise 01 — LangSmith Tracing

`01-langsmith-tracing` MUST wrap a chain with `RunCollectorCallbackHandler`, invoke it, and return `{ collectedRuns: Array<{ id: string, name: string, run_type: string }> }`. The `LangChainTracer` path MUST also be wired when `LANGCHAIN_API_KEY` is set; that inner scenario is skipped when the key is absent.

#### Scenario: collector captures ≥1 run offline

- GIVEN the exercise solution is invoked with a live chat API key (no `LANGCHAIN_API_KEY` required)
- WHEN `runUserCode` returns
- THEN `result.userReturn.collectedRuns.length >= 1`
- AND each entry has keys `id`, `name`, `run_type`

#### Scenario: LangChainTracer wired when key present (env-gated)

- GIVEN `LANGCHAIN_API_KEY` is set to a non-empty string
- WHEN the chain is invoked
- THEN `LangChainTracer` is included in the callbacks array alongside `RunCollectorCallbackHandler`

#### Scenario: inner scenario skipped when key absent

- GIVEN `LANGCHAIN_API_KEY` is NOT set
- WHEN the test suite runs
- THEN the `LangChainTracer` scenario is skipped (not failed)

### Requirement: Exercise 02 — Custom Callbacks

`02-custom-callbacks` MUST define a class extending `BaseCallbackHandler` that overrides ≥2 lifecycle methods (e.g. `handleLLMStart`, `handleLLMEnd`), pass an instance as a callback, invoke a chain, and return `{ events: Array<{ type: string }> }` where `events` contains at least one entry for each overridden method type.

#### Scenario: both lifecycle event types fired

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.userReturn.events` contains ≥1 entry with `type === "handleLLMStart"`
- AND `result.userReturn.events` contains ≥1 entry with `type === "handleLLMEnd"`

#### Scenario: call captured by harness

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 1`

### Requirement: Exercise 03 — Cost Tracking

`03-cost-tracking` MUST read `usage_metadata` from the captured response, apply a learner-defined rate table (input + output token rates), and return `{ inputTokens: number, outputTokens: number, totalCost: number }`. The rate table MUST NOT import from `cli/src/cost.ts`.

#### Scenario: cost arithmetic is positive and consistent

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.userReturn.inputTokens > 0`
- AND `result.userReturn.outputTokens > 0`
- AND `result.userReturn.totalCost > 0`
- AND `result.userReturn.totalCost === (inputTokens * inputRate + outputTokens * outputRate)` within floating-point tolerance

#### Scenario: harness captures ≥1 call

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 1`

### Requirement: Exercise 04 — Debug Chains with streamEvents

`04-debug-chains` MUST call `.streamEvents(input, { version: "v2" })` on a chain, collect emitted event types via a spy handler, and return `{ eventTypes: string[] }`. The collected types MUST include at least `on_chat_model_start` and `on_chat_model_end`.

#### Scenario: required event types present

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.userReturn.eventTypes` includes `"on_chat_model_start"`
- AND `result.userReturn.eventTypes` includes `"on_chat_model_end"`

#### Scenario: harness captures ≥1 call

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.calls.length >= 1`

### Requirement: Exercise 05 — Production Checklist Capstone

`05-production-checklist` MUST wrap a base chain with all 5 hardenings: retry, fallback, cost callback, error-boundary callback, and run-collector. It MUST return `{ wrapperTypes: string[], callSucceeded: boolean, tracedRuns: any[] }`. The primary chain MAY be a deterministic stub (fails once, succeeds on retry).

#### Scenario: all 5 wrapper types present

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.userReturn.wrapperTypes` contains all of: `"retry"`, `"fallback"`, `"cost"`, `"error-boundary"`, `"run-collector"`
- AND `result.userReturn.wrapperTypes.length >= 5`

#### Scenario: chain invocation succeeds end-to-end

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.userReturn.callSucceeded === true`
- AND `result.userReturn.tracedRuns.length >= 1`

### Requirement: Env-Gated Skip Discipline

Exercise 01 MUST include `test.skipIf(!process.env.LANGCHAIN_API_KEY)` on the inner `LangChainTracer` scenario only. The `RunCollectorCallbackHandler` main scenario MUST always run. Exercises 02–05 MUST NOT contain `LANGCHAIN_API_KEY` skip guards.

#### Scenario: skip guard scoped correctly in exercise 01

- GIVEN a reviewer scans all `tests.test.ts` files in `06-observability`
- WHEN they search for `skipIf` with `LANGCHAIN_API_KEY`
- THEN only `01-langsmith-tracing/tests.test.ts` contains this guard
- AND the guard wraps only the inner LangChainTracer assertion, not the whole suite

### Requirement: Shape-Only Assertion Discipline

`tests.test.ts` files MUST NOT assert on literal LLM text output. Assertions MUST target: `userReturn` structural keys and numeric values, `calls.length >= N` lower-bounds, boolean flags, and array membership of known constant strings (event types, wrapper type names).

#### Scenario: no literal-text assertions

- GIVEN a review of any `06-observability/*/tests.test.ts`
- WHEN a reviewer scans for `.toBe("some literal text")` on message content
- THEN no such assertions exist

### Requirement: Bilingual Exercise Statements

Every exercise MUST have both `es/exercise.md` and `en/exercise.md`. Spanish MUST use peruano neutro tuteo (tú/tienes/puedes). MUST NOT use voseo (vos/tenés/podés).

#### Scenario: bilingual files present and voseo-free

- GIVEN all 5 exercise directories under `06-observability`
- WHEN a reviewer lists locale files and scans for voseo patterns
- THEN each directory contains exactly `es/exercise.md` and `en/exercise.md`
- AND `rg "tenés|podés|sabés|querés|arrancá" es/` returns zero matches

### Requirement: No Runner Changes

The harness in `packages/runner/` MUST remain unchanged. If a test requires data not in `CapturedCallLangChain`, the assertion MUST use `userReturn` fields or existing capture shape instead of extending the runner.

#### Scenario: runner package unmodified

- GIVEN the implementation of track `06-observability` is complete
- WHEN `git diff HEAD packages/runner/` is run
- THEN the diff is empty (no changes to runner files)

### Requirement: No New Runtime Dependencies

`packages/exercises/package.json` MUST NOT add new entries. All APIs used (`BaseCallbackHandler`, `RunCollectorCallbackHandler`, `LangChainTracer`, `streamEvents`) are from `@langchain/core`. The `langsmith` package is transitive and already present.

#### Scenario: package.json unchanged

- GIVEN the implementation of track `06-observability` is complete
- WHEN `git diff HEAD code/packages/exercises/package.json` is run
- THEN the diff is empty

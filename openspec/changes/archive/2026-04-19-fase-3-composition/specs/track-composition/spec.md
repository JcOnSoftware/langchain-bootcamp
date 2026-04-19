# Track-Composition Specification

## Purpose

Defines the 5 exercises of track `01-composition` and the captured-call shape each one MUST produce.

## Requirements

### Requirement: Track Lineup

Track `01-composition` MUST contain exactly these 5 exercises in order:

| # | id | Focus |
|---|----|-------|
| 1 | `01-hello-chain` | `prompt \| model \| parser` basic pipe |
| 2 | `02-sequential` | Two-stage chain (extractor → summarizer) |
| 3 | `03-branch` | Conditional routing (`RunnableBranch` or equivalent) |
| 4 | `04-custom-runnable` | `RunnableLambda` mid-chain transformation |
| 5 | `05-batch` | `chain.batch([...])` with multiple inputs |

#### Scenario: track listed with 5 entries

- GIVEN all 5 exercise directories exist with valid `meta.json`
- WHEN `lcdev list` runs
- THEN 5 entries under `01-composition` appear

### Requirement: Default Export Signature

Each `solution.ts` and `starter.ts` MUST export a default async function with no parameters. The harness invokes it via `runUserCode(filePath)`.

#### Scenario: exercise exports non-function fails fast

- GIVEN `solution.ts` exports a string as default
- WHEN `runUserCode` imports it
- THEN `HarnessError` is thrown with a message naming the file

### Requirement: Captured Call Shape — Single Invocation

Exercises `01-hello-chain`, `02-sequential`, `03-branch`, `04-custom-runnable` MUST each produce at least one `CapturedCallLangChain` per `invoke()` of a chat model. `exercise.response.model` MUST match the configured provider's model id. `response.usage.input_tokens` and `.output_tokens` MUST be non-negative integers.

#### Scenario: hello-chain solution produces one capture

- GIVEN `ANTHROPIC_API_KEY` is set and provider is `anthropic`
- WHEN `lcdev verify 01-hello-chain --solution` runs
- THEN `result.calls.length === 1`
- AND `result.calls[0].response.usage.input_tokens > 0`
- AND `result.calls[0].response.usage.output_tokens > 0`

#### Scenario: sequential solution produces two captures

- GIVEN the sequential chain invokes the model twice
- WHEN verify runs
- THEN `result.calls.length === 2`
- AND both captures have matching model ids

### Requirement: Captured Call Shape — Batch

Exercise `05-batch` MUST produce one `CapturedCallLangChain` per item in the batch input array, in order.

#### Scenario: batch of three inputs → three captures

- GIVEN a batch of 3 inputs
- WHEN `chain.batch(inputs)` runs under the harness
- THEN `result.calls.length === 3`
- AND captures appear in input order

### Requirement: Assert-on-Shape Discipline

`tests.test.ts` MUST NOT assert on literal model text output. Assertions MUST target: call count, model id, presence of `tool_calls` (when applicable), LCEL edges reached, or `userReturn` structural shape.

#### Scenario: text-content assertion is forbidden

- GIVEN a review of `tests.test.ts`
- WHEN CI or reviewer scans for `expect(...response.content).toBe("literal string")`
- THEN such assertions MUST be absent (pattern-based assertions like `.toContain` on structural fields are acceptable)

# Exercise Contract Specification

## Purpose

Defines the file layout, metadata, target-resolution, and localization rules every exercise MUST satisfy. Applies to all 30 exercises across 6 tracks; Fase 3 is the first track to instantiate it.

## Requirements

### Requirement: Exercise File Layout

Each exercise directory MUST contain: `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, and one `{locale}/exercise.md` per locale declared in `meta.json`.

#### Scenario: complete exercise discovered

- GIVEN `packages/exercises/01-composition/01-hello-chain/` with all 5 required files plus `es/exercise.md` and `en/exercise.md`
- WHEN `lcdev list` runs
- THEN the exercise is listed with `id: "01-hello-chain"` under track `01-composition`

#### Scenario: missing required file excludes exercise

- GIVEN an exercise directory without `tests.test.ts`
- WHEN `lcdev list` runs
- THEN the exercise SHALL NOT appear in the output

### Requirement: meta.json Fields

`meta.json` MUST contain: `id`, `track`, `title`, `version`, `valid_until`, `concepts` (array), `estimated_minutes` (number), `requires` (array), `locales` (non-empty array of supported locale codes). It MAY contain `model_cost_hint`.

#### Scenario: meta without locales is rejected

- GIVEN `meta.json` lacking the `locales` field
- WHEN `listExercises()` runs
- THEN the exercise is excluded and a stderr warning is written
- AND no other exercises are affected

### Requirement: Target Resolution

The harness MUST resolve the exercise file to execute via `resolveExerciseFile(import.meta.url, override?)`, honoring the `LCDEV_TARGET` env var (values: `starter` or `solution`). Any other value MUST throw `HarnessError`.

#### Scenario: default target is starter

- GIVEN `LCDEV_TARGET` is unset and no override argument
- WHEN `resolveExerciseFile(import.meta.url)` runs from a test
- THEN the returned path ends in `/starter.ts`

#### Scenario: invalid target throws

- GIVEN `LCDEV_TARGET=foo`
- WHEN `resolveExerciseFile(import.meta.url)` runs
- THEN `HarnessError` is thrown with a message naming the invalid value

### Requirement: Locale Fallback

`exerciseDocPath(exercise, locale)` MUST return the requested locale's `exercise.md` when it exists. If missing and locale ≠ `es`, it MUST fall back to `es/exercise.md` with a one-time stderr warning per (exercise, locale). If `es/exercise.md` is missing, it MUST throw.

#### Scenario: en missing falls back to es

- GIVEN an exercise with only `es/exercise.md` on disk and `locales: ["es"]`
- WHEN `exerciseDocPath(exercise, "en")` runs
- THEN it returns the path to `es/exercise.md`
- AND a single deduped stderr warning is written

### Requirement: Spanish Content in Peruano Neutro Tuteo

Every `es/exercise.md`, every string in `es.json`, and every Spanish exercise metadata field MUST use peruano neutro with tuteo. Voseo forms (`querés`, `tenés`, `pegá`, `corré`, `probá`, `elegí`, etc.) MUST NOT appear.

#### Scenario: voseo triggers verify failure

- GIVEN any exercise file contains a voseo token
- WHEN the verify phase runs its pre-flight grep
- THEN the suite fails and reports the offending token and file

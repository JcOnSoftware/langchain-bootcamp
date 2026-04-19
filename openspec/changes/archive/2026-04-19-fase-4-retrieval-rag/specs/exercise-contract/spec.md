# Delta for exercise-contract

## ADDED Requirements

### Requirement: Inline Corpus Fixtures

When an exercise requires a document corpus (e.g., RAG exercises), the corpus MUST be declared as an inline array inside the exercise's `solution.ts` / `starter.ts`. Shared fixture directories are NOT permitted at v0.1 — each exercise is self-contained.

#### Scenario: RAG exercise corpus is inline

- GIVEN a RAG exercise at `packages/exercises/02-retrieval-rag/03-basic-rag/`
- WHEN its solution is read
- THEN the corpus (5-10 docs) appears as a `const` array in the same file — no import from a shared fixtures module

### Requirement: Embeddings Capture Gap Disclosure

The embeddings layer is NOT captured by the harness at v0.1 (the `BaseChatModel` prototype patch only covers chat calls). Exercises that use embeddings MUST NOT assert on embedding-call count or cost. `docs/EXERCISE-CONTRACT.md` MUST document this gap in an appendix so exercise authors know where the capture boundary lives.

#### Scenario: EXERCISE-CONTRACT appendix covers embeddings gap

- GIVEN a reader opens `docs/EXERCISE-CONTRACT.md`
- WHEN they search for "embeddings"
- THEN they find a section stating the capture gap and the tests-assert discipline for RAG (count chat calls + userReturn shape; do NOT assert on embeddings calls)

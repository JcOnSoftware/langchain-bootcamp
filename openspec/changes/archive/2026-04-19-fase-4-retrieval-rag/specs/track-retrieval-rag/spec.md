# Track Retrieval-RAG Specification

## Purpose

Defines the 5 exercises of track `02-retrieval-rag` and the captured-call + userReturn shape each one MUST produce.

## Requirements

### Requirement: Track Lineup

Track `02-retrieval-rag` MUST contain exactly these 5 exercises in order:

| # | id | Focus |
|---|----|-------|
| 1 | `01-document-loader` | Build `Document[]` from inline strings + split with `RecursiveCharacterTextSplitter` |
| 2 | `02-vector-store` | Embed + index into `MemoryVectorStore` + `similaritySearch(query, k)` |
| 3 | `03-basic-rag` | Retriever → prompt → model → parser LCEL chain with corpus grounding |
| 4 | `04-hybrid-retrieval` | MMR search + keyword-boost post-processor via `RunnableLambda` |
| 5 | `05-stateful-rag` | RAG with `InMemoryChatMessageHistory` + `RunnableWithMessageHistory` across turns |

#### Scenario: track listed with 5 entries

- GIVEN all 5 exercise directories exist with valid `meta.json`
- WHEN `lcdev list` runs
- THEN 5 entries under `02-retrieval-rag` appear in both `--locale es` and `--locale en`

### Requirement: Exercise 01 — Document Loader

`01-document-loader` MUST build `Document[]` from at least 5 inline strings, split via `RecursiveCharacterTextSplitter` with `chunkSize ≤ 200`, and return `userReturn.chunks` as the split array.

#### Scenario: userReturn has a chunks array of length ≥ 5

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.userReturn.chunks` is an array of length ≥ 5
- AND each element has `.pageContent` and `.metadata`

#### Scenario: no chat model calls (this exercise is pre-retrieval)

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.calls.length === 0` (no `BaseChatModel.invoke` happened)

### Requirement: Exercise 02 — Vector Store

`02-vector-store` MUST embed the corpus into `MemoryVectorStore`, run a `similaritySearch(query, k=3)`, and return `{ results: Document[] }` with length 3.

#### Scenario: returns exactly 3 similarity results

- GIVEN the exercise solution is invoked
- WHEN `runUserCode` returns
- THEN `result.userReturn.results` is an array of length 3
- AND each has `.pageContent` (non-empty string)
- AND no chat model was called (`result.calls.length === 0`)

### Requirement: Exercise 03 — Basic RAG

`03-basic-rag` MUST compose a chain that retrieves ≥ 1 document, injects its content into a prompt, invokes the chat model once, parses to string, and returns `{ answer: string, sources: Document[] }`.

#### Scenario: one chat model call with grounded answer

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.calls.length === 1`
- AND `result.userReturn.answer` is a non-empty string
- AND `result.userReturn.sources.length >= 1`

### Requirement: Exercise 04 — Hybrid Retrieval

`04-hybrid-retrieval` MUST run an MMR search AND apply a keyword-boost post-processor (via `RunnableLambda`). `userReturn.reranked` MUST be the boosted list in descending rank order.

#### Scenario: reranked array differs in order from raw MMR results

- GIVEN the exercise solution is invoked with a query that matches both semantic + keyword signals
- WHEN `runUserCode` returns
- THEN `result.userReturn.reranked.length >= 1`
- AND a documented keyword-match doc appears in the top 2 positions
- AND `result.calls.length === 0` (no chat model call in this exercise — retrieval-only focus)

### Requirement: Exercise 05 — Stateful RAG

`05-stateful-rag` MUST use `RunnableWithMessageHistory` with an `InMemoryChatMessageHistory` backed by an in-memory `Map` keyed by `sessionId`. It MUST invoke the chain twice with the same `sessionId`, demonstrate the second turn references first-turn context, and return `{ turn1: string, turn2: string }`.

#### Scenario: two turns produce two captures

- GIVEN the exercise solution is invoked with a live API key
- WHEN `runUserCode` returns
- THEN `result.calls.length === 2`
- AND both captures use the same configured provider model
- AND `result.userReturn.turn1` and `result.userReturn.turn2` are non-empty strings

### Requirement: Assert-on-Shape Discipline

`tests.test.ts` MUST assert on structure, never on literal retrieved-text or model-text content. Valid asserts: array lengths, result-count equality, truthiness of `.pageContent` / `.answer`, regex on model id.

#### Scenario: text-equality assertion is forbidden

- GIVEN a review of any `tests.test.ts`
- WHEN a reviewer scans for `.toBe("literal document content")` or equivalent on model output
- THEN no such assertions exist

# Tasks: Fase 4 — Track 02 Retrieval & RAG

TDD active: RED → GREEN → REFACTOR.

## Phase 1: Foundation (embeddings factory + umbrella dep)

- [ ] 1.1 Add `"langchain": "^1.0.0"` to `code/packages/exercises/package.json` and run `bun install` from `code/`
- [ ] 1.2 Resolve open questions: read installed `@langchain/google-genai@1.0.3` typings for Gemini embeddings default model; read `@langchain/core@1.1.40` for `RunnableWithMessageHistory` import path
- [ ] 1.3 RED: write `code/packages/runner/src/embeddings.test.ts` — provider mapping (openai/gemini/anthropic-fallback), throws-when-no-openai, opts.model override (5 cases)
- [ ] 1.4 GREEN: implement `code/packages/runner/src/embeddings.ts` — `createEmbeddings(provider, apiKey, openaiFallbackKey?, opts?)` mapping + default models + stderr notice for anthropic fallback
- [ ] 1.5 Export `createEmbeddings` + `EmbeddingsProvider` + `CreateEmbeddingsOptions` from `code/packages/runner/src/index.ts`
- [ ] 1.6 REFACTOR: confirm factory reads cleanly; add JSDoc pointing at spec `embeddings-factory`

## Phase 2: Exercises (TDD per exercise — repeat for each of 5)

For each of `01-document-loader`, `02-vector-store`, `03-basic-rag`, `04-hybrid-retrieval`, `05-stateful-rag`:

- [ ] 2.x.1 Create `code/packages/exercises/02-retrieval-rag/{id}/` and write `meta.json` (locales, track, concepts, model_cost_hint, valid_until)
- [ ] 2.x.2 RED: write `tests.test.ts` using `runUserCode(resolveExerciseFile(import.meta.url))` — shape asserts per track-retrieval-rag spec (call count, userReturn keys + lengths, regex on model id when chat is called)
- [ ] 2.x.3 GREEN: write `solution.ts` — default async `run()` + inline corpus (5-10 docs) + exercise-specific LCEL wiring
- [ ] 2.x.4 REFACTOR: write `starter.ts` = solution with retrieval/chain wiring replaced by `// TODO:` markers + `// Docs:` header with canonical LangChain 1.0 URL
- [ ] 2.x.5 Write `es/exercise.md` (peruano neutro tuteo — NO voseo) + `en/exercise.md`. Each covers: goal, concepts, what to complete, how to verify, success criteria, hints (40-80 lines)

Special notes:
- 2.3 (03-basic-rag): first exercise that needs BOTH chat + embeddings keys. Document in `en/es` exercise.md.
- 2.4 (04-hybrid-retrieval): solution uses `vs.maxMarginalRelevanceSearch(query, { k, fetchK })` + `RunnableLambda` that boosts docs containing a keyword. 0 chat calls.
- 2.5 (05-stateful-rag): solution creates `const store = new Map<string, InMemoryChatMessageHistory>()`, wraps RAG chain with `RunnableWithMessageHistory`, invokes twice with `{ configurable: { sessionId: "test-1" } }`.

## Phase 3: Docs + integration

- [ ] 3.1 Append §Embeddings capture gap + §Corpus fixtures to `docs/EXERCISE-CONTRACT.md`
- [ ] 3.2 (Optional) Update `README.md` + `README.es.md` to note "Track 02 available (5 RAG exercises)"

## Phase 4: Verify + polish

- [ ] 4.1 Run full `bun test` from `code/` — expect all Fase 3 green + Fase 4 exercise tests gated on API keys (fail-fast with clear message)
- [ ] 4.2 Run `bunx tsc --noEmit` — expect clean
- [ ] 4.3 Voseo guard: `rg -i '\b(querés|tenés|podés|sabés|arrancá|dale|pegá|corré|elegí|probá|verificá|guardá|ponete|empezá|cancelá)\b' code/packages/exercises/` — expect zero hits
- [ ] 4.4 Smoke: `lcdev list --locale es` and `--locale en` show 10 entries total (5 per track)
- [ ] 4.5 Live smoke (if keys present): `lcdev verify 03-basic-rag --solution` green; `lcdev run 03-basic-rag --solution` prints a grounded answer string (not JSON blob)
- [ ] 4.6 Count files: `fd -t f . code/packages/exercises/02-retrieval-rag/ | wc -l` → 30

## Totals

- Phase 1: 6 tasks
- Phase 2: 25 tasks (5 per exercise × 5)
- Phase 3: 2 tasks
- Phase 4: 6 tasks
- **Total: 39 tasks**

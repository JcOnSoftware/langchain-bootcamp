# Embeddings Factory Specification

## Purpose

Defines `createEmbeddings(provider, apiKey, openaiFallbackKey?)` — the single place that instantiates a concrete embeddings class for a given provider choice.

## Requirements

### Requirement: Provider Mapping

`createEmbeddings` MUST return an `Embeddings` instance matching the provider. Concrete mapping:

| provider | returned class | package |
|---|---|---|
| `openai` | `OpenAIEmbeddings` | `@langchain/openai` |
| `gemini` | `GoogleGenerativeAIEmbeddings` | `@langchain/google-genai` |
| `anthropic` | `OpenAIEmbeddings` (fallback — see next requirement) | `@langchain/openai` |

#### Scenario: openai returns OpenAIEmbeddings

- GIVEN `createEmbeddings("openai", "sk-test")`
- WHEN the factory runs
- THEN the returned instance `.constructor.name === "OpenAIEmbeddings"`

#### Scenario: gemini returns GoogleGenerativeAIEmbeddings

- GIVEN `createEmbeddings("gemini", "AIza-test")`
- WHEN the factory runs
- THEN the returned instance `.constructor.name === "GoogleGenerativeAIEmbeddings"`

### Requirement: Anthropic Fallback

When `provider === "anthropic"`, `createEmbeddings` MUST use `openaiFallbackKey` (or its argument when provided) to instantiate `OpenAIEmbeddings`. If no fallback key is provided and `process.env["OPENAI_API_KEY"]` is also unset, it MUST throw with a message instructing the user to set `OPENAI_API_KEY` or supply the fallback argument.

#### Scenario: anthropic with explicit fallback key

- GIVEN `createEmbeddings("anthropic", "sk-ant-test", "sk-openai-test")`
- WHEN the factory runs
- THEN it returns `OpenAIEmbeddings` configured with `sk-openai-test`
- AND a stderr notice is printed explaining the fallback and pointing to track 07 (v0.2) for Voyage

#### Scenario: anthropic without any openai key throws

- GIVEN `createEmbeddings("anthropic", "sk-ant-test")` with `OPENAI_API_KEY` unset in env
- WHEN the factory runs
- THEN it throws with message containing `"OPENAI_API_KEY"` and `"Anthropic"`

### Requirement: Default Model Per Provider

`createEmbeddings` MUST default to cheap, credible embedding models per provider, overridable via `opts.model`:

| provider | default model |
|---|---|
| `openai` | `text-embedding-3-small` |
| `gemini` | `text-embedding-004` |
| `anthropic` (fallback) | `text-embedding-3-small` |

#### Scenario: default model is used when opts.model absent

- GIVEN `createEmbeddings("openai", "sk-test")`
- WHEN the instance is inspected
- THEN its configured model is `"text-embedding-3-small"`

#### Scenario: opts.model override respected

- GIVEN `createEmbeddings("openai", "sk-test", undefined, { model: "text-embedding-3-large" })`
- WHEN the instance is inspected
- THEN its configured model is `"text-embedding-3-large"`

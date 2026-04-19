# Render-AI-Message Specification

## Purpose

Defines how `lcdev run` extracts human-readable text from a LangChain `AIMessage` without coupling the render module to `@langchain/core` types.

## Requirements

### Requirement: Structural AIMessage Detection

The render module MUST detect an `AIMessage` structurally — no runtime `import` from `@langchain/core`. Detection is positive when the value is a non-null object with a `content` property and a `_getType` method returning `"ai"`.

#### Scenario: AIMessage detected

- GIVEN a value with `content: "hi"` and `_getType()` returning `"ai"`
- WHEN `isAIMessage(value)` runs
- THEN it returns `true`

#### Scenario: AIMessage-shaped-but-other type rejected

- GIVEN a value with `content: "hi"` and `_getType()` returning `"human"`
- WHEN `isAIMessage(value)` runs
- THEN it returns `false`

### Requirement: Text Extraction

For an `AIMessage` whose `content` is a string, `extractAIText` MUST return the string. When `content` is an array of blocks, it MUST concatenate the `text` field of every block whose `type === "text"`, separated by newlines. Non-text blocks MUST be ignored.

#### Scenario: string content returned as-is

- GIVEN `AIMessage { content: "hello" }`
- WHEN `extractAIText(msg)` runs
- THEN the result is `"hello"`

#### Scenario: block array concatenates text blocks

- GIVEN `AIMessage { content: [{ type: "text", text: "a" }, { type: "tool_use", ... }, { type: "text", text: "b" }] }`
- WHEN `extractAIText(msg)` runs
- THEN the result is `"a\nb"`

### Requirement: Render Branch Priority

`renderReturn(value, full)` MUST check `isAIMessage` BEFORE the existing SDK-shape branches (`isMessage`, `isChatCompletion`, `isGeminiResponse`). When the check matches, it MUST route through `extractAIText` + `truncate`.

#### Scenario: AIMessage wins over SDK fallback

- GIVEN a value that would also satisfy `isMessage` (e.g., has `content` array) AND satisfies `isAIMessage`
- WHEN `renderReturn(value, false)` runs
- THEN the output SHALL be the `extractAIText` result, not the `extractText` result

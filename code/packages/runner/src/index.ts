export { runUserCode, type HarnessResult, type CapturedCall } from "./harness.ts";
export { patchBaseChatModel } from "./harness-langchain.ts";
export {
  HarnessError,
  resolveExerciseFile,
  type RunOptions,
  type ExerciseTarget,
  type CapturedCallLangChain,
} from "./types.ts";
export {
  createChatModel,
  type SupportedProvider as ChatModelProvider,
  type CreateChatModelOptions,
} from "./chat-model.ts";
export {
  createEmbeddings,
  type EmbeddingsProvider,
  type CreateEmbeddingsOptions,
} from "./embeddings.ts";

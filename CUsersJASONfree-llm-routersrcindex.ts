export { FreeLLMRouter } from './client/free-llm-router';
export type { FreeLLMRouterConfig } from './client/free-llm-router';

export { LLMRouter } from './router/router';
export type { RouterConfig, RouterEvent, RouterResponse } from './router/router';

export { ModelResolver } from './router/model-resolver';
export type { ModelResolverConfig } from './router/model-resolver';

export { DefaultProviderRegistry } from './providers/registry';
export type { ProviderRegistry } from './providers/registry';

export { GroqProvider } from './providers/groq';
export { MistralProvider } from './providers/mistral';
export { GeminiProvider } from './providers/gemini';
export { OllamaProvider } from './providers/ollama';
export { TogetherAIProvider } from './providers/together-ai';
export { HuggingFaceProvider } from './providers/huggingface';
export { ReplicateProvider } from './providers/replicate';

export { classifyError } from './errors/classify';
export type { ErrorInput } from './errors/classify';

export { MODEL_CATALOG } from './catalog';

export type {
  ProviderId,
  Operation,
  ProviderModel,
  Candidate,
  ProviderAdapter,
  ClassifiedError,
  ErrorClass,
  ProviderResult,
} from './types/provider';

export type {
  ChatCompletionRequest,
  ChatCompletionMessage,
  ChatCompletion,
  ChatCompletionChoice,
  CompletionUsage,
  ChatCompletionChunk,
  EmbeddingRequest,
  EmbeddingResponse,
  Embedding,
} from './types/openai';

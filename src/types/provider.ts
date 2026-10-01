import type { ChatCompletion, ChatCompletionRequest } from './openai';

export type ProviderId = 'groq' | 'mistral' | 'gemini' | 'ollama' | 'together' | 'huggingface' | 'replicate' | 'cohere' | 'cloudflare';
export type Operation = 'chat' | 'embeddings';

export interface ModelCapabilities {
  readonly chat: boolean;
  readonly embeddings: boolean;
  readonly tools: boolean;
  readonly jsonMode: boolean;
  readonly vision: boolean;
  readonly streaming: boolean;
  readonly contextTokens: number;
  readonly embeddingDimensions?: number;
}

export interface ProviderModel {
  readonly provider: ProviderId;
  readonly modelId: string;
  readonly capabilities: ModelCapabilities;
  readonly limits: { readonly rpm?: number; readonly rpd?: number; readonly tpm?: number; readonly monthly?: number };
  readonly commercialUseAllowed: boolean;
}

export interface Candidate {
  readonly provider: ProviderId;
  readonly model: ProviderModel;
  readonly key: string;
}

export interface AttemptContext {
  readonly requestId: string;
  readonly attempt: number;
  readonly signal: AbortSignal;
}

export interface RateLimitInfo {
  readonly remaining?: number;
  readonly reset?: number;
  readonly limit?: number;
}

export interface ClassifiedError {
  readonly class: ErrorClass;
  readonly status: number | null;
  readonly provider: ProviderId;
  readonly modelId: string;
  readonly retryAfterMs: number | null;
  readonly message: string;
}

export type ErrorClass =
  | 'RATE_LIMIT'
  | 'QUOTA'
  | 'AUTH'
  | 'SERVER'
  | 'NETWORK'
  | 'MODEL_NOT_FOUND'
  | 'CONTEXT_LENGTH'
  | 'CONTENT_FILTER'
  | 'INVALID_REQUEST';

export type ProviderResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
      readonly rateLimit: RateLimitInfo;
      readonly latencyMs: number;
    }
  | {
      readonly ok: false;
      readonly error: ClassifiedError;
      readonly rateLimit: RateLimitInfo;
      readonly latencyMs: number;
    };

export interface ProviderAdapter<Req = ChatCompletionRequest, Res = ChatCompletion> {
  readonly id: ProviderId;
  isConfigured(): boolean;
  chat(req: Req, model: ProviderModel, ctx: AttemptContext): Promise<ProviderResult<Res>>;
}

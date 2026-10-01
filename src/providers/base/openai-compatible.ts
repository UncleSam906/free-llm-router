import { classifyError } from '../../errors/classify';
import type {
  AttemptContext,
  ClassifiedError,
  ProviderAdapter,
  ProviderModel,
  ProviderResult,
  ProviderId,
  RateLimitInfo,
} from '../../types/provider';
import type { ChatCompletionRequest, ChatCompletion } from '../../types/openai';

export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
}

export abstract class OpenAICompatibleAdapter implements ProviderAdapter {
  abstract readonly id: ProviderId;
  protected baseUrl: string;
  protected apiKey: string;
  protected defaultHeaders: Record<string, string>;

  constructor(config: OpenAICompatibleConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...config.headers,
    };
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  abstract transformRequest(req: ChatCompletionRequest, model: ProviderModel): Record<string, unknown>;

  abstract transformResponse(res: unknown): ChatCompletion;

  protected extractRateLimit(headers: Record<string, string>): RateLimitInfo {
    return {
      remaining: this.parseHeader(headers, 'x-ratelimit-remaining-requests'),
      reset: this.parseHeader(headers, 'x-ratelimit-reset-requests'),
      limit: this.parseHeader(headers, 'x-ratelimit-limit-requests'),
    };
  }

  protected parseHeader(headers: Record<string, string>, name: string): number | undefined {
    const value = headers[name.toLowerCase()];
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  async chat(
    req: ChatCompletionRequest,
    model: ProviderModel,
    ctx: AttemptContext
  ): Promise<ProviderResult<ChatCompletion>> {
    const startTime = performance.now();

    try {
      const transformedReq = this.transformRequest(req, model);
      const url = new URL('/v1/chat/completions', this.baseUrl).toString();

      const response = await fetch(url, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(transformedReq),
        signal: ctx.signal,
      });

      const latencyMs = performance.now() - startTime;
      const headers = Object.fromEntries(response.headers.entries());
      const rateLimit = this.extractRateLimit(headers);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = classifyError({
          status: response.status,
          body,
          provider: this.id,
          modelId: model.modelId,
          headers,
        });

        return {
          ok: false,
          error,
          rateLimit,
          latencyMs,
        };
      }

      const data: unknown = await response.json();
      const result = this.transformResponse(data);

      return {
        ok: true,
        value: result,
        rateLimit,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = performance.now() - startTime;

      if (err instanceof DOMException && err.name === 'AbortError') {
        const error: ClassifiedError = {
          class: 'NETWORK',
          status: null,
          provider: this.id,
          modelId: model.modelId,
          retryAfterMs: null,
          message: 'Request cancelled',
        };
        return { ok: false, error, rateLimit: {}, latencyMs };
      }

      if (err instanceof Error) {
        const message = err.message;
        let errorClass: 'NETWORK' | 'SERVER' = 'NETWORK';

        if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
          errorClass = 'NETWORK';
        }

        const error: ClassifiedError = {
          class: errorClass,
          status: null,
          provider: this.id,
          modelId: model.modelId,
          retryAfterMs: null,
          message: message.substring(0, 256),
        };
        return { ok: false, error, rateLimit: {}, latencyMs };
      }

      const error: ClassifiedError = {
        class: 'NETWORK',
        status: null,
        provider: this.id,
        modelId: model.modelId,
        retryAfterMs: null,
        message: 'Unknown error',
      };
      return { ok: false, error, rateLimit: {}, latencyMs };
    }
  }
}

import { classifyError } from '../errors/classify';
import type {
  AttemptContext,
  ClassifiedError,
  ProviderAdapter,
  ProviderModel,
  ProviderResult,
  ProviderId,
  RateLimitInfo,
} from '../types/provider';
import { parseChatCompletion } from '../types/openai';
import type { ChatCompletion, ChatCompletionRequest } from '../types/openai';

export interface GeminiConfig {
  apiKey: string;
}

export class GeminiProvider implements ProviderAdapter {
  readonly id: ProviderId = 'gemini';
  private apiKey: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async chat(
    req: ChatCompletionRequest,
    model: ProviderModel,
    ctx: AttemptContext
  ): Promise<ProviderResult<ChatCompletion>> {
    const startTime = performance.now();

    try {
      // Gemini has an OpenAI-compatible endpoint
      const url = new URL(
        `/v1beta/openai/chat/completions?key=${this.apiKey}`,
        'https://generativelanguage.googleapis.com'
      ).toString();

      const body: Record<string, unknown> = {
        model: model.modelId,
        messages: req.messages,
        temperature: req.temperature,
        top_p: req.top_p,
        max_tokens: req.max_tokens,
        stop: req.stop,
        // Gemini vision and tool support through compatibility layer
      };

      // Filter out unsupported fields for Gemini
      if ('presence_penalty' in req && req.presence_penalty) {
        body.presence_penalty = req.presence_penalty;
      }
      if ('frequency_penalty' in req && req.frequency_penalty) {
        body.frequency_penalty = req.frequency_penalty;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: ctx.signal,
      });

      const latencyMs = performance.now() - startTime;
      const headers = Object.fromEntries(response.headers.entries());
      const rateLimit = this.extractRateLimit(headers);

      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        const error = classifyError({
          status: response.status,
          body: responseBody,
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
      const result = this.normalizeResponse(data);

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

      const error: ClassifiedError = {
        class: 'NETWORK',
        status: null,
        provider: this.id,
        modelId: model.modelId,
        retryAfterMs: null,
        message: err instanceof Error ? err.message.substring(0, 256) : 'Unknown error',
      };
      return { ok: false, error, rateLimit: {}, latencyMs };
    }
  }

  private normalizeResponse(res: unknown): ChatCompletion {
    // Gemini returns OpenAI-compatible format
    return parseChatCompletion(res);
  }

  private extractRateLimit(headers: Record<string, string>): RateLimitInfo {
    return {
      remaining: this.parseHeader(headers, 'x-ratelimit-remaining-requests'),
      reset: this.parseHeader(headers, 'x-ratelimit-reset-requests'),
      limit: this.parseHeader(headers, 'x-ratelimit-limit-requests'),
    };
  }

  private parseHeader(headers: Record<string, string>, name: string): number | undefined {
    const value = headers[name.toLowerCase()];
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }
}

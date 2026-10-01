import { randomUUID } from 'crypto';
import type { Candidate, ClassifiedError, ProviderId } from '../types/provider';
import type { ChatCompletionRequest, ChatCompletion } from '../types/openai';
import type { ProviderRegistry } from '../providers/registry';
import { ModelResolver } from './model-resolver';
import { PriorityStrategy } from './strategies/priority';

export interface RouterEvent {
  type: 'attempt' | 'fallback' | 'success' | 'exhausted';
  requestId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface RouterConfig {
  providers: Record<ProviderId, boolean>;
  aliases: Record<string, readonly string[]>;
  defaultAlias: string;
  deadlineMs: number;
  attemptTimeoutMs: number;
}

export interface RouterResponse extends ChatCompletion {
  x_router?: {
    provider: ProviderId;
    model: string;
    attempts: number;
    fallbacks: Array<{ from: string; reason: string }>;
  };
}

export class LLMRouter {
  private registry: ProviderRegistry;
  private modelResolver: ModelResolver;
  private strategy: PriorityStrategy;
  private config: RouterConfig;
  private events: RouterEvent[] = [];

  constructor(
    registry: ProviderRegistry,
    modelResolver: ModelResolver,
    config: RouterConfig
  ) {
    this.registry = registry;
    this.modelResolver = modelResolver;
    this.strategy = new PriorityStrategy();
    this.config = config;
  }

  async chat(req: ChatCompletionRequest, signal?: AbortSignal): Promise<RouterResponse> {
    const requestId = randomUUID();
    const deadline = Date.now() + this.config.deadlineMs;
    const fallbacks: Array<{ from: string; reason: string }> = [];
    let lastError: ClassifiedError | null = null;
    let lastProvider: ProviderId | null = null;
    let lastModel: string | null = null;
    const tried: string[] = [];
    let attempts = 0;

    // Resolve model candidates
    const candidates = this.modelResolver.resolve(req.model, 'chat');
    if (candidates.length === 0) {
      throw new Error(`No candidates found for model: ${req.model}`);
    }

    // Order candidates by strategy
    const ordered = this.strategy.order(candidates);

    // Waterfall through candidates
    for (const candidate of ordered) {
      if (Date.now() >= deadline) {
        this.emit({
          type: 'exhausted',
          requestId,
          timestamp: Date.now(),
          data: { tried, lastError },
        });
        throw new Error('Deadline exceeded');
      }

      const provider = this.registry.get(candidate.provider);
      if (!provider || !provider.isConfigured()) {
        continue;
      }

      // Create abort signal with timeout
      const controller = new AbortSignal();
      const timeout = Math.min(
        this.config.attemptTimeoutMs,
        deadline - Date.now()
      );
      const timeoutHandle = setTimeout(() => controller.dispatchEvent(new Event('abort')), timeout);

      // Forward caller's abort signal
      if (signal?.aborted) {
        controller.dispatchEvent(new Event('abort'));
      }
      if (signal) {
        signal.addEventListener('abort', () => controller.dispatchEvent(new Event('abort')));
      }

      attempts++;

      // Attempt the request
      this.emit({
        type: 'attempt',
        requestId,
        timestamp: Date.now(),
        data: { candidate: candidate.key, attempt: attempts },
      });

      try {
        const result = await provider.chat(req, candidate.model, {
          requestId,
          attempt: attempts,
          signal: controller as unknown as AbortSignal,
        });

        clearTimeout(timeoutHandle);

        if (result.ok) {
          this.emit({
            type: 'success',
            requestId,
            timestamp: Date.now(),
            data: { candidate: candidate.key, attempts, latencyMs: result.latencyMs },
          });

          const response: RouterResponse = {
            ...result.value,
            x_router: {
              provider: candidate.provider,
              model: candidate.model.modelId,
              attempts,
              fallbacks,
            },
          };

          return response;
        }

        // Request failed, record and try next
        lastError = result.error;
        lastProvider = candidate.provider;
        lastModel = candidate.model.modelId;
        tried.push(candidate.key);

        this.emit({
          type: 'fallback',
          requestId,
          timestamp: Date.now(),
          data: {
            from: candidate.key,
            reason: result.error.class,
            status: result.error.status,
          },
        });

        fallbacks.push({
          from: candidate.key,
          reason: result.error.class,
        });
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    // All candidates exhausted
    this.emit({
      type: 'exhausted',
      requestId,
      timestamp: Date.now(),
      data: { tried, lastError },
    });

    throw new Error(
      `All providers failed. Last error: ${lastError?.class} from ${lastProvider}:${lastModel}`
    );
  }

  private emit(event: RouterEvent): void {
    this.events.push(event);
  }

  getEvents(): RouterEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

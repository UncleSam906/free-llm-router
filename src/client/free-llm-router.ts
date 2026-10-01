import type { ChatCompletionRequest, ChatCompletion } from '../types/openai';
import type { ProviderModel, ProviderId } from '../types/provider';
import { DefaultProviderRegistry } from '../providers/registry';
import { ModelResolver } from '../router/model-resolver';
import { LLMRouter, type RouterConfig, type RouterResponse } from '../router/router';
import { MODEL_CATALOG } from '../catalog';

/** Providers enabled when config.providers is not given (all have a no-card free tier). */
export const DEFAULT_PROVIDERS: ProviderId[] = ['groq', 'gemini', 'mistral', 'openrouter'];

/** Default aliases. Every entry must exist in MODEL_CATALOG (enforced by tests). */
export const DEFAULT_ALIASES: Record<string, readonly string[]> = {
  fast: ['groq:openai/gpt-oss-20b', 'gemini:gemini-3.5-flash-lite', 'openrouter:qwen/qwen3.8-27b:free'],
  default: [
    'groq:openai/gpt-oss-120b',
    'gemini:gemini-3.8-flash',
    'mistral:mistral-small-2603',
    'openrouter:nvidia/nemotron-3-super-120b-a12b:free',
  ],
};

export interface FreeLLMRouterConfig {
  providers?: ProviderId[];
  apiKeys?: Partial<Record<ProviderId, string>>;
  aliases?: Record<string, readonly string[]>;
  defaultAlias?: string;
  deadlineMs?: number;
  attemptTimeoutMs?: number;
}

export class FreeLLMRouter {
  private router: LLMRouter;

  readonly chat = {
    completions: {
      create: async (req: ChatCompletionRequest): Promise<RouterResponse> => {
        return this.router.chat(req);
      },
    },
  };

  constructor(config: FreeLLMRouterConfig = {}) {
    // Load API keys from environment if not provided
    const apiKeys: Partial<Record<ProviderId, string>> = {
      groq: config.apiKeys?.groq || process.env.GROQ_API_KEY,
      mistral: config.apiKeys?.mistral || process.env.MISTRAL_API_KEY,
      gemini: config.apiKeys?.gemini || process.env.GOOGLE_API_KEY,
      cohere: config.apiKeys?.cohere || process.env.COHERE_API_KEY,
      cloudflare: config.apiKeys?.cloudflare || process.env.CLOUDFLARE_API_TOKEN,
      openrouter: config.apiKeys?.openrouter || process.env.OPENROUTER_API_KEY,
    };

    // Filter to only configured providers
    const configuredKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([, key]) => !!key)
    ) as Partial<Record<ProviderId, string>>;

    // Create registry
    const registry = new DefaultProviderRegistry(configuredKeys);

    // Build catalog from MODEL_CATALOG, grouped by provider
    const catalog: Record<ProviderId, ProviderModel[]> = {
      groq: [],
      mistral: [],
      gemini: [],
      ollama: [],
      together: [],
      huggingface: [],
      replicate: [],
      openrouter: [],
      cohere: [],
      cloudflare: [],
    };

    for (const model of MODEL_CATALOG) {
      catalog[model.provider].push(model);
    }

    // Create model resolver
    const modelResolver = new ModelResolver({
      providers: catalog,
      aliases: config.aliases || DEFAULT_ALIASES,
      defaultAlias: config.defaultAlias || 'default',
      unknownModelPolicy: 'use-default-alias',
    });

    // Create router
    const routerConfig: RouterConfig = {
      providers: Object.fromEntries(
        (config.providers || DEFAULT_PROVIDERS).map((p) => [p, true])
      ) as Record<ProviderId, boolean>,
      aliases: config.aliases || {},
      defaultAlias: config.defaultAlias || 'default',
      deadlineMs: config.deadlineMs || 30000,
      attemptTimeoutMs: config.attemptTimeoutMs || 10000,
    };

    this.router = new LLMRouter(registry, modelResolver, routerConfig);
  }
}



import type { ChatCompletionRequest, ChatCompletion } from '../types/openai';
import type { ProviderModel, ProviderId } from '../types/provider';
import { DefaultProviderRegistry } from '../providers/registry';
import { ModelResolver } from '../router/model-resolver';
import { LLMRouter, type RouterConfig, type RouterResponse } from '../router/router';
import { MODEL_CATALOG } from '../catalog';

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
    };

    // Filter to only configured providers
    const configuredKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([, key]) => !!key)
    ) as Partial<Record<ProviderId, string>>;

    // Create registry
    const registry = new DefaultProviderRegistry(configuredKeys);

    // Create mock catalog (Phase 1: minimal set)
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
      aliases: config.aliases || {
        fast: ['groq:openai/gpt-oss-120b', 'mistral:mistral-small-3.1-24b-instruct'],
        default: ['mistral:mistral-small-3.1-24b-instruct', 'gemini:gemini-2.5-flash', 'groq:openai/gpt-oss-120b'],
      },
      defaultAlias: config.defaultAlias || 'default',
      unknownModelPolicy: 'use-default-alias',
    });

    // Create router
    const routerConfig: RouterConfig = {
      providers: Object.fromEntries(
        (config.providers || ['groq', 'mistral', 'gemini']).map((p) => [p, true])
      ) as Record<ProviderId, boolean>,
      aliases: config.aliases || {},
      defaultAlias: config.defaultAlias || 'default',
      deadlineMs: config.deadlineMs || 30000,
      attemptTimeoutMs: config.attemptTimeoutMs || 10000,
    };

    this.router = new LLMRouter(registry, modelResolver, routerConfig);
  }
}



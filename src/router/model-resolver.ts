import type { Candidate, ProviderModel, ProviderId } from '../types/provider';

export interface ModelResolverConfig {
  providers: Record<ProviderId, readonly ProviderModel[]>;
  aliases: Record<string, readonly string[]>;
  defaultAlias: string;
  unknownModelPolicy: 'use-default-alias' | 'reject';
}

/**
 * Split "provider:model" on the FIRST colon only, so model IDs that contain
 * colons (e.g. OpenRouter "qwen/qwen3.8-27b:free") stay intact.
 */
export function splitProviderKey(key: string): [string, string] {
  const i = key.indexOf(':');
  return i === -1 ? [key, ''] : [key.slice(0, i), key.slice(i + 1)];
}

export class ModelResolver {
  private config: ModelResolverConfig;

  constructor(config: ModelResolverConfig) {
    this.config = config;
  }

  resolve(modelRequest: string, operation: 'chat' | 'embeddings'): Candidate[] {
    const candidates: Candidate[] = [];

    // Hard pin: "groq:openai/gpt-oss-120b"
    if (modelRequest.includes(':')) {
      const [providerPrefix, modelId] = splitProviderKey(modelRequest);
      const provider = providerPrefix as ProviderId;
      const models = this.config.providers[provider];
      if (models) {
        const model = models.find((m) => m.modelId === modelId);
        if (model && this.hasCapability(model, operation)) {
          candidates.push({
            provider,
            model,
            key: `${provider}:${modelId}`,
          });
        }
      }
      return candidates;
    }

    // Known model: look it up in the catalog
    for (const [providerId, models] of Object.entries(this.config.providers)) {
      for (const model of models) {
        if (model.modelId === modelRequest && this.hasCapability(model, operation)) {
          candidates.push({
            provider: providerId as ProviderId,
            model,
            key: `${providerId}:${modelRequest}`,
          });
        }
      }
    }

    // If found, return it plus any alias group
    if (candidates.length > 0) {
      const aliasGroup = this.resolveAlias(modelRequest, operation);
      return [...candidates, ...aliasGroup];
    }

    // Unknown model: use default alias
    if (this.config.unknownModelPolicy === 'use-default-alias') {
      return this.resolveAlias(this.config.defaultAlias, operation);
    }

    return [];
  }

  private resolveAlias(alias: string, operation: 'chat' | 'embeddings'): Candidate[] {
    const candidates: Candidate[] = [];
    const modelIds = this.config.aliases[alias] || this.config.aliases[this.config.defaultAlias];

    if (!modelIds) return candidates;

    for (const modelId of modelIds) {
      const [providerPrefix, id] = splitProviderKey(modelId);
      const provider = providerPrefix as ProviderId;
      const models = this.config.providers[provider];

      if (models) {
        const model = models.find((m) => m.modelId === id);
        if (model && this.hasCapability(model, operation)) {
          candidates.push({
            provider,
            model,
            key: modelId,
          });
        }
      }
    }

    return candidates;
  }

  private hasCapability(model: ProviderModel, operation: 'chat' | 'embeddings'): boolean {
    return operation === 'chat' ? model.capabilities.chat : model.capabilities.embeddings;
  }
}

import { describe, it, expect } from 'vitest';
import { MODEL_CATALOG } from '../../src/catalog';
import { DEFAULT_ALIASES, DEFAULT_PROVIDERS } from '../../src/client/free-llm-router';
import { ModelResolver, splitProviderKey } from '../../src/router/model-resolver';
import type { ProviderId, ProviderModel } from '../../src/types/provider';

function catalogByProvider(): Record<ProviderId, ProviderModel[]> {
  const byProvider = {
    groq: [], mistral: [], gemini: [], ollama: [], together: [],
    huggingface: [], replicate: [], openrouter: [], cohere: [], cloudflare: [],
  } as Record<ProviderId, ProviderModel[]>;
  for (const m of MODEL_CATALOG) byProvider[m.provider].push(m);
  return byProvider;
}

describe('Model catalog', () => {
  it('every default alias entry exists in the catalog', () => {
    const keys = new Set(MODEL_CATALOG.map((m) => `${m.provider}:${m.modelId}`));
    for (const entries of Object.values(DEFAULT_ALIASES)) {
      for (const entry of entries) expect(keys.has(entry), entry).toBe(true);
    }
  });

  it('default aliases only use default providers', () => {
    for (const entries of Object.values(DEFAULT_ALIASES)) {
      for (const entry of entries) {
        expect(DEFAULT_PROVIDERS).toContain(splitProviderKey(entry)[0] as ProviderId);
      }
    }
  });

  it('resolves the default alias to all its candidates', () => {
    const resolver = new ModelResolver({
      providers: catalogByProvider(),
      aliases: DEFAULT_ALIASES,
      defaultAlias: 'default',
      unknownModelPolicy: 'use-default-alias',
    });
    const keys = resolver.resolve('default', 'chat').map((c) => c.key);
    expect(keys).toEqual([...DEFAULT_ALIASES.default]);
  });

  it('keeps colons inside model IDs (OpenRouter :free)', () => {
    expect(splitProviderKey('openrouter:qwen/qwen3.8-27b:free')).toEqual([
      'openrouter',
      'qwen/qwen3.8-27b:free',
    ]);
    const resolver = new ModelResolver({
      providers: catalogByProvider(),
      aliases: {},
      defaultAlias: 'default',
      unknownModelPolicy: 'reject',
    });
    const c = resolver.resolve('openrouter:qwen/qwen3.8-27b:free', 'chat');
    expect(c).toHaveLength(1);
    expect(c[0].model.modelId).toBe('qwen/qwen3.8-27b:free');
  });

  it('contains no paid-only providers or retired models', () => {
    for (const m of MODEL_CATALOG) {
      expect(['together', 'replicate']).not.toContain(m.provider);
    }
    const ids = MODEL_CATALOG.map((m) => m.modelId);
    expect(ids).not.toContain('mixtral-8x7b-32768');
    expect(ids).not.toContain('gemini-pro');
  });
});

import { describe, it, expect } from 'vitest';
import { GroqProvider } from '../../src/providers/groq';
import { MistralProvider } from '../../src/providers/mistral';
import { GeminiProvider } from '../../src/providers/gemini';
import { DefaultProviderRegistry } from '../../src/providers/registry';
import type { ProviderModel } from '../../src/types/provider';

const mockModel: ProviderModel = {
  provider: 'groq',
  modelId: 'openai/gpt-oss-120b',
  capabilities: {
    chat: true,
    embeddings: false,
    tools: false,
    jsonMode: false,
    vision: false,
    streaming: true,
    contextTokens: 131072,
  },
  limits: { rpm: 30, tpm: 1000, rpd: 1000 },
  commercialUseAllowed: true,
};

describe('Providers', () => {
  describe('GroqProvider', () => {
    it('is configured when apiKey is provided', () => {
      const provider = new GroqProvider('test-key');
      expect(provider.isConfigured()).toBe(true);
    });

    it('is not configured when apiKey is empty', () => {
      const provider = new GroqProvider('');
      expect(provider.isConfigured()).toBe(false);
    });

    it('transforms request correctly', () => {
      const provider = new GroqProvider('test-key');
      const req = {
        model: 'auto',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        temperature: 0.7,
        max_tokens: 100,
      };
      const transformed = provider.transformRequest(req, mockModel);

      expect(transformed.model).toBe(mockModel.modelId);
      expect(transformed.messages).toBe(req.messages);
      expect(transformed.temperature).toBe(0.7);
      expect(transformed.max_tokens).toBe(100);
    });
  });

  describe('MistralProvider', () => {
    it('is configured when apiKey is provided', () => {
      const provider = new MistralProvider('test-key');
      expect(provider.isConfigured()).toBe(true);
    });

    it('transforms request with tools', () => {
      const provider = new MistralProvider('test-key');
      const req = {
        model: 'auto',
        messages: [{ role: 'user' as const, content: 'Hello' }],
        tools: [
          {
            type: 'function' as const,
            function: {
              name: 'test',
              parameters: { type: 'object' },
            },
          },
        ],
      };
      const transformed = provider.transformRequest(req, { ...mockModel, provider: 'mistral' });

      expect(transformed.tools).toBe(req.tools);
    });
  });

  describe('GeminiProvider', () => {
    it('is configured when apiKey is provided', () => {
      const provider = new GeminiProvider({ apiKey: 'test-key' });
      expect(provider.isConfigured()).toBe(true);
    });

    it('is not configured when apiKey is empty', () => {
      const provider = new GeminiProvider({ apiKey: '' });
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('DefaultProviderRegistry', () => {
    it('registers configured providers', () => {
      const registry = new DefaultProviderRegistry({
        groq: 'groq-key',
        mistral: 'mistral-key',
      });

      expect(registry.get('groq')).not.toBeNull();
      expect(registry.get('mistral')).not.toBeNull();
      expect(registry.get('gemini')).toBeNull();
    });

    it('returns null for unconfigured providers', () => {
      const registry = new DefaultProviderRegistry({});
      expect(registry.get('groq')).toBeNull();
    });

    it('allows manual registration', () => {
      const registry = new DefaultProviderRegistry({});
      const provider = new GroqProvider('groq-key');
      registry.register(provider);

      expect(registry.get('groq')).toBe(provider);
    });
  });
});

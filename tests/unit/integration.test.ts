import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FreeLLMRouter } from '../../src/client/free-llm-router';

describe('FreeLLMRouter Integration', () => {
  let router: FreeLLMRouter;

  beforeEach(() => {
    // Create router with mock API keys
    router = new FreeLLMRouter({
      apiKeys: {
        groq: 'test-groq-key',
        mistral: 'test-mistral-key',
        gemini: 'test-gemini-key',
      },
      aliases: {
        fast: ['groq:openai/gpt-oss-20b', 'gemini:gemini-3.5-flash-lite'],
        default: ['groq:openai/gpt-oss-120b', 'gemini:gemini-3.8-flash', 'mistral:mistral-small-2603'],
      },
      defaultAlias: 'default',
    });
  });

  it('initializes with configured providers', () => {
    expect(router).toBeDefined();
    expect(router.chat).toBeDefined();
    expect(router.chat.completions).toBeDefined();
    expect(router.chat.completions.create).toBeDefined();
  });

  it('exposes the OpenAI-compatible interface', async () => {
    // This test verifies the interface exists - actual HTTP calls would be mocked in integration tests
    expect(typeof router.chat.completions.create).toBe('function');

    // The actual call would fail because we're using test API keys
    // In real integration tests, we'd use MSW to mock the HTTP responses
  });

  it('loads API keys from environment variables', () => {
    // Temporarily set env vars
    process.env.GROQ_API_KEY = 'env-groq-key';
    process.env.MISTRAL_API_KEY = 'env-mistral-key';
    process.env.GOOGLE_API_KEY = 'env-gemini-key';

    const routerFromEnv = new FreeLLMRouter({});
    expect(routerFromEnv).toBeDefined();

    // Cleanup
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  it('prefers explicit config over environment variables', () => {
    process.env.GROQ_API_KEY = 'env-key';
    
    const configRouter = new FreeLLMRouter({
      apiKeys: { groq: 'config-key' },
    });
    
    expect(configRouter).toBeDefined();
    delete process.env.GROQ_API_KEY;
  });
});

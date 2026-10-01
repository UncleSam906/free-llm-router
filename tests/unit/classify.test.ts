import { describe, it, expect } from 'vitest';
import { classifyError } from '../../src/errors/classify';

describe('classifyError', () => {
  it('classifies 401 as AUTH', () => {
    const error = classifyError({
      status: 401,
      body: { error: { message: 'Unauthorized' } },
      provider: 'groq',
      modelId: 'test-model',
    });
    expect(error.class).toBe('AUTH');
  });

  it('classifies 429 with quota keywords as QUOTA', () => {
    const error = classifyError({
      status: 429,
      body: { error: { message: 'Monthly quota exceeded' } },
      provider: 'cohere',
      modelId: 'command-r',
      headers: {},
    });
    expect(error.class).toBe('QUOTA');
  });

  it('classifies 429 without quota keywords as RATE_LIMIT', () => {
    const error = classifyError({
      status: 429,
      body: { error: { message: 'Too many requests' } },
      provider: 'groq',
      modelId: 'test',
      headers: {},
    });
    expect(error.class).toBe('RATE_LIMIT');
  });

  it('classifies 5xx as SERVER', () => {
    const error = classifyError({
      status: 502,
      body: { error: { message: 'Bad gateway' } },
      provider: 'mistral',
      modelId: 'test',
    });
    expect(error.class).toBe('SERVER');
  });

  it('parses retry-after in seconds', () => {
    const error = classifyError({
      status: 429,
      body: {},
      provider: 'groq',
      modelId: 'test',
      headers: { 'retry-after': '60' },
    });
    expect(error.retryAfterMs).toBe(60000);
  });

  it('parses retry-after in duration format (2m59.56s)', () => {
    const error = classifyError({
      status: 429,
      body: {},
      provider: 'groq',
      modelId: 'test',
      headers: { 'x-ratelimit-reset-requests': '2m59.56s' },
    });
    expect(error.retryAfterMs).toBeCloseTo(179560, 100);
  });

  it('classifies 400 with context_length keywords as CONTEXT_LENGTH', () => {
    const error = classifyError({
      status: 400,
      body: { error: { message: 'Context length exceeded' } },
      provider: 'gemini',
      modelId: 'test',
    });
    expect(error.class).toBe('CONTEXT_LENGTH');
  });

  it('classifies 400 with model_not_found keywords as MODEL_NOT_FOUND', () => {
    const error = classifyError({
      status: 400,
      body: { error: { message: 'Model groq:openai/llama-3.3-70b-versatile not found' } },
      provider: 'groq',
      modelId: 'test',
    });
    expect(error.class).toBe('MODEL_NOT_FOUND');
  });

  it('classifies other 400 errors as INVALID_REQUEST', () => {
    const error = classifyError({
      status: 400,
      body: { error: { message: 'Invalid request' } },
      provider: 'mistral',
      modelId: 'test',
    });
    expect(error.class).toBe('INVALID_REQUEST');
  });

  it('classifies 402 as QUOTA', () => {
    const error = classifyError({
      status: 402,
      body: {},
      provider: 'cohere',
      modelId: 'test',
    });
    expect(error.class).toBe('QUOTA');
  });

  it('classifies network errors (null status) as NETWORK', () => {
    const error = classifyError({
      status: null,
      body: null,
      provider: 'groq',
      modelId: 'test',
    });
    expect(error.class).toBe('NETWORK');
  });

  it('handles Gemini array-wrapped errors', () => {
    const error = classifyError({
      status: 400,
      body: [{ error: { status: 'INVALID_ARGUMENT', message: 'Bad request' } }],
      provider: 'gemini',
      modelId: 'test',
    });
    expect(error.class).toBe('INVALID_REQUEST');
    expect(error.message).toContain('Bad request');
  });

  it('handles string error body', () => {
    const error = classifyError({
      status: 500,
      body: 'Internal server error',
      provider: 'mistral',
      modelId: 'test',
    });
    expect(error.class).toBe('SERVER');
    expect(error.message).toContain('Internal server error');
  });
});

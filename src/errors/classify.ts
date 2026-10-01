import type { ClassifiedError, ErrorClass, ProviderId } from '../types/provider';

export interface ErrorInput {
  status: number | null;
  body: unknown;
  provider: ProviderId;
  modelId: string;
  headers?: Record<string, string>;
}

export function classifyError(input: ErrorInput): ClassifiedError {
  const { status, body, provider, modelId, headers = {} } = input;

  // Network/connectivity errors
  if (status === null) {
    return {
      class: 'NETWORK',
      status: null,
      provider,
      modelId,
      retryAfterMs: null,
      message: 'Network error',
    };
  }

  // 401/403 - Authentication
  if (status === 401 || status === 403) {
    return {
      class: 'AUTH',
      status,
      provider,
      modelId,
      retryAfterMs: null,
      message: 'Authentication failed',
    };
  }

  // 400/422 - Invalid request
  if (status === 400 || status === 422) {
    const msg = getErrorMessage(body);
    
    // Model not found - check before context length
    if (msg.toLowerCase().includes('model') && msg.toLowerCase().includes('not found')) {
      return {
        class: 'MODEL_NOT_FOUND',
        status,
        provider,
        modelId,
        retryAfterMs: null,
        message: msg,
      };
    }

    // Context length checks
    if (msg.toLowerCase().includes('context') || msg.toLowerCase().includes('too many tokens') || msg.toLowerCase().includes('exceed')) {
      return {
        class: 'CONTEXT_LENGTH',
        status,
        provider,
        modelId,
        retryAfterMs: null,
        message: msg,
      };
    }

    return {
      class: 'INVALID_REQUEST',
      status,
      provider,
      modelId,
      retryAfterMs: null,
      message: msg,
    };
  }

  // 429 - Rate limit or quota
  if (status === 429) {
    const retryAfter = parseRetryAfter(headers);
    
    // Determine if it's a short-term rate limit or a daily/monthly quota
    const msg = getErrorMessage(body);
    if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('daily') || msg.toLowerCase().includes('monthly')) {
      return {
        class: 'QUOTA',
        status,
        provider,
        modelId,
        retryAfterMs: retryAfter,
        message: msg,
      };
    }

    return {
      class: 'RATE_LIMIT',
      status,
      provider,
      modelId,
      retryAfterMs: retryAfter,
      message: msg,
    };
  }

  // 402 - Payment required (quota)
  if (status === 402) {
    return {
      class: 'QUOTA',
      status,
      provider,
      modelId,
      retryAfterMs: null,
      message: 'Payment required',
    };
  }

  // 5xx - Server error
  if (status >= 500 && status < 600) {
    const msg = getErrorMessage(body) || `Server error: ${status}`;
    return {
      class: 'SERVER',
      status,
      provider,
      modelId,
      retryAfterMs: parseRetryAfter(headers),
      message: msg,
    };
  }

  // Fallback
  return {
    class: 'SERVER',
    status,
    provider,
    modelId,
    retryAfterMs: null,
    message: `HTTP ${status}`,
  };
}

function getErrorMessage(body: unknown): string {
  if (typeof body === 'string') {
    return body.substring(0, 256);
  }

  if (body && typeof body === 'object') {
    // Gemini: array-wrapped errors
    if (Array.isArray(body)) {
      const first = body[0];
      if (first && typeof first === 'object' && 'error' in first) {
        return JSON.stringify(first.error).substring(0, 256);
      }
      return body.toString().substring(0, 256);
    }

    // OpenAI standard
    if ('error' in body && body.error) {
      const err = body.error;
      if (typeof err === 'object' && 'message' in err) {
        return String(err.message).substring(0, 256);
      }
    }

    // Cohere
    if ('message' in body) {
      return String(body.message).substring(0, 256);
    }

    // Generic object message
    if ('message' in body) {
      return String(body.message).substring(0, 256);
    }
  }

  return '';
}

function parseRetryAfter(headers: Record<string, string>): number | null {
  const retryAfter = headers['retry-after'] || headers['x-ratelimit-reset-requests'];
  if (!retryAfter) return null;

  // Try parsing as duration like "2m59.56s" FIRST (before parseInt which will partial-match)
  const match = retryAfter.match(/^(\d+)m([\d.]+)s$/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const secs = parseFloat(match[2]);
    return Math.round((minutes * 60 + secs) * 1000);
  }

  // Try parsing as pure seconds (must be fully numeric)
  if (/^\d+$/.test(retryAfter)) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }

  return null;
}

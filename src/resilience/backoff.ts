export interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor?: number;
}

export class ExponentialBackoff {
  constructor(private config: BackoffConfig) {}

  calculate(attempt: number, retryAfterMs?: number): number {
    // Start with exponential base
    const exponentialMs = Math.min(
      this.config.maxDelayMs,
      this.config.baseDelayMs * Math.pow(2, attempt)
    );

    // jitterFactor = share of the delay that is randomized (0..1).
    // 1.0 (default) = full jitter: uniform in [0, exponentialMs).
    // 0 = no jitter: exactly exponentialMs.
    const jitter = Math.min(1, Math.max(0, this.config.jitterFactor ?? 1.0));
    const delayMs = exponentialMs * (1 - jitter) + Math.random() * exponentialMs * jitter;

    // Never retry sooner than the provider's retry-after hint
    if (retryAfterMs) {
      return Math.round(Math.max(delayMs, retryAfterMs));
    }

    return Math.round(delayMs);
  }
}

export function calculateBackoff(
  attempt: number,
  config: BackoffConfig,
  retryAfterMs?: number
): number {
  const backoff = new ExponentialBackoff(config);
  return backoff.calculate(attempt, retryAfterMs);
}

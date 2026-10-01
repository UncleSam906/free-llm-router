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

    // Apply jitter (full jitter by default)
    const jitter = this.config.jitterFactor ?? 1.0;
    const delayMs = Math.random() * exponentialMs * jitter;

    // Use retry-after hint if provided
    if (retryAfterMs) {
      return Math.max(delayMs, retryAfterMs);
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

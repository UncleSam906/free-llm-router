import { CircuitBreaker, type BreakerConfig, type BreakerState } from './circuit-breaker';
import { RateLimiter, type RateLimitConfig } from './rate-limiter';

export interface CandidateHealth {
  breaker: CircuitBreaker;
  limiter: RateLimiter;
  cooldownUntil: number | null;
}

export interface HealthRegistryConfig {
  breaker: BreakerConfig;
  rateLimits: RateLimitConfig;
}

export class HealthRegistry {
  private health = new Map<string, CandidateHealth>();

  constructor(private config: HealthRegistryConfig) {}

  getHealth(candidateKey: string): CandidateHealth {
    if (!this.health.has(candidateKey)) {
      this.health.set(candidateKey, {
        breaker: new CircuitBreaker(this.config.breaker),
        limiter: new RateLimiter(this.config.rateLimits),
        cooldownUntil: null,
      });
    }
    return this.health.get(candidateKey)!;
  }

  isAvailable(candidateKey: string, now: number = Date.now()): boolean {
    const health = this.getHealth(candidateKey);

    // Check cooldown
    if (health.cooldownUntil && now < health.cooldownUntil) {
      return false;
    }

    // Check breaker
    if (health.breaker.getState(now) === 'open') {
      return false;
    }

    // Check rate limit
    if (!health.limiter.canConsume(now)) {
      return false;
    }

    return true;
  }

  recordSuccess(candidateKey: string, now: number = Date.now()): void {
    const health = this.getHealth(candidateKey);
    health.breaker.recordSuccess(now);
    health.cooldownUntil = null;
  }

  recordFailure(candidateKey: string, retryAfterMs?: number, now: number = Date.now()): void {
    const health = this.getHealth(candidateKey);
    health.breaker.recordFailure(now);
    if (retryAfterMs) {
      health.cooldownUntil = now + retryAfterMs;
    }
  }
}

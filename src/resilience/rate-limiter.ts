export interface RateLimitConfig {
  rpm?: number; // requests per minute
  rpd?: number; // requests per day
  tpm?: number; // tokens per minute
}

export class TokenBucket {
  private tokens: number;
  private lastRefillMs: number = Date.now();

  constructor(
    private capacity: number,
    private refillsPerMs: number
  ) {
    this.tokens = capacity;
  }

  tryConsume(amount: number = 1, now: number = Date.now()): boolean {
    this.refill(now);
    if (this.tokens >= amount) {
      this.tokens -= amount;
      return true;
    }
    return false;
  }

  private refill(now: number): void {
    const elapsedMs = now - this.lastRefillMs;
    const tokensToAdd = elapsedMs * this.refillsPerMs;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillMs = now;
  }

  getRemainingCapacity(now: number = Date.now()): number {
    this.refill(now);
    return Math.floor(this.tokens);
  }
}

export class RateLimiter {
  private rpmBucket?: TokenBucket;
  private rpdBucket?: TokenBucket;
  private rpdResetAt?: number;

  constructor(private config: RateLimitConfig) {
    // RPM: capacity 60 per minute, refill at rate/60
    if (config.rpm) {
      this.rpmBucket = new TokenBucket(config.rpm, config.rpm / (60 * 1000));
    }

    // RPD: capacity 1 per day, refill at rate per day
    if (config.rpd) {
      this.rpdBucket = new TokenBucket(config.rpd, config.rpd / (24 * 60 * 60 * 1000));
      this.rpdResetAt = Date.now() + 24 * 60 * 60 * 1000;
    }
  }

  canConsume(now: number = Date.now()): boolean {
    // Check RPM
    if (this.rpmBucket && !this.rpmBucket.tryConsume(1, now)) {
      return false;
    }

    // Check RPD (with daily reset)
    if (this.rpdBucket) {
      if (this.rpdResetAt && now >= this.rpdResetAt) {
        // Reset bucket
        this.rpdBucket = new TokenBucket(this.config.rpd!, this.config.rpd! / (24 * 60 * 60 * 1000));
        this.rpdResetAt = now + 24 * 60 * 60 * 1000;
      }
      if (!this.rpdBucket.tryConsume(1, now)) {
        return false;
      }
    }

    return true;
  }

  getRemaining(now: number = Date.now()): { rpm?: number; rpd?: number } {
    return {
      rpm: this.rpmBucket?.getRemainingCapacity(now),
      rpd: this.rpdBucket?.getRemainingCapacity(now),
    };
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import { ExponentialBackoff, calculateBackoff } from '../../src/resilience/backoff';
import { CircuitBreaker } from '../../src/resilience/circuit-breaker';
import { RateLimiter, TokenBucket } from '../../src/resilience/rate-limiter';
import { HealthRegistry } from '../../src/resilience/health-registry';

describe('Resilience Layer', () => {
  describe('ExponentialBackoff', () => {
    it('calculates increasing delays', () => {
      const backoff = new ExponentialBackoff({
        baseDelayMs: 100,
        maxDelayMs: 5000,
        jitterFactor: 0, // disable jitter for deterministic test
      });

      const delay1 = backoff.calculate(1);
      const delay2 = backoff.calculate(2);
      
      expect(delay1).toBe(200);
      expect(delay2).toBe(400);
      expect(delay1).toBeLessThan(delay2);
    });

    it('keeps full-jitter delays within [0, cap)', () => {
      const backoff = new ExponentialBackoff({ baseDelayMs: 100, maxDelayMs: 300 });
      for (let i = 0; i < 200; i++) {
        const d = backoff.calculate(5);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(300);
      }
    });

    it('respects retry-after hint', () => {
      const backoff = new ExponentialBackoff({
        baseDelayMs: 100,
        maxDelayMs: 5000,
      });

      const delay = backoff.calculate(1, 10000);
      expect(delay).toBeGreaterThanOrEqual(10000);
    });
  });

  describe('CircuitBreaker', () => {
    it('starts closed', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        windowMs: 1000,
        openDurationMs: 100,
        halfOpenProbes: 1,
      });

      expect(breaker.getState()).toBe('closed');
    });

    it('opens after failure threshold', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        windowMs: 1000,
        openDurationMs: 100,
        halfOpenProbes: 1,
      });

      breaker.recordFailure();
      expect(breaker.getState()).toBe('closed');

      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
    });

    it('transitions to half-open after duration', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        windowMs: 1000,
        openDurationMs: 100,
        halfOpenProbes: 1,
      });

      const now = Date.now();
      breaker.recordFailure(now);
      expect(breaker.getState(now)).toBe('open');

      expect(breaker.getState(now + 101)).toBe('half-open');
    });

    it('closes after successful probe', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        windowMs: 1000,
        openDurationMs: 100,
        halfOpenProbes: 1,
      });

      const now = Date.now();
      breaker.recordFailure(now);
      expect(breaker.getState(now)).toBe('open');

      // First request after openDurationMs is the probe; one success (halfOpenProbes: 1) closes it
      breaker.recordSuccess(now + 101);
      expect(breaker.getState(now + 102)).toBe('closed');
    });

    it('reopens when the half-open probe fails', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        windowMs: 1000,
        openDurationMs: 100,
        halfOpenProbes: 1,
      });

      const now = Date.now();
      breaker.recordFailure(now);
      breaker.recordFailure(now + 101);
      expect(breaker.getState(now + 102)).toBe('open');
      expect(breaker.getState(now + 202)).toBe('half-open');
    });

    it('ignores failures older than windowMs', () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        windowMs: 1000,
        openDurationMs: 100,
        halfOpenProbes: 1,
      });

      const now = Date.now();
      breaker.recordFailure(now);
      breaker.recordFailure(now + 1500);
      expect(breaker.getState(now + 1500)).toBe('closed');
    });
  });

  describe('TokenBucket', () => {
    it('starts at capacity', () => {
      const bucket = new TokenBucket(10, 0.01);
      expect(bucket.getRemainingCapacity()).toBe(10);
    });

    it('allows consumption up to capacity', () => {
      const bucket = new TokenBucket(10, 0);
      expect(bucket.tryConsume(5)).toBe(true);
      expect(bucket.tryConsume(5)).toBe(true);
      expect(bucket.tryConsume(1)).toBe(false);
    });

    it('refills over time', () => {
      const bucket = new TokenBucket(10, 1); // 1 token per ms
      const now = Date.now();

      bucket.tryConsume(10, now);
      expect(bucket.getRemainingCapacity(now + 5)).toBeGreaterThan(0);
      expect(bucket.getRemainingCapacity(now + 10)).toBe(10);
    });
  });

  describe('RateLimiter', () => {
    it('tracks RPM limit', () => {
      const limiter = new RateLimiter({ rpm: 60 });
      const now = Date.now();

      expect(limiter.canConsume(now)).toBe(true);
      expect(limiter.canConsume(now)).toBe(true);

      // After 60 consumptions, should fail
      for (let i = 2; i < 60; i++) {
        limiter.canConsume(now);
      }
      expect(limiter.canConsume(now)).toBe(false);
    });

    it('reports remaining capacity', () => {
      const limiter = new RateLimiter({ rpm: 60 });
      const now = Date.now();

      limiter.canConsume(now);
      limiter.canConsume(now);

      const remaining = limiter.getRemaining(now);
      expect(remaining.rpm).toBeLessThan(60);
    });
  });

  describe('HealthRegistry', () => {
    let registry: HealthRegistry;

    beforeEach(() => {
      registry = new HealthRegistry({
        breaker: {
          failureThreshold: 3,
          windowMs: 1000,
          openDurationMs: 100,
          halfOpenProbes: 1,
        },
        rateLimits: { rpm: 60 },
      });
    });

    it('tracks candidate health', () => {
      const candidateKey = 'groq:model-1';
      expect(registry.isAvailable(candidateKey)).toBe(true);

      registry.recordFailure(candidateKey);
      expect(registry.isAvailable(candidateKey)).toBe(true);
    });

    it('marks unavailable after threshold', () => {
      const candidateKey = 'groq:model-1';
      const now = Date.now();

      for (let i = 0; i < 3; i++) {
        registry.recordFailure(candidateKey, undefined, now);
      }

      expect(registry.isAvailable(candidateKey, now)).toBe(false);
    });

    it('respects cooldown', () => {
      const candidateKey = 'groq:model-1';
      const now = Date.now();

      registry.recordFailure(candidateKey, 5000, now);
      expect(registry.isAvailable(candidateKey, now + 2000)).toBe(false);
      expect(registry.isAvailable(candidateKey, now + 6000)).toBe(true);
    });
  });
});

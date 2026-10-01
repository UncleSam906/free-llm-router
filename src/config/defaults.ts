export const DEFAULT_CONFIG = {
  deadlineMs: 30000,
  attemptTimeoutMs: 10000,
  maxRetries: 3,
  
  // Backoff configuration
  backoff: {
    baseDelayMs: 100,
    maxDelayMs: 5000,
    jitterFactor: 1.0, // full jitter
  },
  
  // Circuit breaker thresholds
  breaker: {
    failureThreshold: 5, // failures before opening
    windowMs: 60000, // 1 minute window
    openDurationMs: 30000, // 30 second open duration
    halfOpenProbes: 1, // probes before attempting close
  },
  
  // Rate limiter (conservative defaults)
  rateLimiter: {
    rpgBuffer: 0.8, // leave 20% buffer
    rpdBuffer: 0.8,
  },
} as const;

export const RETRY_STRATEGIES = {
  FULL_JITTER: 'full-jitter',
  EQUAL_JITTER: 'equal-jitter',
  EXPONENTIAL: 'exponential',
} as const;

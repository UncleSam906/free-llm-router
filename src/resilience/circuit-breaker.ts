export type BreakerState = 'closed' | 'open' | 'half-open';

export interface BreakerConfig {
  failureThreshold: number; // failures before opening
  windowMs: number; // rolling window
  openDurationMs: number; // how long to stay open
  halfOpenProbes: number; // probes before close
}

export class CircuitBreaker {
  private state: BreakerState = 'closed';
  private failureCount = 0;
  private failureTimestamps: number[] = [];
  private openedAt: number | null = null;
  private halfOpenProbes = 0;

  constructor(private config: BreakerConfig) {}

  getState(now: number = Date.now()): BreakerState {
    // Closed: normal operation
    if (this.state === 'closed') {
      this.pruneOldFailures(now);
      return 'closed';
    }

    // Open: wait for duration
    if (this.state === 'open') {
      if (this.openedAt && now - this.openedAt >= this.config.openDurationMs) {
        this.state = 'half-open';
        this.halfOpenProbes = 0;
        return 'half-open';
      }
      return 'open';
    }

    // Half-open: testing recovery
    return 'half-open';
  }

  recordSuccess(now: number = Date.now()): void {
    if (this.state === 'half-open') {
      this.halfOpenProbes++;
      if (this.halfOpenProbes >= this.config.halfOpenProbes) {
        this.state = 'closed';
        this.failureCount = 0;
        this.failureTimestamps = [];
      }
    } else if (this.state === 'closed') {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  recordFailure(now: number = Date.now()): void {
    if (this.state === 'half-open') {
      this.state = 'open';
      this.openedAt = now;
      return;
    }

    this.failureTimestamps.push(now);
    this.failureCount++;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.openedAt = now;
    }
  }

  private pruneOldFailures(now: number): void {
    this.failureTimestamps = this.failureTimestamps.filter(
      (ts) => now - ts < this.config.windowMs
    );
    this.failureCount = this.failureTimestamps.length;
  }
}

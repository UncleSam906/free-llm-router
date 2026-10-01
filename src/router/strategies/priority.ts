import type { Candidate } from '../../types/provider';

export class PriorityStrategy {
  order(candidates: readonly Candidate[]): Candidate[] {
    // Priority strategy: return in the order given
    return Array.from(candidates);
  }
}

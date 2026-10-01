import { z } from 'zod';

export const RouterConfigSchema = z.object({
  deadlineMs: z.number().int().positive().default(30000),
  attemptTimeoutMs: z.number().int().positive().default(10000),
  maxRetriesPerCandidate: z.number().int().nonnegative().default(3),
  
  breakerFailureThreshold: z.number().int().positive().default(5),
  breakerWindowMs: z.number().int().positive().default(60000),
  breakerOpenMs: z.number().int().positive().default(30000),
  
  embeddings: z.object({
    failover: z.enum(['same-model-only', 'same-dimensions', 'any']).default('same-model-only'),
  }).default({}),
  
  allowNonCommercial: z.boolean().default(false),
  logPayloads: z.boolean().default(false),
});

export type RouterConfig = z.infer<typeof RouterConfigSchema>;

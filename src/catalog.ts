import type { ProviderModel } from './types/provider';

/*
 * Model catalog — verified 2026-10-01 against official provider pages:
 *   Groq      https://console.groq.com/docs/rate-limits  (free plan: 30 RPM, 1K RPD, 8K TPM, 200K TPD)
 *             https://console.groq.com/docs/deprecations (mixtral-8x7b-32768 shut down 2025-03-20)
 *   Gemini    https://ai.google.dev/gemini-api/docs/pricing   ("Free of charge" free tier)
 *             https://ai.google.dev/gemini-api/docs/rate-limits (no per-model numbers published)
 *   Mistral   https://docs.mistral.ai/resources/changelogs (Mistral Small 4 = mistral-small-2603, 256k)
 *             numeric free-tier limits are no longer published (see Admin -> Limits)
 *   OpenRouter https://openrouter.ai/docs/api/reference/limits (:free = 20 RPM; 50 RPD, 1000 RPD after 10 credits)
 *             model IDs/context from https://openrouter.ai/api/v1/models on 2026-10-01
 * Removed 2026-10-01: Together AI (no free tier, $5 minimum prepaid — docs.together.ai/docs/billing),
 *   Replicate (pay per use — replicate.com/pricing), Groq mixtral-8x7b-32768 and Gemini gemini-pro (not on Google's current model list).
 * Ollama entries are local models served by your own Ollama (OLLAMA_BASE_URL); their limits are self-imposed.
 *
 * `limits` and `commercialUseAllowed` are informational only (routing does not read them).
 * An empty `limits` means the provider does not publish a number. `commercialUseAllowed`
 * is false unless the provider's terms were checked for that use.
 * RateWatch's weekly automation flags changes to these sources.
 */

const defaultCapabilities = {
  chat: true,
  embeddings: false,
  tools: false,
  jsonMode: false,
  vision: false,
  streaming: false,
  contextTokens: 4096,
};

export const MODEL_CATALOG: ProviderModel[] = [
  // ========== GROQ (free plan, no card) ==========
  {
    provider: 'groq',
    modelId: 'openai/gpt-oss-120b',
    capabilities: { ...defaultCapabilities, contextTokens: 131072 },
    limits: { rpm: 30, rpd: 1000, tpm: 8000 },
    commercialUseAllowed: false,
  },
  {
    provider: 'groq',
    modelId: 'openai/gpt-oss-20b',
    capabilities: { ...defaultCapabilities, contextTokens: 131072 },
    limits: { rpm: 30, rpd: 1000, tpm: 8000 },
    commercialUseAllowed: false,
  },

  // ========== GOOGLE GEMINI (free tier; limits shown per project in AI Studio) ==========
  {
    provider: 'gemini',
    modelId: 'gemini-3.8-flash',
    capabilities: { ...defaultCapabilities, contextTokens: 1048576 },
    limits: {},
    commercialUseAllowed: false,
  },
  {
    provider: 'gemini',
    modelId: 'gemini-3.5-flash-lite',
    capabilities: { ...defaultCapabilities, contextTokens: 1048576 },
    limits: {},
    commercialUseAllowed: false,
  },

  // ========== MISTRAL (free mode; limits in Admin -> Limits) ==========
  {
    provider: 'mistral',
    modelId: 'mistral-small-2603',
    capabilities: { ...defaultCapabilities, tools: true, contextTokens: 256000 },
    limits: {},
    commercialUseAllowed: false,
  },

  // ========== OPENROUTER (:free variants) ==========
  {
    provider: 'openrouter',
    modelId: 'nvidia/nemotron-3-super-120b-a12b:free',
    capabilities: { ...defaultCapabilities, tools: true, contextTokens: 262144 },
    limits: { rpm: 20, rpd: 50 },
    commercialUseAllowed: false,
  },
  {
    provider: 'openrouter',
    modelId: 'qwen/qwen3.8-27b:free',
    capabilities: { ...defaultCapabilities, tools: true, contextTokens: 262144 },
    limits: { rpm: 20, rpd: 50 },
    commercialUseAllowed: false,
  },
  {
    provider: 'openrouter',
    modelId: 'google/gemma-4-31b-it:free',
    capabilities: { ...defaultCapabilities, tools: true, contextTokens: 262144 },
    limits: { rpm: 20, rpd: 50 },
    commercialUseAllowed: false,
  },

  // ========== OLLAMA (local, self-hosted) ==========
  {
    provider: 'ollama',
    modelId: 'llama2',
    capabilities: defaultCapabilities,
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'ollama',
    modelId: 'qwen:7b',
    capabilities: defaultCapabilities,
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'ollama',
    modelId: 'mistral:latest',
    capabilities: { ...defaultCapabilities, contextTokens: 8192 },
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'ollama',
    modelId: 'gemma:7b',
    capabilities: defaultCapabilities,
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'ollama',
    modelId: 'gemma2:27b',
    capabilities: { ...defaultCapabilities, contextTokens: 8192 },
    limits: { rpm: 30 },
    commercialUseAllowed: true,
  },
  {
    provider: 'ollama',
    modelId: 'phi:latest',
    capabilities: { ...defaultCapabilities, contextTokens: 2048 },
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
];

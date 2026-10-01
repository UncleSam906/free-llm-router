import type { ProviderModel } from './types/provider';

const defaultCapabilities = {
  chat: true,
  embeddings: false,
  tools: false,
  jsonMode: false,
  vision: false,
  streaming: false,
  contextTokens: 4096,
};

const extendedCapabilities = {
  ...defaultCapabilities,
  contextTokens: 131072,
  jsonMode: true,
};

export const MODEL_CATALOG: ProviderModel[] = [
  // ========== LLAMA 3.1 / 3.3 ==========
  {
    provider: 'ollama',
    modelId: 'llama2',
    capabilities: defaultCapabilities,
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'together',
    modelId: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
    capabilities: { ...extendedCapabilities, vision: true },
    limits: { tpm: 1000000 },
    commercialUseAllowed: true,
  },
  {
    provider: 'replicate',
    modelId: 'meta/llama-2-70b-chat',
    capabilities: defaultCapabilities,
    limits: { rpm: 20 },
    commercialUseAllowed: true,
  },

  // ========== QWEN 2.5 / 3 ==========
  {
    provider: 'ollama',
    modelId: 'qwen:7b',
    capabilities: defaultCapabilities,
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'together',
    modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
    capabilities: { ...defaultCapabilities, jsonMode: true },
    limits: { tpm: 1000000 },
    commercialUseAllowed: true,
  },

  // ========== DEEPSEEK V3 / R1 ==========
  {
    provider: 'together',
    modelId: 'deepseek-ai/DeepSeek-V3',
    capabilities: { ...extendedCapabilities, tools: true },
    limits: { tpm: 1000000 },
    commercialUseAllowed: true,
  },
  {
    provider: 'together',
    modelId: 'deepseek-ai/DeepSeek-R1',
    capabilities: { ...extendedCapabilities, tools: true },
    limits: { tpm: 500000 },
    commercialUseAllowed: true,
  },

  // ========== MISTRAL SMALL / NEMO / MIXTRAL ==========
  {
    provider: 'ollama',
    modelId: 'mistral:latest',
    capabilities: { ...defaultCapabilities, contextTokens: 8192 },
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'mistral',
    modelId: 'mistral-small-latest',
    capabilities: { ...defaultCapabilities, tools: true },
    limits: { tpm: 3000000 },
    commercialUseAllowed: true,
  },
  {
    provider: 'together',
    modelId: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    capabilities: { ...extendedCapabilities, tools: true },
    limits: { tpm: 1000000 },
    commercialUseAllowed: true,
  },

  // ========== GEMMA 2 / 3 ==========
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

  // ========== PHI-3 / PHI-4 ==========
  {
    provider: 'ollama',
    modelId: 'phi:latest',
    capabilities: { ...defaultCapabilities, contextTokens: 2048 },
    limits: { rpm: 60 },
    commercialUseAllowed: true,
  },
  {
    provider: 'together',
    modelId: 'microsoft/Phi-3-medium-4k-instruct',
    capabilities: { ...defaultCapabilities, contextTokens: 4096 },
    limits: { tpm: 2000000 },
    commercialUseAllowed: true,
  },

  // ========== EXISTING PROVIDERS ==========
  {
    provider: 'groq',
    modelId: 'mixtral-8x7b-32768',
    capabilities: { ...defaultCapabilities, contextTokens: 32768 },
    limits: { rpm: 30, tpm: 50000 },
    commercialUseAllowed: true,
  },
  {
    provider: 'gemini',
    modelId: 'gemini-pro',
    capabilities: { ...defaultCapabilities, contextTokens: 32768, vision: true },
    limits: { rpm: 100 },
    commercialUseAllowed: true,
  },
];

import type { ProviderAdapter, ProviderId } from '../types/provider';
import { GroqProvider } from './groq';
import { MistralProvider } from './mistral';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import { TogetherAIProvider } from './together-ai';
import { HuggingFaceProvider } from './huggingface';
import { ReplicateProvider } from './replicate';
import { OpenRouterProvider } from './openrouter';

export interface ProviderRegistry {
  get(id: ProviderId): ProviderAdapter | null;
}

export class DefaultProviderRegistry implements ProviderRegistry {
  private adapters: Map<ProviderId, ProviderAdapter> = new Map();

  constructor(apiKeys: Partial<Record<ProviderId, string>>) {
    // Register configured providers
    if (apiKeys.groq) {
      this.adapters.set('groq', new GroqProvider(apiKeys.groq));
    }
    if (apiKeys.mistral) {
      this.adapters.set('mistral', new MistralProvider(apiKeys.mistral));
    }
    if (apiKeys.gemini) {
      this.adapters.set('gemini', new GeminiProvider({ apiKey: apiKeys.gemini }));
    }
    if (apiKeys.ollama) {
      this.adapters.set('ollama', new OllamaProvider(apiKeys.ollama));
    }
    if (apiKeys.together) {
      this.adapters.set('together', new TogetherAIProvider(apiKeys.together));
    }
    if (apiKeys.huggingface) {
      this.adapters.set('huggingface', new HuggingFaceProvider(apiKeys.huggingface));
    }
    if (apiKeys.replicate) {
      this.adapters.set('replicate', new ReplicateProvider(apiKeys.replicate));
    }
    if (apiKeys.openrouter) {
      this.adapters.set('openrouter', new OpenRouterProvider(apiKeys.openrouter));
    }
  }

  get(id: ProviderId): ProviderAdapter | null {
    return this.adapters.get(id) ?? null;
  }

  register(provider: ProviderAdapter): void {
    this.adapters.set(provider.id, provider);
  }
}

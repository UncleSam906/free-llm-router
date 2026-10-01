import { OpenAICompatibleAdapter } from './base/openai-compatible';
import { parseChatCompletion } from '../types/openai';
import type { ChatCompletionRequest, ChatCompletion } from '../types/openai';
import type { ProviderModel, ProviderId } from '../types/provider';

export class GroqProvider extends OpenAICompatibleAdapter {
  readonly id: ProviderId = 'groq';

  constructor(apiKey: string) {
    super({
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey,
    });
  }

  transformRequest(req: ChatCompletionRequest, model: ProviderModel): Record<string, unknown> {
    // Groq uses model IDs like "openai/gpt-oss-120b"
    return {
      model: model.modelId,
      messages: req.messages,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
      stop: req.stop,
      presence_penalty: req.presence_penalty,
      frequency_penalty: req.frequency_penalty,
      // Groq doesn't support tools/vision in free tier
      user: req.user,
    };
  }

  transformResponse(res: unknown): ChatCompletion {
    // Groq returns standard OpenAI format
    return parseChatCompletion(res);
  }
}

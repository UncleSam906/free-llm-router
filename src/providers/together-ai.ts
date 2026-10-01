import { OpenAICompatibleAdapter } from './base/openai-compatible';
import { parseChatCompletion } from '../types/openai';
import type { ChatCompletionRequest, ChatCompletion } from '../types/openai';
import type { ProviderModel, ProviderId } from '../types/provider';

export class TogetherAIProvider extends OpenAICompatibleAdapter {
  readonly id: ProviderId = 'together';

  constructor(apiKey: string) {
    super({
      baseUrl: 'https://api.together.xyz/v1',
      apiKey,
    });
  }

  transformRequest(req: ChatCompletionRequest, model: ProviderModel): Record<string, unknown> {
    return {
      model: model.modelId,
      messages: req.messages,
      temperature: req.temperature,
      top_p: req.top_p,
      top_k: 50,
      max_tokens: req.max_tokens,
      stop: req.stop,
      frequency_penalty: req.frequency_penalty,
      presence_penalty: req.presence_penalty,
      user: req.user,
    };
  }

  transformResponse(res: unknown): ChatCompletion {
    return parseChatCompletion(res);
  }
}

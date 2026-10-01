import { OpenAICompatibleAdapter } from './base/openai-compatible';
import { parseChatCompletion } from '../types/openai';
import type { ChatCompletionRequest, ChatCompletion } from '../types/openai';
import type { ProviderModel, ProviderId } from '../types/provider';

export class MistralProvider extends OpenAICompatibleAdapter {
  readonly id: ProviderId = 'mistral';

  constructor(apiKey: string) {
    super({
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey,
    });
  }

  transformRequest(req: ChatCompletionRequest, model: ProviderModel): Record<string, unknown> {
    // Mistral accepts standard OpenAI format but with some nuances
    // Tool call IDs must be 9 characters - handled later in middleware
    return {
      model: model.modelId,
      messages: req.messages,
      temperature: req.temperature,
      top_p: req.top_p,
      max_tokens: req.max_tokens,
      stop: req.stop,
      presence_penalty: req.presence_penalty,
      frequency_penalty: req.frequency_penalty,
      tools: req.tools,
      tool_choice: req.tool_choice,
      user: req.user,
    };
  }

  transformResponse(res: unknown): ChatCompletion {
    // Mistral returns standard OpenAI format
    return parseChatCompletion(res);
  }
}

import { OpenAICompatibleAdapter } from './base/openai-compatible';
import { parseChatCompletion } from '../types/openai';
import type { ChatCompletionRequest, ChatCompletion } from '../types/openai';
import type { ProviderModel, ProviderId } from '../types/provider';

export class OllamaProvider extends OpenAICompatibleAdapter {
  readonly id: ProviderId = 'ollama';

  constructor(baseUrl: string = 'http://localhost:11434') {
    super({
      baseUrl: `${baseUrl}/v1`,
      apiKey: 'ollama', // Ollama doesn't require auth
    });
  }

  transformRequest(req: ChatCompletionRequest, model: ProviderModel): Record<string, unknown> {
    return {
      model: model.modelId,
      messages: req.messages,
      temperature: req.temperature,
      top_p: req.top_p,
      top_k: 40,
      num_predict: req.max_tokens || -1,
      stop: req.stop,
      num_thread: 8,
      user: req.user,
    };
  }

  transformResponse(res: unknown): ChatCompletion {
    return parseChatCompletion(res);
  }
}

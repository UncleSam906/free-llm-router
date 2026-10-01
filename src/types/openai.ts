export interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  tools?: ChatCompletionTool[];
  tool_choice?: 'auto' | 'none' | ChatCompletionToolChoiceObject;
  response_format?: ChatCompletionResponseFormat;
}

export type ChatCompletionMessageParam =
  | ChatCompletionSystemMessageParam
  | ChatCompletionUserMessageParam
  | ChatCompletionAssistantMessageParam
  | ChatCompletionToolMessageParam;

export interface ChatCompletionSystemMessageParam {
  readonly role: 'system';
  readonly content: string;
}

export interface ChatCompletionUserMessageParam {
  readonly role: 'user';
  readonly content: string | ContentBlockParam[];
}

export interface ChatCompletionAssistantMessageParam {
  readonly role: 'assistant';
  readonly content: string | ContentBlockParam[];
  readonly tool_calls?: ToolCall[];
}

export interface ChatCompletionToolMessageParam {
  readonly role: 'tool';
  readonly content: string;
  readonly tool_call_id: string;
}

export type ContentBlockParam = TextBlockParam | ImageBlockParam;

export interface TextBlockParam {
  readonly type: 'text';
  readonly text: string;
}

export interface ImageBlockParam {
  readonly type: 'image';
  readonly source: ImageSource;
}

export type ImageSource = { type: 'base64'; media_type: string; data: string } | { type: 'url'; url: string };

export interface ChatCompletionTool {
  readonly type: 'function';
  readonly function: ChatCompletionFunctionParameters;
}

export interface ChatCompletionFunctionParameters {
  readonly name: string;
  readonly description?: string;
  readonly parameters: Record<string, unknown>;
}

export type ChatCompletionToolChoiceObject = { type: 'function'; function: { name: string } };

export type ChatCompletionResponseFormat = { type: 'text' } | { type: 'json_object' };

export interface ToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: { readonly name: string; readonly arguments: string };
}

export interface ChatCompletion {
  readonly id: string;
  readonly object: 'chat.completion';
  readonly created: number;
  readonly model: string;
  readonly choices: ChatCompletionChoice[];
  readonly usage: CompletionUsage;
}

export interface ChatCompletionChoice {
  readonly index: number;
  readonly message: ChatCompletionMessage;
  readonly finish_reason: string | null;
}

export interface ChatCompletionMessage {
  readonly role: 'assistant';
  readonly content: string | null;
  readonly tool_calls?: ToolCall[];
}

export interface CompletionUsage {
  readonly prompt_tokens: number;
  readonly completion_tokens: number;
  readonly total_tokens: number;
}

export interface ChatCompletionChunk {
  readonly id: string;
  readonly object: 'chat.completion.chunk';
  readonly created: number;
  readonly model: string;
  readonly choices: ChatCompletionChunkChoice[];
}

export interface ChatCompletionChunkChoice {
  readonly index: number;
  readonly delta: ChatCompletionDelta;
  readonly finish_reason: string | null;
}

export interface ChatCompletionDelta {
  readonly role?: string;
  readonly content?: string;
  readonly tool_calls?: ToolCall[];
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
}

export interface EmbeddingResponse {
  readonly object: 'list';
  readonly data: Embedding[];
  readonly model: string;
  readonly usage: EmbeddingUsage;
}

export interface Embedding {
  readonly object: 'embedding';
  readonly index: number;
  readonly embedding: number[];
}

export interface EmbeddingUsage {
  readonly prompt_tokens: number;
  readonly total_tokens: number;
}

/**
 * Runtime guard for provider JSON payloads. Checks the structural essentials
 * (object with a `choices` array) rather than trusting an unchecked cast.
 */
export function isChatCompletion(value: unknown): value is ChatCompletion {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { choices?: unknown };
  return Array.isArray(candidate.choices);
}

export function parseChatCompletion(value: unknown): ChatCompletion {
  if (!isChatCompletion(value)) {
    throw new Error('Provider returned a malformed chat completion');
  }
  return value;
}

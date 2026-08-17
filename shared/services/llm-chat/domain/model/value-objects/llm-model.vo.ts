import { LlmProvider } from '../types/llm-provider.enum';

export interface ILlmModelVisionLimits {
  max_prompt_image_size?: number;
  max_prompt_images?: number;
  supported_media_types?: string[];
}

export interface ILlmModelLimits {
  max_context_window_tokens?: number;
  max_non_streaming_output_tokens?: number;
  max_output_tokens?: number;
  max_prompt_tokens?: number;
  vision?: ILlmModelVisionLimits;
}

export interface ILlmModelSupports {
  adaptive_thinking?: string;
  max_thinking_budget?: number;
  min_thinking_budget?: number;
  parallel_tool_calls?: boolean;
  reasoning_effort?: string[];
  streaming?: boolean;
  structured_outputs?: boolean;
  tool_calls?: boolean;
  vision?: boolean;
  reasoningEffort?: boolean;
}

export interface ILlmModelCapabilities {
  family?: string;
  limits?: ILlmModelLimits;
  object?: string;
  supports?: ILlmModelSupports;
  tokenizer?: string;
  type?: string;
}

export interface ILlmModelPolicy {
  state?: string;
  terms?: string;
}

export interface ILlmLongContextTokenPriceConfig {
  inputPrice?: number;
  outputPrice?: number;
  cachePrice?: number;
  cacheReadPrice?: number;
  cacheWritePrice?: number;
  contextMax?: number;
  maxPromptTokens?: number;
}

export interface ILlmTokenPrices {
  inputPrice?: number;
  outputPrice?: number;
  cachePrice?: number;
  cacheReadPrice?: number;
  cacheWritePrice?: number;
  batchSize?: number;
  contextMax?: number;
  maxPromptTokens?: number;
  longContext?: ILlmLongContextTokenPriceConfig;
}

export interface ILlmModelPromo {
  id?: string;
  discountPercent?: number;
  endsAt?: string;
  message?: string;
}

export interface ILlmModelBilling {
  discountPercent?: number;
  tokenPrices?: ILlmTokenPrices;
  promo?: ILlmModelPromo;
}

export interface ILlmModelInfo {
  id: string;
  name: string;
  provider: LlmProvider;
  contextWindow?: number;
  description?: string;
  capabilities?: ILlmModelCapabilities;
  policy?: ILlmModelPolicy;
  billing?: ILlmModelBilling;
  supportedReasoningEfforts?: string[];
  modelPickerCategory?: string;
  modelPickerPriceCategory?: string;
}

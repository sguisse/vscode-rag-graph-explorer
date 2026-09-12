import { LlmProvider } from '../../types/llm-provider.enum';

export interface LlmModelVisionLimits {
  max_prompt_image_size?: number;
  max_prompt_images?: number;
  supported_media_types?: string[];
}

export interface LlmModelLimits {
  max_context_window_tokens?: number;
  max_non_streaming_output_tokens?: number;
  max_output_tokens?: number;
  max_prompt_tokens?: number;
  vision?: LlmModelVisionLimits;
}

export interface LlmModelSupports {
  adaptive_thinking?: boolean | string;
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

export interface LlmModelCapabilities {
  family?: string;
  limits?: LlmModelLimits;
  object?: string;
  supports?: LlmModelSupports;
  tokenizer?: string;
  type?: string;
}

export interface LlmModelPolicy {
  state?: string;
  terms?: string;
}

export interface LlmTokenPriceConfig {
  input_price?: number;
  output_price?: number;
  cache_price?: number;
  cache_read_price?: number;
  cache_write_price?: number;
  cache_write_1h_price?: number;
  context_max?: number;
  max_prompt_tokens?: number;
}

export interface LlmLongContextTokenPriceConfig extends LlmTokenPriceConfig {}

export interface LlmTokenPrices extends LlmTokenPriceConfig {
  batch_size?: number;
  long_context?: LlmLongContextTokenPriceConfig;
}

export interface LlmModelPromo {
  id?: string;
  discount_percent?: number;
  ends_at?: string;
  message?: string;
}

export interface LlmModelBilling {
  discount_percent?: number;
  token_prices?: LlmTokenPrices;
  promo?: LlmModelPromo;
}

export interface LlmModelInfo {
  id: string;
  name: string;
  provider: LlmProvider;
  object?: string;
  vendor?: string;
  version?: string;
  preview?: boolean;
  model_picker_category?: string;
  model_picker_enabled?: boolean;
  supported_endpoints?: string[];
  context_window?: number;
  description?: string;
  capabilities?: LlmModelCapabilities;
  policy?: LlmModelPolicy;
  billing?: LlmModelBilling;
  supported_reasoning_efforts?: string[];
  model_picker_price_category?: string;
  subRows?: LlmModelInfo[];
}

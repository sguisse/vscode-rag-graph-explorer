import { LlmProvider } from '../types/llm-provider.enum';

export interface ILlmConfigProps {
  provider: LlmProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  extraParams?: Record<string, unknown>;
}

export class LlmConfigVO {
  readonly provider: LlmProvider;
  readonly model: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly timeoutMs: number;
  readonly extraParams: Record<string, unknown>;

  constructor(props: ILlmConfigProps) {
    this.provider = props.provider;
    this.model = props.model || this.getDefaultModel(props.provider);
    this.temperature = props.temperature ?? 0.7;
    this.maxTokens = props.maxTokens ?? 4096;
    this.baseUrl = props.baseUrl || this.getDefaultBaseUrl(props.provider);
    this.apiKey = props.apiKey;
    this.timeoutMs = props.timeoutMs ?? 300000;
    this.extraParams = props.extraParams ?? {};

    this.validate();
  }

  private validate(): void {
    if (!this.provider) {
      throw new Error('LLM Provider is required');
    }
    if (this.temperature < 0 || this.temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    if (this.maxTokens <= 0) {
      throw new Error('Max tokens must be greater than 0');
    }
  }

  private getDefaultModel(provider: LlmProvider): string {
    switch (provider) {
      case LlmProvider.OLLAMA:
        return 'deepseek-coder:6.7b';
      case LlmProvider.GEMINI:
        return 'gemini-1.5-pro';
      case LlmProvider.COPILOT:
        return 'mai-code-1-flash-picker';
      default:
        return 'mai-code-1-flash-picker';
    }
  }

  private getDefaultBaseUrl(provider: LlmProvider): string | undefined {
    switch (provider) {
      case LlmProvider.OLLAMA:
        return 'http://localhost:11434';
      case LlmProvider.GEMINI:
        return 'https://generativelanguage.googleapis.com';
      default:
        return undefined;
    }
  }
}

import { LlmProvider } from '../../../../../shared/services/llm-chat';
import { ILlmProviderDelegate } from '../delegate/llm-provider.delegate.interface';
import { OllamaDelegate } from '../delegate/ollama.delegate';
import { GeminiDelegate } from '../delegate/gemini.delegate';
import { CopilotDelegate } from '../delegate/copilot.delegate';

export class LlmDelegateFactory {
  private static delegates: Map<LlmProvider, ILlmProviderDelegate> = new Map();

  public static getDelegate(provider: LlmProvider): ILlmProviderDelegate {
    if (!this.delegates.has(provider)) {
      switch (provider) {
        case LlmProvider.OLLAMA:
          this.delegates.set(provider, new OllamaDelegate());
          break;
        case LlmProvider.GEMINI:
          this.delegates.set(provider, new GeminiDelegate());
          break;
        case LlmProvider.COPILOT:
          this.delegates.set(provider, new CopilotDelegate());
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }
    }
    return this.delegates.get(provider)!;
  }
}

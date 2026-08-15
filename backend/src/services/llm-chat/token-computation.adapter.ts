import { IChatMessageDto } from '../../../../shared/services/llm-chat';
import { log } from '../../utils/utils-log';

const ORIGIN = 'TokenComputationAdapter';

export class TokenComputationAdapter {
  /**
   * Estimates token count for a text string using standard word/character ratio heuristics.
   */
  public static countTokens(text: string): number {
    if (!text) return 0;
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0;

    const words = trimmed.split(/\s+/).length;
    const chars = trimmed.length;
    const estimatedTokens = Math.ceil((words * 1.3 + chars / 4) / 2);
    return Math.max(1, estimatedTokens);
  }

  /**
   * Estimates total prompt tokens across message history and system prompt.
   */
  public static countPromptTokens(messages: IChatMessageDto[], systemPrompt?: string): number {
    let total = 0;
    if (systemPrompt) {
      total += this.countTokens(systemPrompt) + 4;
    }
    for (const msg of messages) {
      total += this.countTokens(msg.content) + 4;
    }
    log(ORIGIN, 'Computed input prompt tokens', { messageCount: messages.length, totalPromptTokens: total });
    return total;
  }

  /**
   * Formats execution time in milliseconds into 'minutes:seconds' format (e.g., '0m:12s' or '01m:05s').
   */
  public static formatExecutionTime(timeMs: number): string {
    if (!timeMs || timeMs < 0) return '0m:00s';
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedSeconds = seconds.toString().padStart(2, '0');
    return `${minutes}m:${formattedSeconds}s`;
  }
}

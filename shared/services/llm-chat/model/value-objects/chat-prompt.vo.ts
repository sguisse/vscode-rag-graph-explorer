import { ChatMessage } from '../../types/chat-message.type';

export class ChatPromptVO {
  readonly messages: readonly ChatMessage[];
  readonly systemPrompt?: string;

  constructor(messages: ChatMessage[], systemPrompt?: string) {
    if (!messages || messages.length === 0) {
      throw new Error('ChatPromptVO requires at least one message');
    }
    this.messages = Object.freeze([...messages]);
    this.systemPrompt = systemPrompt;
  }

  public getFormattedHistory(): ChatMessage[] {
    if (!this.systemPrompt) {
      return [...this.messages];
    }
    const hasSystem = this.messages.some((m) => m.role === 'system');
    if (hasSystem) {
      return [...this.messages];
    }
    const systemMsg: ChatMessage = {
      id: 'system-prompt',
      role: 'system',
      content: this.systemPrompt,
      timestamp: Date.now(),
    };
    return [systemMsg, ...this.messages];
  }

  public getLastUserMessage(): ChatMessage | undefined {
    return [...this.messages].reverse().find((m) => m.role === 'user');
  }
}

import { ChatMessage } from '../../types/chat-message.type';
import { LlmConfigVO } from '../value-objects/llm-config.vo';

export class ChatSessionEntity {
  readonly id: string;
  private _messages: ChatMessage[];
  private _config: LlmConfigVO;
  private _createdAt: number;
  private _updatedAt: number;

  constructor(id: string, config: LlmConfigVO, initialMessages: ChatMessage[] = []) {
    this.id = id;
    this._config = config;
    this._messages = [...initialMessages];
    this._createdAt = Date.now();
    this._updatedAt = Date.now();
  }

  public get messages(): readonly ChatMessage[] {
    return Object.freeze([...this._messages]);
  }

  public get config(): LlmConfigVO {
    return this._config;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  public addMessage(message: ChatMessage): void {
    this._messages.push(message);
    this._updatedAt = Date.now();
  }

  public updateConfig(newConfig: LlmConfigVO): void {
    this._config = newConfig;
    this._updatedAt = Date.now();
  }

  public clearHistory(): void {
    this._messages = [];
    this._updatedAt = Date.now();
  }
}

import { IChatMessage } from '../types/chat-message.type';
import { IChatMessageDto } from '../model/dto/chat-request.dto';

export class ChatMessageMapper {
  public static toDomain(dto: IChatMessageDto): IChatMessage {
    return {
      id: dto.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: dto.role,
      content: dto.content,
      timestamp: dto.timestamp || Date.now(),
      provider: dto.provider,
      model: dto.model,
      fileCount: dto.fileCount,
      promptTokens: dto.promptTokens,
      completionTokens: dto.completionTokens,
      totalTokens: dto.totalTokens,
      executionTimeMs: dto.executionTimeMs,
    };
  }

  public static toDto(entity: IChatMessage): IChatMessageDto {
    return {
      id: entity.id,
      role: entity.role,
      content: entity.content,
      timestamp: entity.timestamp,
      provider: entity.provider,
      model: entity.model,
      fileCount: entity.fileCount,
      promptTokens: entity.promptTokens,
      completionTokens: entity.completionTokens,
      totalTokens: entity.totalTokens,
      executionTimeMs: entity.executionTimeMs,
    };
  }

  public static toDomainList(dtos: IChatMessageDto[]): IChatMessage[] {
    return dtos.map((d) => this.toDomain(d));
  }

  public static toDtoList(entities: IChatMessage[]): IChatMessageDto[] {
    return entities.map((e) => this.toDto(e));
  }
}

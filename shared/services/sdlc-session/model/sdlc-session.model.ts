import { IChatMessageDto, LlmProvider } from '../../llm-chat';

export type SdlcSessionStatus = 'draft' | 'running' | 'error' | 'success';

export interface CodebaseContextPointers {
    selectedEntityId: string | null;
    impactedNodeIds: string[];
    callersDepth: number;
    calleesDepth: number;
}

export interface InstructionsPayload {
  selectedAgent?: string;
    strategy: 'vibe' | 'vibe-coding' | 'bmad' | 'speckit' | 'gsd';
    promptText: string;
}

export interface LlmChatPayload {
    provider: LlmProvider;
    selectedModel: string;
    temperature: number;
    messages: IChatMessageDto[];
}

export interface SdlcSession {
    sessionId: string;
    createdAt: number;
    updatedAt: number;
    status: SdlcSessionStatus;
    errorMessage?: string;
    activeStepId: string;
    contextPointers: CodebaseContextPointers;
    instructionsPayload: InstructionsPayload;
    llmChat: LlmChatPayload;
}

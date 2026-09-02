import { IChatMessageDto, LlmProvider } from '../../llm-chat';
import { ReferenceItem } from '../../reference/model/reference-model';

export type SdlcSessionStatus = 'draft' | 'running' | 'error' | 'success';

export interface CodebaseContextPointers {
    selectedEntityId: string | null;
    impactedNodeIds: string[];
    callersDepth: number;
    calleesDepth: number;
    /** Selected codebase file context paths */
    selectedFiles?: string[];
}

export interface InstructionsPayload {
    selectedAgent?: string;
    strategy: 'vibe' | 'vibe-coding' | 'bmad' | 'speckit' | 'gsd';
    promptText: string;
    /** Selected reference items from instructions */
    selectedReferences?: ReferenceItem[];
}

export interface LlmChatPayload {
    provider: LlmProvider;
    selectedModel: string;
    temperature: number;
    messages: IChatMessageDto[];
    /** Refined prompt text edited inside the LLM chat panel */
    customPrompt?: string;
    /** Adjusted reference items selected for the LLM request (undefined inherits from Instructions) */
    selectedReferences?: ReferenceItem[];
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

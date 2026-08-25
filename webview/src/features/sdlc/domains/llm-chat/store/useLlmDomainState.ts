import { create } from 'zustand';
import { useSdlcSessionStore } from '../../../core/store/useSdlcSessionStore';
import { LlmProvider, IChatMessageDto, IFileContextDto } from '@/shared/services/llm-chat';

export interface LlmDomainState {
    llmProvider: LlmProvider;
    setLlmProvider: (provider: LlmProvider) => void;
    llmSelectedModel: string;
    setLlmSelectedModel: (model: string) => void;
    llmMessages: IChatMessageDto[];
    setLmMessages: (messages: IChatMessageDto[] | ((prev: IChatMessageDto[]) => IChatMessageDto[])) => void;
    llmTemperature: number;
    setLlmTemperature: (temp: number) => void;

    // Ephemeral UI State
    llmInputPrompt: string;
    setLlmInputPrompt: (prompt: string) => void;
    llmAttachedFiles: IFileContextDto[];
    setLlmAttachedFiles: (files: IFileContextDto[] | ((prev: IFileContextDto[]) => IFileContextDto[])) => void;
    llmFilePathInput: string;
    setLlmFilePathInput: (input: string) => void;
    llmExpandedCards: Record<string, boolean>;
    setLlmExpandedCard: (cardId: string, expanded: boolean) => void;
    toggleLlmExpandedCard: (cardId: string) => void;
    setLlmExpandedCards: (cards: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
}

export const useLlmDomainState = create<LlmDomainState>((set, get) => ({
    // Mapped to Active Session
    get llmProvider() {
        const s = useSdlcSessionStore.getState();
        return s.activeSessionId && s.sessions[s.activeSessionId] ? s.sessions[s.activeSessionId].llmChat.provider : LlmProvider.OLLAMA;
    },
    setLlmProvider: (provider) => useSdlcSessionStore.getState().updateActiveSession(draft => { draft.llmChat.provider = provider; }),

    get llmSelectedModel() {
        const s = useSdlcSessionStore.getState();
        return s.activeSessionId && s.sessions[s.activeSessionId] ? s.sessions[s.activeSessionId].llmChat.selectedModel : '';
    },
    setLlmSelectedModel: (model) => useSdlcSessionStore.getState().updateActiveSession(draft => { draft.llmChat.selectedModel = model; }),

    get llmMessages() {
        const s = useSdlcSessionStore.getState();
        return s.activeSessionId && s.sessions[s.activeSessionId] ? s.sessions[s.activeSessionId].llmChat.messages : [];
    },
    setLmMessages: (msgs) => useSdlcSessionStore.getState().updateActiveSession(draft => {
        draft.llmChat.messages = typeof msgs === 'function' ? msgs(draft.llmChat.messages) : msgs;
    }),

    get llmTemperature() {
        const s = useSdlcSessionStore.getState();
        return s.activeSessionId && s.sessions[s.activeSessionId] ? s.sessions[s.activeSessionId].llmChat.temperature : 0.2;
    },
    setLlmTemperature: (temp) => useSdlcSessionStore.getState().updateActiveSession(draft => { draft.llmChat.temperature = temp; }),

    // Local Ephemeral State
    llmInputPrompt: '',
    setLlmInputPrompt: (prompt) => set({ llmInputPrompt: prompt }),
    llmAttachedFiles: [],
    setLlmAttachedFiles: (files) => set((s) => ({ llmAttachedFiles: typeof files === 'function' ? files(s.llmAttachedFiles) : files })),
    llmFilePathInput: '',
    setLlmFilePathInput: (input) => set({ llmFilePathInput: input }),
    llmExpandedCards: {},
    setLlmExpandedCard: (id, expanded) => set((s) => ({ llmExpandedCards: { ...s.llmExpandedCards, [id]: expanded } })),
    toggleLlmExpandedCard: (id) => set((s) => ({ llmExpandedCards: { ...s.llmExpandedCards, [id]: !(s.llmExpandedCards[id] ?? true) } })),
    setLlmExpandedCards: (cards) => set((s) => ({ llmExpandedCards: typeof cards === 'function' ? cards(s.llmExpandedCards) : cards }))
}));

// Provide backwards compatibility for legacy components
export const useExplorerStore = useLlmDomainState;

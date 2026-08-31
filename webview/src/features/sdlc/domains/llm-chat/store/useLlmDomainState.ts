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

const getActiveChatSession = () => {
  const s = useSdlcSessionStore.getState();
  return s.activeSessionId && s.sessions[s.activeSessionId]
    ? s.sessions[s.activeSessionId].llmChat
    : null;
};

export const useLlmDomainState = create<LlmDomainState>((set, get) => {
  const activeChat = getActiveChatSession();

  return {
    llmProvider: activeChat?.provider ?? LlmProvider.OLLAMA,
    setLlmProvider: (provider) => {
      useSdlcSessionStore.getState().updateActiveSession((draft) => {
        draft.llmChat.provider = provider;
      });
      set({ llmProvider: provider });
    },

    llmSelectedModel: activeChat?.selectedModel ?? '',
    setLlmSelectedModel: (model) => {
      useSdlcSessionStore.getState().updateActiveSession((draft) => {
        draft.llmChat.selectedModel = model;
      });
      set({ llmSelectedModel: model });
    },

    llmMessages: activeChat?.messages ?? [],
    setLmMessages: (msgs) => {
      const current = get().llmMessages;
      const nextMsgs = typeof msgs === 'function' ? msgs(current) : msgs;

      useSdlcSessionStore.getState().updateActiveSession((draft) => {
        draft.llmChat.messages = nextMsgs;
      });
      set({ llmMessages: nextMsgs });
    },

    llmTemperature: activeChat?.temperature ?? 0.2,
    setLlmTemperature: (temp) => {
      useSdlcSessionStore.getState().updateActiveSession((draft) => {
        draft.llmChat.temperature = temp;
      });
      set({ llmTemperature: temp });
    },

    // Local Ephemeral State
    llmInputPrompt: '',
    setLlmInputPrompt: (prompt) => set({ llmInputPrompt: prompt }),
    llmAttachedFiles: [],
    setLlmAttachedFiles: (files) =>
      set((s) => ({ llmAttachedFiles: typeof files === 'function' ? files(s.llmAttachedFiles) : files })),
    llmFilePathInput: '',
    setLlmFilePathInput: (input) => set({ llmFilePathInput: input }),
    llmExpandedCards: {},
    setLlmExpandedCard: (id, expanded) =>
      set((s) => ({ llmExpandedCards: { ...s.llmExpandedCards, [id]: expanded } })),
    toggleLlmExpandedCard: (id) =>
      set((s) => ({ llmExpandedCards: { ...s.llmExpandedCards, [id]: !(s.llmExpandedCards[id] ?? true) } })),
    setLlmExpandedCards: (cards) =>
      set((s) => ({ llmExpandedCards: typeof cards === 'function' ? cards(s.llmExpandedCards) : cards })),
  };
});

// Sync useLlmDomainState when session store changes (e.g. active session switch)
useSdlcSessionStore.subscribe((sessionState) => {
  const activeChat =
    sessionState.activeSessionId && sessionState.sessions[sessionState.activeSessionId]
      ? sessionState.sessions[sessionState.activeSessionId].llmChat
      : null;

  if (activeChat) {
    const currentLlmState = useLlmDomainState.getState();
    if (
      currentLlmState.llmProvider !== activeChat.provider ||
      currentLlmState.llmSelectedModel !== activeChat.selectedModel ||
      currentLlmState.llmMessages !== activeChat.messages ||
      currentLlmState.llmTemperature !== activeChat.temperature
    ) {
      useLlmDomainState.setState({
        llmProvider: activeChat.provider,
        llmSelectedModel: activeChat.selectedModel,
        llmMessages: activeChat.messages,
        llmTemperature: activeChat.temperature,
      });
    }
  }
});

// Provide backwards compatibility for legacy components
export const useExplorerStore = useLlmDomainState;

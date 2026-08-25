import { create } from 'zustand';
import { SdlcSession, SdlcSessionStatus } from '@/shared/services/sdlc-session';
import { LlmProvider } from '@/shared/services/llm-chat';

export interface SdlcSessionStoreState {
    sessions: Record<string, SdlcSession>;
    activeSessionId: string | null;

    // Actions
    createSession: () => string;
    setActiveSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    updateActiveSession: (updater: (draft: SdlcSession) => void) => void;
    setAllSessions: (sessions: SdlcSession[]) => void;
}

const createDefaultSession = (id: string): SdlcSession => ({
    sessionId: id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'draft',
    activeStepId: 'CODEBASE_CONTEXT',
    contextPointers: {
        selectedEntityId: null,
        impactedNodeIds: [],
        callersDepth: 1,
        calleesDepth: 1,
    },
    instructionsPayload: {
        strategy: 'vibe',
        promptText: '',
    },
    llmChat: {
        provider: LlmProvider.OLLAMA,
        selectedModel: '',
        temperature: 0.2,
        messages: [],
    }
});

export const useSdlcSessionStore = create<SdlcSessionStoreState>((set) => ({
    sessions: {},
    activeSessionId: null,

    createSession: () => {
        const newId = `session-${Date.now()}`;
        set((state) => ({
            sessions: { ...state.sessions, [newId]: createDefaultSession(newId) },
            activeSessionId: newId,
        }));
        return newId;
    },

    setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

    deleteSession: (sessionId) => set((state) => {
        const newSessions = { ...state.sessions };
        delete newSessions[sessionId];
        return {
            sessions: newSessions,
            activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
        };
    }),

    updateActiveSession: (updater) => set((state) => {
        if (!state.activeSessionId) return state;
        const session = state.sessions[state.activeSessionId];
        if (!session) return state;

        // Shallow clone for immutability without full deep copy overhead
        const draft = JSON.parse(JSON.stringify(session)) as SdlcSession;
        updater(draft);
        draft.updatedAt = Date.now();

        return {
            sessions: { ...state.sessions, [state.activeSessionId]: draft }
        };
    }),

    setAllSessions: (sessionsList) => set(() => {
        const map: Record<string, SdlcSession> = {};
        sessionsList.forEach(s => { map[s.sessionId] = s; });
        return { sessions: map };
    })
}));

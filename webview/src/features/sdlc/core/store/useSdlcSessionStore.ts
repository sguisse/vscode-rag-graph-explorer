import { create } from 'zustand';
import { SdlcSession } from '@/shared/services/sdlc-session/model/sdlc-session.model';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

const logStore = (action: string, details?: any) => {
  console.log(`[SdlcSessionStore] 🔄 ${action}`, details ?? '');
};

export interface SdlcSessionState {
  activeSessionId: string | null;
  sessions: Record<string, SdlcSession>;

  // Core Session Management
  setActiveSessionId: (id: string | null) => void;
  setActiveSession: (id: string | null) => void;
  setAllSessions: (sessions: SdlcSession[] | Record<string, SdlcSession>) => void;
  updateActiveSession: (updater: (draft: SdlcSession) => void) => void;
  createSession: (sessionId?: string) => string;
  deleteSession: (sessionId: string) => void;

  // Selected File Context Management
  setSelectedFiles: (files: string[]) => void;
  addSelectedFile: (filePath: string) => void;
  removeSelectedFile: (filePath: string) => void;

  // Structured Prompt Management
  setPromptText: (promptText: string) => void;

  // Selected Reference Items Management
  setSelectedReferences: (references: ReferenceItem[]) => void;
  toggleReferenceSelection: (reference: ReferenceItem) => void;
  isReferenceSelected: (referenceId: string) => boolean;
}

const createInitialSession = (id: string): SdlcSession => ({
  sessionId: id,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  status: 'draft',
  activeStepId: 'step-instructions',
  contextPointers: {
    selectedEntityId: null,
    impactedNodeIds: [],
    callersDepth: 1,
    calleesDepth: 1,
    selectedFiles: [],
  },
  instructionsPayload: {
    strategy: 'bmad',
    promptText: '',
    selectedReferences: undefined,
  },
  llmChat: {
    provider: 'gemini' as any,
    selectedModel: 'gemini-2.5-pro',
    temperature: 0.2,
    messages: [],
    customPrompt: undefined,
    selectedReferences: undefined,
  },
});

const defaultSessionId = 'session-default';
const initialDefaultSession = createInitialSession(defaultSessionId);

export const useSdlcSessionStore = create<SdlcSessionState>((set, get) => ({
  activeSessionId: defaultSessionId,
  sessions: { [defaultSessionId]: initialDefaultSession },

  setActiveSessionId: (id) => {
    logStore('setActiveSessionId', { id });
    set({ activeSessionId: id });
  },

  setActiveSession: (id) => {
    logStore('setActiveSession', { id });
    set({ activeSessionId: id });
  },

  setAllSessions: (sessionsInput) => {
    logStore('setAllSessions', { input: sessionsInput });
    let map: Record<string, SdlcSession> = {};
    if (Array.isArray(sessionsInput)) {
      sessionsInput.forEach((s) => {
        map[s.sessionId] = s;
      });
    } else {
      map = sessionsInput || {};
    }
    const keys = Object.keys(map);
    const currentActive = get().activeSessionId;
    const candidateActive = (currentActive && map[currentActive] ? currentActive : keys[0]) || defaultSessionId;
    const nextActive: string = candidateActive || defaultSessionId;

    if (!map[nextActive]) {
      map[nextActive] = createInitialSession(nextActive);
    }

    set({ sessions: map, activeSessionId: nextActive });
  },

  updateActiveSession: (updater) => {
    let { activeSessionId, sessions } = get();

    if (!activeSessionId || !sessions[activeSessionId]) {
      const keys = Object.keys(sessions);
      if (keys.length > 0) {
        activeSessionId = keys[0];
      } else {
        activeSessionId = defaultSessionId;
        sessions = { [defaultSessionId]: createInitialSession(defaultSessionId) };
      }
    }

    const currentSession = sessions[activeSessionId];
    const sessionCopy: SdlcSession = {
      ...currentSession,
      contextPointers: { ...currentSession.contextPointers },
      instructionsPayload: { ...currentSession.instructionsPayload },
      llmChat: { ...currentSession.llmChat },
      updatedAt: Date.now(),
    };

    updater(sessionCopy);

    logStore('updateActiveSession SUCCESS', {
      activeSessionId,
      promptTextLength: sessionCopy.instructionsPayload?.promptText?.length,
      customPromptLength: sessionCopy.llmChat?.customPrompt?.length,
      instructionsRefsCount: sessionCopy.instructionsPayload?.selectedReferences?.length,
      llmChatRefsCount: sessionCopy.llmChat?.selectedReferences?.length,
      selectedFilesCount: sessionCopy.contextPointers?.selectedFiles?.length,
    });

    set({
      activeSessionId,
      sessions: {
        ...sessions,
        [activeSessionId]: sessionCopy,
      },
    });
  },

  createSession: (customId) => {
    const id = customId || `session-${Date.now()}`;
    logStore('createSession', { id });
    const newSession = createInitialSession(id);
    set((state) => ({
      sessions: { ...state.sessions, [id]: newSession },
      activeSessionId: id,
    }));
    return id;
  },

  deleteSession: (sessionId) => {
    logStore('deleteSession', { sessionId });
    set((state) => {
      const { [sessionId]: _, ...remainingSessions } = state.sessions;
      const candidateId =
        state.activeSessionId === sessionId
          ? Object.keys(remainingSessions)[0]
          : state.activeSessionId;
      const nextActiveId: string = candidateId || defaultSessionId;

      if (!remainingSessions[nextActiveId]) {
        remainingSessions[nextActiveId] = createInitialSession(nextActiveId);
      }

      return {
        sessions: remainingSessions,
        activeSessionId: nextActiveId,
      };
    });
  },

  setSelectedFiles: (files) => {
    logStore('setSelectedFiles', { files });
    get().updateActiveSession((draft) => {
      if (!draft.contextPointers) {
        draft.contextPointers = {
          selectedEntityId: null,
          impactedNodeIds: [],
          callersDepth: 1,
          calleesDepth: 1,
          selectedFiles: [],
        };
      }
      draft.contextPointers.selectedFiles = files;
    });
  },

  addSelectedFile: (filePath) => {
    logStore('addSelectedFile', { filePath });
    get().updateActiveSession((draft) => {
      if (!draft.contextPointers.selectedFiles) {
        draft.contextPointers.selectedFiles = [];
      }
      if (!draft.contextPointers.selectedFiles.includes(filePath)) {
        draft.contextPointers.selectedFiles.push(filePath);
      }
    });
  },

  removeSelectedFile: (filePath) => {
    logStore('removeSelectedFile', { filePath });
    get().updateActiveSession((draft) => {
      if (draft.contextPointers?.selectedFiles) {
        draft.contextPointers.selectedFiles = draft.contextPointers.selectedFiles.filter(
          (f) => f !== filePath
        );
      }
    });
  },

  setPromptText: (promptText) => {
    logStore('setPromptText', { length: promptText?.length });
    get().updateActiveSession((draft) => {
      if (!draft.instructionsPayload) {
        draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      }
      draft.instructionsPayload.promptText = promptText;
      if (draft.llmChat) {
        draft.llmChat.customPrompt = undefined;
      }
    });
  },

  setSelectedReferences: (references) => {
    logStore('setSelectedReferences', { count: references?.length });
    get().updateActiveSession((draft) => {
      if (!draft.instructionsPayload) {
        draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      }
      draft.instructionsPayload.selectedReferences = references;
    });
  },

  toggleReferenceSelection: (reference) => {
    logStore('toggleReferenceSelection', { referenceId: reference.id });
    get().updateActiveSession((draft) => {
      const currentRefs =
        draft.llmChat?.selectedReferences ?? draft.instructionsPayload?.selectedReferences ?? [];
      const exists = currentRefs.some((r) => r.id === reference.id);

      const updatedRefs = exists
        ? currentRefs.filter((r) => r.id !== reference.id)
        : [...currentRefs, reference];

      if (!draft.instructionsPayload) draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      draft.instructionsPayload.selectedReferences = updatedRefs;

      if (!draft.llmChat) {
        draft.llmChat = {
          provider: 'gemini' as any,
          selectedModel: 'gemini-2.5-pro',
          temperature: 0.2,
          messages: [],
        };
      }
      draft.llmChat.selectedReferences = updatedRefs;
    });
  },

  isReferenceSelected: (referenceId) => {
    const { activeSessionId, sessions } = get();
    if (!activeSessionId || !sessions[activeSessionId]) return false;
    const session = sessions[activeSessionId];
    const refs = session.llmChat?.selectedReferences ?? session.instructionsPayload?.selectedReferences ?? [];
    return refs.some((r) => r.id === referenceId);
  },
}));

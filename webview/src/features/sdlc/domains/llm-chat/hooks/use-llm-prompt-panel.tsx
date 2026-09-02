import { useMemo, useCallback } from 'react';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

export interface UseLlmPromptPanelProps {
  allReferences?: ReferenceItem[];
  onSendToLlm?: (prompt: string, selectedRefs: ReferenceItem[]) => void;
}

export function useLlmPromptPanel({
  allReferences = [],
  onSendToLlm,
}: UseLlmPromptPanelProps = {}) {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  // Dynamic Prompt Resolution
  const promptText = useMemo(() => {
    if (session?.llmChat?.customPrompt !== undefined && session.llmChat.customPrompt !== '') {
      return session.llmChat.customPrompt;
    }
    return session?.instructionsPayload?.promptText || '';
  }, [session?.llmChat?.customPrompt, session?.instructionsPayload?.promptText]);

  // Effective selected references from Instructions
  const selectedReferencesFromInstruction = useMemo(() => {
    const fromPayload = session?.instructionsPayload?.selectedReferences;
    if (fromPayload && fromPayload.length > 0) {
      return fromPayload;
    }
    return allReferences.filter((r) => Boolean(r.preSelected));
  }, [session?.instructionsPayload?.selectedReferences, allReferences]);

  // Effective selected references for LLM Chat
  const selectedReferencesFromChat = useMemo(() => {
    const chatRefs = session?.llmChat?.selectedReferences;
    if (chatRefs !== undefined && chatRefs !== null) {
      return chatRefs;
    }
    return selectedReferencesFromInstruction;
  }, [session?.llmChat?.selectedReferences, selectedReferencesFromInstruction]);

  const selectedRefIds = useMemo(() => {
    return new Set(selectedReferencesFromChat.map((r) => r.id));
  }, [selectedReferencesFromChat]);

  const instructionRefIds = useMemo(() => {
    return new Set(selectedReferencesFromInstruction.map((r) => r.id));
  }, [selectedReferencesFromInstruction]);

  // Calculate Context Size (Prompt + Reference Files Size)
  const totalRefSizeKb = useMemo(() => {
    return selectedReferencesFromChat.reduce((acc, item) => acc + (item.sizeKb || 0), 0);
  }, [selectedReferencesFromChat]);

  const promptCharCount = promptText.length;
  const promptEstimatedTokens = Math.round(promptCharCount / 4);

  // Sorted References List
  const sortedReferences = useMemo(() => {
    const list = [...allReferences];
    return list.sort((a, b) => {
      const aIsSelected = selectedRefIds.has(a.id) || instructionRefIds.has(a.id);
      const bIsSelected = selectedRefIds.has(b.id) || instructionRefIds.has(b.id);

      if (aIsSelected !== bIsSelected) {
        return aIsSelected ? -1 : 1;
      }

      const catCompare = (a.category || '').localeCompare(b.category || '');
      if (catCompare !== 0) return catCompare;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allReferences, selectedRefIds, instructionRefIds]);

  const handlePromptChange = useCallback(
    (val: string) => {
      updateSession((draft) => {
        if (!draft.llmChat) {
          draft.llmChat = {
            provider: 'gemini' as any,
            selectedModel: 'gemini-2.5-pro',
            temperature: 0.2,
            messages: [],
          };
        }
        draft.llmChat.customPrompt = val;
      });
    },
    [updateSession]
  );

  const handleToggleReference = useCallback(
    (item: ReferenceItem) => {
      updateSession((draft) => {
        if (!draft.llmChat) {
          draft.llmChat = {
            provider: 'gemini' as any,
            selectedModel: 'gemini-2.5-pro',
            temperature: 0.2,
            messages: [],
          };
        }
        const current = draft.llmChat.selectedReferences ?? selectedReferencesFromInstruction;
        const exists = current.some((r) => r.id === item.id);

        const next = exists ? current.filter((r) => r.id !== item.id) : [...current, item];
        draft.llmChat.selectedReferences = next;
      });
    },
    [updateSession, selectedReferencesFromInstruction]
  );

  const handleSelectAll = useCallback(() => {
    updateSession((draft) => {
      if (!draft.llmChat)
        draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.selectedReferences = [...allReferences];
    });
  }, [allReferences, updateSession]);

  const handleDeselectAll = useCallback(() => {
    updateSession((draft) => {
      if (!draft.llmChat)
        draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.selectedReferences = [];
    });
  }, [updateSession]);

  const handleResetFromInstructions = useCallback(() => {
    updateSession((draft) => {
      if (!draft.llmChat)
        draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.customPrompt = undefined;
      draft.llmChat.selectedReferences = undefined;
    });
  }, [updateSession]);

  const handleSend = useCallback(() => {
    if (onSendToLlm) {
      onSendToLlm(promptText, selectedReferencesFromChat);
    }
  }, [onSendToLlm, promptText, selectedReferencesFromChat]);

  return {
    promptText,
    promptCharCount,
    promptEstimatedTokens,
    selectedReferencesFromChat,
    selectedRefIds,
    sortedReferences,
    totalRefSizeKb,
    handlePromptChange,
    handleToggleReference,
    handleSelectAll,
    handleDeselectAll,
    handleResetFromInstructions,
    handleSend,
  };
}

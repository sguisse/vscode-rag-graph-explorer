import React, { useEffect, useState } from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { LlmPromptPanel } from '../components/prompt-panel/llm-prompt-panel';
import { ReferenceItem, REFERENCES_PROJECT_KEY } from '@/shared/services/reference/model/reference-model';
import { referenceApiService } from '@/services/api/reference-api.service.gen';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';

export const LeftPanelContainer: React.FC = () => {
  const [allReferences, setAllReferences] = useState<ReferenceItem[]>([]);
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  useEffect(() => {
    let isMounted = true;
    const fetchReferences = async () => {
      try {
        if (referenceApiService?.loadAllReferences) {
          const refs = await referenceApiService.loadAllReferences(REFERENCES_PROJECT_KEY);
          if (isMounted && refs) {
            setAllReferences(refs);

            const preSelectedRefs = refs.filter((r) => Boolean(r.preSelected));
            updateSession((draft) => {
              if (!draft.instructionsPayload) {
                draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
              }
              if (!draft.instructionsPayload.selectedReferences) {
                draft.instructionsPayload.selectedReferences = preSelectedRefs;
              }
            });
          }
        }
      } catch (err) {
        console.error('[LeftPanelContainer LLM Chat] Error loading references:', err);
      }
    };

    fetchReferences();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, updateSession]);

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Prompt Tuning & Reference Context" path="workspace.left" />
      <div className="flex-1 p-1.5 min-h-0 overflow-hidden">
        <LlmPromptPanel allReferences={allReferences} />
      </div>
    </div>
  );
};

export default LeftPanelContainer;

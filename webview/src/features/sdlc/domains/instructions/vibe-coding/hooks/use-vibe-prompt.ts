import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { AGENTS_LIST } from '../data/data-constants';
import PREDEFINED_PROMPTS from '../data/predefined-prompts.yaml';
import TEMPLATE_PROMPTS from '../data/template-prompts.yaml';

export function useVibePrompt(propHandleCopy?: (text: string, message: string) => void) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  const [promptFields, setPromptFields] = useState({
    predefined: 'custom',
    mode: 'role' as 'role' | 'agent',
    selectedAgent: AGENTS_LIST[0] || 'CodeRefactoringAgent',
    roleOrAgent: '',
    tone: '',
    context: '',
    expected: '',
    output: '',
    samples: '',
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    (TEMPLATE_PROMPTS && TEMPLATE_PROMPTS[0]?.id) || 'gemini-web-tasks-prompt-template'
  );

  const updatePromptFields = useCallback((delta: Partial<typeof promptFields>) => {
    setPromptFields((prev) => ({ ...prev, ...delta }));
  }, []);

  const notify = useCallback(
    (msg: string) => {
      if (propHandleCopy) {
        propHandleCopy('', msg);
      } else {
        setNotification(msg);
      }
    },
    [propHandleCopy, setNotification]
  );

  const handlePredefinedChange = useCallback(
    (presetId: string) => {
      if (presetId === 'custom') {
        updatePromptFields({ predefined: 'custom' });
        return;
      }
      const found = (PREDEFINED_PROMPTS as any[])?.find((p: any) => p.id === presetId);
      if (found && found.data) {
        const d = found.data;
        updatePromptFields({
          predefined: presetId,
          mode: (d.mode as 'role' | 'agent') || 'role',
          roleOrAgent: d.roleOrAgent || '',
          selectedAgent: d.selectedAgent || AGENTS_LIST[0],
          tone: d.tone || '',
          context: d.context || '',
          expected: d.expected || '',
          output: d.output || '',
          samples: d.samples || '',
        });
        notify(`Loaded preset: ${found.name}`);
      } else {
        updatePromptFields({ predefined: presetId });
      }
    },
    [updatePromptFields, notify]
  );

  const handleInsertAgent = useCallback(() => {
    if (promptFields.selectedAgent) {
      updatePromptFields({
        roleOrAgent: `[AGENT]: ${promptFields.selectedAgent}\n${promptFields.roleOrAgent}`,
      });
      notify(`Inserted agent ${promptFields.selectedAgent} into field!`);
    }
  }, [promptFields.selectedAgent, promptFields.roleOrAgent, updatePromptFields, notify]);

  const rawAssembledPrompt = useMemo(() => {
    const templateItem = (TEMPLATE_PROMPTS as any[])?.find((t: any) => t.id === selectedTemplateId);

    if (templateItem && templateItem.data) {
      const roleHeader =
        promptFields.mode === 'agent'
          ? `[AGENT]: ${promptFields.selectedAgent} (${promptFields.roleOrAgent})`
          : `${promptFields.roleOrAgent}`;

      const replacements: Record<string, string> = {
        '{{ ROLE_AGENT }}': roleHeader,
        '{{ TONE }}': promptFields.tone || '',
        '{{ GLOBAL_CONTEXT_SCOPE }}': '',
        '{{ TASK_CONTEXT_SCOPE }}': promptFields.context || '',
        '{{ EXPECTED_DELIVERABLES }}': promptFields.expected || '',
        '{{ OUTPUT_FORMAT_CONSTRAINTS }}': promptFields.output || '',
        '{{ REFERENCE_SAMPLES }}': promptFields.samples || '',
      };

      let text = templateItem.data;
      Object.entries(replacements).forEach(([key, value]) => {
        text = text.replaceAll(key, value);
      });
      return text;
    }

    const parts: string[] = [];
    if (promptFields.mode === 'agent' && promptFields.selectedAgent) {
      parts.push(`[AGENT]: ${promptFields.selectedAgent}`);
    }
    if (promptFields.roleOrAgent.trim()) {
      parts.push(`[ROLE / DESCRIPTION]\n${promptFields.roleOrAgent.trim()}`);
    }
    if (promptFields.tone.trim()) {
      parts.push(`[TONE]\n${promptFields.tone.trim()}`);
    }
    if (promptFields.context.trim()) {
      parts.push(`[CONTEXT]\n${promptFields.context.trim()}`);
    }
    if (promptFields.expected.trim()) {
      parts.push(`[EXPECTED DELIVERABLES]\n${promptFields.expected.trim()}`);
    }
    if (promptFields.output.trim()) {
      parts.push(`[OUTPUT FORMAT]\n${promptFields.output.trim()}`);
    }
    if (promptFields.samples.trim()) {
      parts.push(`[SAMPLES / EXAMPLES]\n${promptFields.samples.trim()}`);
    }
    return parts.join('\n\n');
  }, [promptFields, selectedTemplateId]);

  // Guarded sync with SDLC Session Store
  const currentStoredPromptText = session?.instructionsPayload?.promptText;
  useEffect(() => {
    if (session && currentStoredPromptText !== rawAssembledPrompt) {
      updateSession((draft) => {
        if (!draft.instructionsPayload) {
          draft.instructionsPayload = { strategy: 'vibe', promptText: '' };
        }
        draft.instructionsPayload.promptText = rawAssembledPrompt;
      });
    }
  }, [rawAssembledPrompt, currentStoredPromptText, session, updateSession]);

  const handleCopyPrompt = useCallback(async () => {
    if (propHandleCopy) {
      propHandleCopy(rawAssembledPrompt, 'Vibe Coding prompt copied to clipboard!');
    } else {
      if (rawAssembledPrompt) {
        await vsCodeApiService.copyToClipboard(rawAssembledPrompt);
      }
      setNotification('✅ Vibe Coding prompt copied to clipboard!');
    }
  }, [propHandleCopy, rawAssembledPrompt, setNotification]);

  return {
    promptFields,
    updatePromptFields,
    selectedTemplateId,
    setSelectedTemplateId,
    handlePredefinedChange,
    handleCopyPrompt,
    handleInsertAgent,
    rawAssembledPrompt,
  };
}

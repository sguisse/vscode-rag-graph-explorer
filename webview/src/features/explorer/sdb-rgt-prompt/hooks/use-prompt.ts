import { useState } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../store/useExplorerStore';
import PREDEFINED_PROMPTS from '../data/predefined-prompts.yaml';
import TEMPLATE_PROMPTS from '../data/template-prompts.yaml';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export function usePrompt(handleCopy?: (text: string, message: string) => void) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const promptFields = useExplorerStore((s) => s.promptFields);
  const config = useExplorerStore((s) => s.config);
  const updatePromptFields = useExplorerStore((s) => s.updatePromptFields);
  const getFullPrompt = useExplorerStore((s) => s.getFullPrompt);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    TEMPLATE_PROMPTS[0]?.id || ''
  );

  const notify = (msg: string) => {
    if (handleCopy) {
      handleCopy('', msg);
    } else {
      setNotification(msg);
    }
  };

  const handlePredefinedChange = (presetId: string) => {
    const found = PREDEFINED_PROMPTS.find((p: any) => p.id === presetId);
    if (found) {
      updatePromptFields({
        ...found.data,
        mode: found.data.mode as 'role' | 'agent',
        predefined: presetId,
      });
      notify(`Loaded predefined template: ${found.name}`);
    } else {
      updatePromptFields({ predefined: presetId });
    }
  };

  const handleCopyPrompt = async () => {
    const templateItem = TEMPLATE_PROMPTS.find((t: any) => t.id === selectedTemplateId);
    let fullPrompt = '';

    if (templateItem && templateItem.data) {
      const roleHeader =
        promptFields.mode === 'agent'
          ? `[AGENT]: ${promptFields.selectedAgent} (${promptFields.roleOrAgent})`
          : `${promptFields.roleOrAgent}`;

      const replacements: Record<string, string> = {
        '{{ ROLE_AGENT }}': roleHeader,
        '{{ TONE }}': promptFields.tone || '',
        '{{ GLOBAL_CONTEXT_SCOPE }}': config.systemPromptPrefix || '',
        '{{ TASK_CONTEXT_SCOPE }}': promptFields.context || '',
        '{{ EXPECTED_DELIVERABLES }}': promptFields.expected || '',
        '{{ OUTPUT_FORMAT_CONSTRAINTS }}': promptFields.output || '',
        '{{ REFERENCE_SAMPLES }}': promptFields.samples || '',
      };

      fullPrompt = templateItem.data;
      Object.entries(replacements).forEach(([key, value]) => {
        fullPrompt = fullPrompt.replaceAll(key, value);
      });
    } else {
      fullPrompt = getFullPrompt();
    }

    logInfo(`Full prompt generated: ${fullPrompt}`);

    try {
      await vsCodeApiService.copyToClipboard(fullPrompt);
      setNotification('✅ Full prompt copied to clipboard!');
    } catch {
      setNotification('❌ Failed to copy prompt to clipboard');
    }
  };

  const handleInsertAgent = () => {
    updatePromptFields({ roleOrAgent: `${promptFields.selectedAgent}: ${promptFields.roleOrAgent}` });
    notify(`Inserted agent ${promptFields.selectedAgent} into field!`);
  };

  return {
    promptFields,
    updatePromptFields,
    selectedTemplateId,
    setSelectedTemplateId,
    handlePredefinedChange,
    handleCopyPrompt,
    handleInsertAgent,
  };
}

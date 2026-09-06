import { useState } from 'react';
import { PREDEFINED_PROMPTS_LIST, formatPredefinedPromptText } from '../data/predefined-prompts';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';

export function usePromptTab() {
  const defaultPrompt = PREDEFINED_PROMPTS_LIST[0];
  const [selectedPromptId, setSelectedPromptId] = useState<string>(defaultPrompt.id);
  const [promptText, setPromptText] = useState<string>(formatPredefinedPromptText(defaultPrompt));

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    const found = PREDEFINED_PROMPTS_LIST.find((p) => p.id === promptId);
    if (found) {
      const formatted = formatPredefinedPromptText(found);
      setPromptText(formatted);
      logInfo('[usePromptTab] Predefined prompt selected', [{ id: promptId, name: found.name }]);
    }
  };

  const handleCopyWithFullContext = () => {
    logInfo('[usePromptTab] Copy with full context handler triggered', [promptText]);
    vsCodeApiService.copyToClipboard(promptText);
    fileExporterApiService.showNotification('info', 'Prompt copied to clipboard with full context!');
  };

  return {
    selectedPromptId,
    promptText,
    setPromptText,
    handleSelectPrompt,
    handleCopyWithFullContext,
    predefinedPrompts: PREDEFINED_PROMPTS_LIST,
  };
}

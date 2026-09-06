import { useState } from 'react';
import { PREDEFINED_PROMPTS_LIST, formatPredefinedPromptText } from '../data/predefined-prompts';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { useExporterStore } from '../../../../store/useExporterStore';

export function usePromptTab() {
  const defaultPrompt = PREDEFINED_PROMPTS_LIST[0];
  const [selectedPromptId, setSelectedPromptId] = useState<string>(defaultPrompt.id);
  const [promptText, setPromptText] = useState<string>(formatPredefinedPromptText(defaultPrompt));

  const config = useExporterStore((s) => s.config);

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    const found = PREDEFINED_PROMPTS_LIST.find((p) => p.id === promptId);
    if (found) {
      const formatted = formatPredefinedPromptText(found);
      setPromptText(formatted);
      logInfo('[usePromptTab] Predefined prompt selected', [{ id: promptId, name: found.name }]);
    }
  };

  const handleCopyWithFullContext = async () => {
    logInfo('[usePromptTab] Copy with full context handler triggered', [promptText]);

    const codebasePaths = (config.codebase?.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
    const referencePaths = (config.reference?.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fileExporterApiService.copyFullContextToClipboard(codebasePaths, referencePaths, promptText);
      if (res.success) {
        fileExporterApiService.showNotification('info', res.message || 'Full context copied to clipboard!');
      } else {
        vsCodeApiService.copyToClipboard(promptText);
        fileExporterApiService.showNotification('info', 'Prompt text copied to clipboard!');
      }
    } catch (err: any) {
      vsCodeApiService.copyToClipboard(promptText);
      fileExporterApiService.showNotification('info', 'Prompt text copied to clipboard!');
    }
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

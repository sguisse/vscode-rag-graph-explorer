import { useState } from 'react';
import { PREDEFINED_PROMPTS_LIST, formatPredefinedPromptText } from '../data/predefined-prompts';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { useExporterStore } from '../../../../store/useExporterStore';

export function usePromptTab() {
  const defaultPrompt = PREDEFINED_PROMPTS_LIST[0];
  const defaultTemplate = formatPredefinedPromptText(defaultPrompt);

  // Single Source of Truth: Read prompt text directly from store.config.prompt
  const promptText = useExporterStore((s: any) => {
    const val = s.config?.prompt;
    return val !== undefined && val !== null ? val : defaultTemplate;
  });

  const setConfig = useExporterStore((s: any) => s.setConfig);
  const config = useExporterStore((s: any) => s.config);

  const [selectedPromptId, setSelectedPromptId] = useState<string>(defaultPrompt.id);

  // Directly update store.config.prompt without local state duplication
  const setPromptText = (text: string) => {
    setConfig((prev: any) => ({
      ...prev,
      prompt: text,
    }));
    if (typeof (useExporterStore.getState() as any).setPrompt === 'function') {
      (useExporterStore.getState() as any).setPrompt(text);
    }
  };

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

    const codebasePaths = (config?.codebase?.src || '')
      .split(/[,\n\r]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    const referencePaths = (config?.reference?.src || '')
      .split(/[,\n\r]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);

    try {
      const res = await fileExporterApiService.copyFullContextToClipboard(codebasePaths, referencePaths, promptText);
      if (res?.success) {
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

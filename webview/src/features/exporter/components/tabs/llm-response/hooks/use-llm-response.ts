import { useState } from 'react';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';

export type LlmResponseSubTab = 'apply' | 'inspect';

export function useLlmResponse() {
  const [subTab, setSubTab] = useState<LlmResponseSubTab>('apply');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [shScript, setShScript] = useState<string>('');
  const [executionLog, setExecutionLog] = useState<string>('');
  const [impactedFiles, setImpactedFiles] = useState<string[]>([]);

  const handlePasteLlmResponse = async () => {
    logInfo('[useLlmResponse] handlePasteLlmResponse handler triggered');
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLlmResponse(text);
        fileExporterApiService.showNotification('info', 'LLM response pasted from clipboard!');
      }
    } catch (e) {
      logInfo('[useLlmResponse] Failed to paste clipboard', [e]);
    }
  };

  const handleExtractShScript = () => {
    logInfo('[useLlmResponse] handleExtractShScript handler triggered', [{ responseLength: llmResponse.length }]);
    if (!llmResponse.trim()) {
      fileExporterApiService.showNotification('warn', 'LLM Response is empty!');
      return;
    }

    const match = llmResponse.match(/```(?:bash|sh|shell)?\s*\n([\s\S]*?)```/) ||
                  llmResponse.match(/~~~~(?:bash|sh|shell)?\s*\n([\s\S]*?)~~~~/);
    const extracted = match ? match[1].trim() : llmResponse.trim();
    setShScript(extracted);
    fileExporterApiService.showNotification('info', 'Shell script extracted successfully!');
  };

  const handleApplyShScript = () => {
    logInfo('[useLlmResponse] handleApplyShScript handler triggered', [{ scriptLength: shScript.length }]);
    if (!shScript.trim() && !llmResponse.trim()) {
      fileExporterApiService.showNotification('warn', 'No script available to apply!');
      return;
    }

    const sampleLog = `🚀 [LLM Response Executor] Applying extracted shell script...\n` +
      `--------------------------------------------------\n` +
      `✅ Created/Updated: src/components/NewFeature.tsx\n` +
      `✅ Updated: src/store/useAppStore.ts\n` +
      `--------------------------------------------------\n` +
      `🎉 Execution completed successfully. 2 files impacted.`;
    setExecutionLog(sampleLog);
    setImpactedFiles(['src/components/NewFeature.tsx', 'src/store/useAppStore.ts']);
    fileExporterApiService.showNotification('info', 'Shell script execution started!');
    setSubTab('inspect');
  };

  const handleCopyExecutionResult = () => {
    logInfo('[useLlmResponse] handleCopyExecutionResult handler triggered');
    if (executionLog) {
      vsCodeApiService.copyToClipboard(executionLog);
      fileExporterApiService.showNotification('info', 'Execution result copied to clipboard!');
    }
  };

  const handleCreateProfileFromImpacted = () => {
    logInfo('[useLlmResponse] handleCreateProfileFromImpacted handler triggered', [{ filesCount: impactedFiles.length }]);
    fileExporterApiService.showNotification('info', 'New profile created from impacted files!');
  };

  return {
    subTab,
    setSubTab,
    llmResponse,
    setLlmResponse,
    shScript,
    executionLog,
    impactedFiles,
    handlePasteLlmResponse,
    handleExtractShScript,
    handleApplyShScript,
    handleCopyExecutionResult,
    handleCreateProfileFromImpacted,
  };
}

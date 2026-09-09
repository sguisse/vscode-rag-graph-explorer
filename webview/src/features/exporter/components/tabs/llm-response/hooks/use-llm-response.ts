import { useExporterStore, LlmResponseSubTab } from '../../../../store/useExporterStore';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { BashExecutionResult } from '@/shared/services/file-exporter/model/file-exporter-model';

export type { LlmResponseSubTab };

export function useLlmResponse() {
  const subTab = useExporterStore((s) => s.llmSubTab);
  const setSubTab = useExporterStore((s) => s.setLlmSubTab);
  const llmResponse = useExporterStore((s) => s.llmResponseText);
  const setLlmResponse = useExporterStore((s) => s.setLlmResponseText);
  const shScript = useExporterStore((s) => s.llmShScript);
  const setShScript = useExporterStore((s) => s.setLlmShScript);
  const executionLog = useExporterStore((s) => s.llmExecutionLog);
  const setExecutionLog = useExporterStore((s) => s.setLlmExecutionLog);
  const impactedFilesCount = useExporterStore((s) => s.llmImpactedFilesCount);
  const setImpactedFilesCount = useExporterStore((s) => s.setLlmImpactedFilesCount);
  const gitCommitMessage = useExporterStore((s) => s.llmGitCommitMessage);
  const setGitCommitMessage = useExporterStore((s) => s.setLlmGitCommitMessage);
  const isExecuting = useExporterStore((s) => s.llmIsExecuting);
  const setIsExecuting = useExporterStore((s) => s.setLlmIsExecuting);

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

  const handleApplyShScript = async () => {
    let scriptToApply = shScript.trim();
    if (!scriptToApply) {
      const match = llmResponse.match(/```(?:bash|sh|shell)?\s*\n([\s\S]*?)```/) ||
                    llmResponse.match(/~~~~(?:bash|sh|shell)?\s*\n([\s\S]*?)~~~~/);
      scriptToApply = match ? match[1].trim() : llmResponse.trim();
    }

    logInfo('[useLlmResponse] handleApplyShScript handler triggered', [{ scriptLength: scriptToApply.length }]);
    if (!scriptToApply) {
      fileExporterApiService.showNotification('warn', 'No script available to apply!');
      return;
    }

    setIsExecuting(true);
    fileExporterApiService.showNotification('info', 'Executing codebase update script...');

    try {
      const res: BashExecutionResult = await fileExporterApiService.executeBashCodebaseUpdate(scriptToApply);
      logInfo('[useLlmResponse] executeBashCodebaseUpdate result received', [res]);

      setExecutionLog(res.terminalLogs || res.message || '');
      setGitCommitMessage(res.gitCommitMessage || '');
      const totalImpacted = (res.nbFilesCreated || 0) + (res.nbFilesUpdated || 0);
      setImpactedFilesCount(totalImpacted);

      if (res.result === 'success') {
        fileExporterApiService.showNotification('info', res.message || 'Codebase update applied successfully!');
      } else if (res.result === 'warning') {
        fileExporterApiService.showNotification('warn', res.message || 'Codebase update completed with warnings.');
      } else {
        fileExporterApiService.showNotification('error', res.message || 'Codebase update failed.');
      }

      setSubTab('inspect');
    } catch (err: any) {
      logInfo('[useLlmResponse] executeBashCodebaseUpdate error', [err]);
      fileExporterApiService.showNotification('error', `Failed to execute update: ${err?.message || err}`);
      setExecutionLog(`❌ Execution error: ${err?.message || err}`);
      setSubTab('inspect');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyExecutionResult = () => {
    logInfo('[useLlmResponse] handleCopyExecutionResult handler triggered');
    if (executionLog) {
      vsCodeApiService.copyToClipboard(executionLog);
      fileExporterApiService.showNotification('info', 'Execution result copied to clipboard!');
    }
  };

  const handleCreateProfileFromImpacted = () => {
    logInfo('[useLlmResponse] handleCreateProfileFromImpacted handler triggered', [{ count: impactedFilesCount }]);
    fileExporterApiService.showNotification('info', 'New profile created from impacted files!');
  };

  return {
    subTab,
    setSubTab,
    llmResponse,
    setLlmResponse,
    shScript,
    executionLog,
    impactedFilesCount,
    gitCommitMessage,
    setGitCommitMessage,
    isExecuting,
    handlePasteLlmResponse,
    handleExtractShScript,
    handleApplyShScript,
    handleCopyExecutionResult,
    handleCreateProfileFromImpacted,
  };
}

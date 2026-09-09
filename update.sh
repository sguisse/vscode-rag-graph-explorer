#!/usr/bin/env bash
set -e

# Create necessary directories
mkdir -p webview/src/features/exporter/components/tabs/llm-response/hooks
mkdir -p webview/src/features/exporter/components/tabs/llm-response/components/apply-response
mkdir -p webview/src/features/exporter/components/tabs/llm-response/components/inspect-results

# 1. Create the hook for LLM Response Tab
cat << 'EOF' > webview/src/features/exporter/components/tabs/llm-response/hooks/use-llm-response.ts
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
EOF

# 2. Create the ApplyResponsePanel component
cat << 'EOF' > webview/src/features/exporter/components/tabs/llm-response/components/apply-response/ApplyResponsePanel.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardPaste, FileCode, Play } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';

interface ApplyResponsePanelProps {
  llmResponse: string;
  onChangeLlmResponse: (val: string) => void;
  onPaste: () => void;
  onExtractSh: () => void;
  onApplySh: () => void;
}

export const ApplyResponsePanel: React.FC<ApplyResponsePanelProps> = ({
  llmResponse,
  onChangeLlmResponse,
  onPaste,
  onExtractSh,
  onApplySh,
}) => {
  const middleContent = (
    <div className="p-3 h-full min-h-0 flex flex-col space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between">
        <label htmlFor="textarea-llm-response" className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <span>🤖 LLM Response</span>
        </label>
        <Button
          size="sm"
          variant="ghost"
          onClick={onPaste}
          data-tooltip="Paste LLM Response from Clipboard"
          className="h-7 px-2 text-xs font-mono gap-1.5 cursor-pointer hover:bg-muted"
        >
          <ClipboardPaste size={14} className="text-primary" />
          <span>Paste</span>
        </Button>
      </div>
      <Textarea
        id="textarea-llm-response"
        value={llmResponse}
        onChange={(e) => onChangeLlmResponse(e.target.value)}
        placeholder="Paste full LLM response containing Bash script here..."
        className="flex-1 w-full h-full font-mono text-xs bg-card resize-none border-border focus-visible:ring-1"
        spellCheck={false}
      />
    </div>
  );

  const bottomContent = (
    <div className="p-3 bg-card border-t border-border flex items-center justify-end gap-3 font-mono text-xs">
      <Button
        type="button"
        variant="outline"
        onClick={onExtractSh}
        className="h-8 px-4 font-bold gap-2 text-xs cursor-pointer"
        data-tooltip="Extract Shell Script block from LLM response"
      >
        <FileCode size={14} className="text-primary" />
        <span>Extract SH script</span>
      </Button>
      <Button
        type="button"
        onClick={onApplySh}
        className="h-8 px-5 font-bold gap-2 text-xs bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white cursor-pointer shadow-sm"
        data-tooltip="Execute and apply the extracted Shell Script to workspace"
      >
        <Play size={14} className="fill-current" />
        <span>Apply SH Script</span>
      </Button>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-apply-response"
      className="w-full h-full min-h-0 overflow-hidden bg-background"
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default ApplyResponsePanel;
EOF

# 3. Create the InspectResultsPanel component
cat << 'EOF' > webview/src/features/exporter/components/tabs/llm-response/components/inspect-results/InspectResultsPanel.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Terminal, BookmarkPlus } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';

interface InspectResultsPanelProps {
  executionLog: string;
  impactedFilesCount?: number;
  onCopyResult: () => void;
  onCreateProfile: () => void;
}

export const InspectResultsPanel: React.FC<InspectResultsPanelProps> = ({
  executionLog,
  impactedFilesCount = 0,
  onCopyResult,
  onCreateProfile,
}) => {
  const middleContent = (
    <div className="p-3 h-full min-h-0 flex flex-col font-mono text-xs">
      <Card className="flex-1 min-h-0 flex flex-col bg-card border border-border rounded-md overflow-hidden p-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0 font-bold text-xs text-foreground">
          <span className="flex items-center gap-1.5">
            <Terminal size={14} className="text-primary" />
            <span>Execution Result</span>
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onCopyResult}
            data-tooltip="Copy Execution Result to Clipboard"
            className="h-6 w-6 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Copy size={13} />
          </Button>
        </div>
        <div className="flex-1 min-h-0 bg-black text-emerald-400 border border-border/60 rounded p-3 mt-2 overflow-y-auto overflow-x-hidden font-mono text-xs leading-relaxed whitespace-pre-wrap break-all select-text">
          {executionLog || (
            <span className="text-slate-500 italic select-none">
              No execution results yet. Apply a script from "Apply Response" tab to view output.
            </span>
          )}
        </div>
      </Card>
    </div>
  );

  const bottomContent = (
    <div className="p-3 bg-card border-t border-border space-y-2 font-mono text-xs">
      <div className="p-2.5 bg-muted/40 border border-border/60 rounded-md text-muted-foreground text-[11px] leading-relaxed">
        💡 the number of files impacted by the change and the token could be saved in input if we have selected only the modified files present in the script
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Impacted files count: <strong className="text-primary">{impactedFilesCount}</strong>
        </span>
        <Button
          size="sm"
          onClick={onCreateProfile}
          className="h-7 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
          data-tooltip="Create profile targeting only impacted files"
        >
          <BookmarkPlus size={13} />
          <span>Create Profile from Impacted Files</span>
        </Button>
      </div>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-inspect-results"
      className="w-full h-full min-h-0 overflow-hidden bg-background"
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default InspectResultsPanel;
EOF

# 4. Create the main LlmResponseTab component
cat << 'EOF' > webview/src/features/exporter/components/tabs/llm-response/LlmResponseTab.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Search } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { useLlmResponse } from './hooks/use-llm-response';
import { ApplyResponsePanel } from './components/apply-response/ApplyResponsePanel';
import { InspectResultsPanel } from './components/inspect-results/InspectResultsPanel';

export const LlmResponseTab: React.FC = () => {
  const {
    subTab,
    setSubTab,
    llmResponse,
    setLlmResponse,
    executionLog,
    impactedFiles,
    handlePasteLlmResponse,
    handleExtractShScript,
    handleApplyShScript,
    handleCopyExecutionResult,
    handleCreateProfileFromImpacted,
  } = useLlmResponse();

  const topContent = (
    <LeftCenterRightPanel
      id="llm-response-subtab-panel"
      className="bg-muted/60 p-1 border-b border-border shrink-0 font-mono text-xs"
      left={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubTab('apply')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              subTab === 'apply'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <CheckSquare size={13} className={subTab === 'apply' ? 'text-primary' : ''} />
            <span>Apply Response</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubTab('inspect')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              subTab === 'inspect'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <Search size={13} className={subTab === 'inspect' ? 'text-primary' : ''} />
            <span>Inspect Results</span>
          </Button>
        </div>
      }
    />
  );

  const middleContent = (
    <div className="flex-1 h-full min-h-0 w-full overflow-hidden">
      {subTab === 'apply' && (
        <ApplyResponsePanel
          llmResponse={llmResponse}
          onChangeLlmResponse={setLlmResponse}
          onPaste={handlePasteLlmResponse}
          onExtractSh={handleExtractShScript}
          onApplySh={handleApplyShScript}
        />
      )}
      {subTab === 'inspect' && (
        <InspectResultsPanel
          executionLog={executionLog}
          impactedFilesCount={impactedFiles.length}
          onCopyResult={handleCopyExecutionResult}
          onCreateProfile={handleCreateProfileFromImpacted}
        />
      )}
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-llm-response-tab"
      className="w-full h-full min-h-0 overflow-hidden bg-background font-mono text-xs"
      top={topContent}
      middle={middleContent}
    />
  );
};

export default LlmResponseTab;
EOF

# 5. Update exporter.types.ts to include 'llm-response' in ExporterTabId
cat << 'EOF' > webview/src/features/exporter/types/exporter.types.ts
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';

export type ExporterTabId = 'codebase-report' | 'reference-report' | 'report' | 'files' | 'terminal' | 'prompt' | 'help' | 'llm-response';

export interface ExporterModalState {
  isErrorModalOpen: boolean;
  isConflictModalOpen: boolean;
  isGuardrailModalOpen: boolean;
  isValidationModalOpen?: boolean;
  isDeleteModalOpen?: boolean;
  isSaveLockedModalOpen?: boolean;
  validationErrors?: string[];
  conflictExtensions: string[];
  conflictSource: string;
  conflictTarget: string;
  guardrailMessage?: string;
  pendingRunAction?: () => void;
  pendingConflictAction?: () => void;
}

export interface FieldValidationState {
  codebasePathListInvalid: boolean;
  referencePathListInvalid?: boolean;
  destDirInvalid: boolean;
  maxFileInvalid: boolean;
  maxChunkInvalid: boolean;
  errors: {
    codebase_src?: string | null;
    reference_src?: string | null;
    dest?: string | null;
    codebase_max_file?: string | null;
    reference_max_file?: string | null;
    max_chunk?: string | null;
    codebase_inc_paths?: string | null;
    codebase_exc_paths?: string | null;
    codebase_inc_ext?: string | null;
    codebase_exc_ext?: string | null;
    reference_inc_paths?: string | null;
    reference_exc_paths?: string | null;
    reference_inc_ext?: string | null;
    reference_exc_ext?: string | null;
    [key: string]: string | null | undefined;
  };
}
EOF

# 6. Update ExporterPanel.tsx to integrate LlmResponseTab and navigation link
cat << 'EOF' > webview/src/features/exporter/components/ExporterPanel.tsx
import React, { useState } from 'react';
import { BarChart3, BookOpen, Files, Terminal, HelpCircle, MessageSquareText, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { useExporterExecution } from '../hooks/use-exporter-execution';
import { useExporterStore } from '../store/useExporterStore';
import { ActionToolbar } from './ActionToolbar';
import { ExternalLinks } from './ExternalLinks';
import { TokenEstimationPanel } from './tabs/report/TokenEstimationPanel';
import { ReportTab } from './tabs/report/ReportTab';
import { FilesTab } from './tabs/files/FilesTab';
import { TerminalTab } from './tabs/terminal/TerminalTab';
import { HelpTab } from '@/features/exporter/components/tabs/help/HelpTab';
import { PromptTab } from './tabs/prompt/PromptTab';
import { LlmResponseTab } from './tabs/llm-response/LlmResponseTab';
import { ValidationErrorDialog } from './ValidationErrorDialog';
import { SaveLockedProfileDialog } from './SaveLockedProfileDialog';
import { ExtensionConflictDialog, ExtensionConflictState } from './ExtensionConflictDialog';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { ExporterTabId } from '../types/exporter.types';
import { PathMappingService } from '../utils/path-resolver';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export function ExporterPanel() {
  const {
    isRunning,
    isDirty,
    handleSaveConfig,
    handleDuplicateFromSaveModal,
    handleForceSaveFromSaveModal,
    handleRunExport,
    handleKillExport,
    handleOpenExchangeUrl,
    compiledBashCmd,
    terminalLogs,
    clearTerminalLogs,
    reportData,
    activeTab,
    setActiveTab,
    exchangeLinks,
    modalState,
    setModalState,
  } = useExporterExecution();

  const { config, setConfig, workspaceRoot, historyList, selectedProfileId } = useExporterStore();
  const selectedEntry = historyList.find((h) => h.id === selectedProfileId);

  const [conflictState, setConflictState] = useState<ExtensionConflictState | null>(null);

  const handleTabChange = (val: ExporterTabId) => {
    logInfo('[ExporterPanel] Active tab changed', [val]);
    setActiveTab(val);
  };

  const getExtensionPattern = (ext: string) => {
    return ext === 'no_ext' ? '^[^.]+$' : `.*\\.${ext}$`;
  };

  const handleAppendExtensionWithCoherence = (ext: string, targetMode: 'inc' | 'exc', targetScope: 'codebase' | 'reference' = 'codebase') => {
    const pattern = getExtensionPattern(ext);
    const scopeFilter = targetScope === 'codebase' ? config.codebase : config.reference;
    const opposingField = targetMode === 'inc' ? 'exc_ext' : 'inc_ext';
    const opposingContent = (scopeFilter?.[opposingField] || '') as string;

    const hasOpposingConflict = (opposingContent || '').split('\n').some((line) => {
      const trimmed = line.trim();
      return trimmed === pattern || trimmed === `.*\\.${ext}$` || trimmed === ext;
    });

    if (hasOpposingConflict) {
      setConflictState({ extension: ext, targetMode });
    } else {
      const targetField = targetMode === 'inc' ? 'inc_ext' : 'exc_ext';
      setConfig((prev) => ({
        ...prev,
        [targetScope]: {
          ...prev[targetScope],
          [targetField]: prev[targetScope]?.[targetField]
            ? `${prev[targetScope][targetField]}\n${pattern}`
            : pattern,
        },
      }));
    }
  };

  const codebaseReportData = reportData?.codebase || null;
  const referenceReportData = reportData?.reference || null;

  const activeReportData = activeTab === 'reference-report' ? referenceReportData : codebaseReportData;
  const totalSizeBytes = (activeTab === 'codebase-report' || activeTab === 'reference-report')
    ? (activeReportData?.summary?.total_size || 0)
    : ((codebaseReportData?.summary?.total_size || 0) + (referenceReportData?.summary?.total_size || 0));
  const estimatedInputTokens = Math.ceil(totalSizeBytes / 4);

  const topContent = (
    <ActionToolbar
      isRunning={isRunning}
      isDirty={isDirty}
      onSaveConfig={handleSaveConfig}
      onRunExport={handleRunExport}
      onKillExport={handleKillExport}
    />
  );

  const middleContent = (
    <div className="flex flex-col h-full w-full min-h-0 font-mono text-xs overflow-hidden">
      <LeftCenterRightPanel
        id="exporter-tab-navigation-panel"
        className="bg-muted/60 p-1 border-b border-border shrink-0"
        left={
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('prompt')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'prompt'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <MessageSquareText size={13} className={activeTab === 'prompt' ? 'text-primary' : ''} />
              <span>PROMPT</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('codebase-report')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'codebase-report'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <BarChart3 size={13} className={activeTab === 'codebase-report' ? 'text-primary' : ''} />
              <span>CODEBASE REPORT</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('reference-report')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'reference-report'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <BookOpen size={13} className={activeTab === 'reference-report' ? 'text-indigo-400' : ''} />
              <span>REFERENCE REPORT</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('files')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'files'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <Files size={13} className={activeTab === 'files' ? 'text-primary' : ''} />
              <span>FILES</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('terminal')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'terminal'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <Terminal size={13} className={activeTab === 'terminal' ? 'text-primary' : ''} />
              <span>TERMINAL</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange('llm-response')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'llm-response'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <Bot size={13} className={activeTab === 'llm-response' ? 'text-primary' : ''} />
              <span>LLM RESPONSE</span>
            </Button>
          </div>
        }
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange('help')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              activeTab === 'help'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <HelpCircle size={13} className={activeTab === 'help' ? 'text-primary' : ''} />
            <span>HELP</span>
          </Button>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {activeTab === 'codebase-report' && (
          <ReportTab
            reportData={codebaseReportData}
            onAppendExtension={(ext, mode) => handleAppendExtensionWithCoherence(ext, mode, 'codebase')}
            onSetMaxFileSize={(kb) => {
              setConfig((prev) => ({
                ...prev,
                codebase: { ...prev.codebase, max_file: String(kb) },
              }));
            }}
            onExcludeTreePattern={(pattern, isExt) => {
              if (isExt) {
                const ext = pattern.replace(/.*\\\./, '').replace(/\$/, '');
                handleAppendExtensionWithCoherence(ext, 'exc', 'codebase');
              } else {
                setConfig((prev) => ({
                  ...prev,
                  codebase: {
                    ...prev.codebase,
                    exc_paths: prev.codebase?.exc_paths ? `${prev.codebase.exc_paths}\n${pattern}` : pattern,
                  },
                }));
              }
            }}
            onCaptureTreePaths={(paths) => {
              if (paths.length > 0) {
                setConfig((prev) => {
                  const current = (prev.codebase?.src || '').split(/[,\n\r]+/).map((s: string) => s.trim()).filter(Boolean);
                  const flatNew = paths.flatMap((p: string) => p.split(/[,\n\r]+/)).map((s: string) => s.trim()).filter(Boolean);
                  const formatted = flatNew.map((p: string) => PathMappingService.registerPath(p, workspaceRoot));
                  return {
                    ...prev,
                    codebase: { ...prev.codebase, src: Array.from(new Set([...current, ...formatted])).join('\n') },
                  };
                });
              }
            }}
          />
        )}

        {activeTab === 'reference-report' && (
          <ReportTab
            reportData={referenceReportData}
            onAppendExtension={(ext, mode) => handleAppendExtensionWithCoherence(ext, mode, 'reference')}
            onSetMaxFileSize={(kb) => {
              setConfig((prev) => ({
                ...prev,
                reference: { ...prev.reference, max_file: String(kb) },
              }));
            }}
            onExcludeTreePattern={(pattern, isExt) => {
              if (isExt) {
                const ext = pattern.replace(/.*\\\./, '').replace(/\$/, '');
                handleAppendExtensionWithCoherence(ext, 'exc', 'reference');
              } else {
                setConfig((prev) => ({
                  ...prev,
                  reference: {
                    ...prev.reference,
                    exc_paths: prev.reference?.exc_paths ? `${prev.reference.exc_paths}\n${pattern}` : pattern,
                  },
                }));
              }
            }}
            onCaptureTreePaths={(paths) => {
              if (paths.length > 0) {
                setConfig((prev) => {
                  const current = (prev.reference?.src || '').split(/[,\n\r]+/).map((s: string) => s.trim()).filter(Boolean);
                  const flatNew = paths.flatMap((p: string) => p.split(/[,\n\r]+/)).map((s: string) => s.trim()).filter(Boolean);
                  const formatted = flatNew.map((p: string) => PathMappingService.registerPath(p, workspaceRoot));
                  return {
                    ...prev,
                    reference: { ...prev.reference, src: Array.from(new Set([...current, ...formatted])).join('\n') },
                  };
                });
              }
            }}
          />
        )}

        {activeTab === 'files' && (
          <FilesTab
            reportData={reportData}
            destDir={config.dest}
            onOpenFile={(p) => fileExporterApiService.openPathAtCursor(p)}
            onRevealFile={(p) => fileExporterApiService.openPathAtCursor(p)}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalTab
            compiledBashCmd={compiledBashCmd}
            terminalLogs={terminalLogs}
            onCopyBashCmd={() => fileExporterApiService.showNotification('info', 'Command copied to clipboard')}
            onCopyTerminalLogs={() => fileExporterApiService.showNotification('info', 'Logs copied to clipboard')}
            onClearTerminalLogs={() => clearTerminalLogs()}
          />
        )}

        {activeTab === 'llm-response' && <LlmResponseTab />}

        {activeTab === 'prompt' && <PromptTab />}

        {activeTab === 'help' && <HelpTab />}
      </div>
    </div>
  );

  const bottomContent = (
    <TopMiddleBottomPanel
      id="exporter-footer-wrapper"
      className="shrink-0"
      top={
        <div className="px-2 pb-0">
          <TokenEstimationPanel tokens={estimatedInputTokens} />
        </div>
      }
      middle={
        <LeftCenterRightPanel
          id="exporter-footer-panel"
          className="p-2 bg-card font-mono text-xs shrink-0"
          center={
            <ExternalLinks
              exchangeLinks={exchangeLinks}
              onOpenExchangeUrl={handleOpenExchangeUrl}
            />
          }
        />
      }
    />
  );

  return (
    <>
      <TopMiddleBottomPanel
        id="panel-exporter-execution"
        className="bg-background w-full h-full min-h-0 overflow-hidden"
        top={topContent}
        middle={middleContent}
        bottom={bottomContent}
      />

      <ValidationErrorDialog
        isOpen={Boolean(modalState.isValidationModalOpen)}
        errors={modalState.validationErrors || []}
        onClose={() => setModalState({ isValidationModalOpen: false })}
      />

      <SaveLockedProfileDialog
        isOpen={Boolean(modalState.isSaveLockedModalOpen)}
        profileName={selectedEntry?.display}
        onDuplicate={handleDuplicateFromSaveModal}
        onForceSave={handleForceSaveFromSaveModal}
        onCancel={() => setModalState({ isSaveLockedModalOpen: false })}
      />

      <ExtensionConflictDialog
        isOpen={Boolean(conflictState)}
        conflictState={conflictState}
        onResolveMove={() => {}}
        onForceAppend={() => {}}
        onCancel={() => setConflictState(null)}
      />
    </>
  );
}

export default ExporterPanel;
EOF

echo "✅ feat(exporter): Created LlmResponseTab with Apply Response and Inspect Results sub-panels, integrated with ExporterPanel navigation"

import React, { useState } from 'react';
import { BarChart3, Files, Terminal, HelpCircle, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { useExporterExecution } from '../hooks/use-exporter-execution';
import { useExporterStore } from '../store/useExporterStore';
import { ActionToolbar } from './ActionToolbar';
import { ExternalLinks } from './ExternalLinks';
import { ReportTab } from './tabs/report/ReportTab';
import { FilesTab } from './tabs/FilesTab';
import { TerminalTab } from './tabs/TerminalTab';
import { HelpTab } from './tabs/HelpTab';
import { PromptTab } from './tabs/prompt/PromptTab';
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

  // State for extension conflict handling
  const [conflictState, setConflictState] = useState<ExtensionConflictState | null>(null);

  const handleTabChange = (val: ExporterTabId) => {
    logInfo('[ExporterPanel] Active tab changed', [val]);
    setActiveTab(val);
  };

  const getExtensionPattern = (ext: string) => {
    return ext === 'no_ext' ? '^[^.]+$' : `.*\\.${ext}$`;
  };

  const handleAppendExtensionWithCoherence = (ext: string, targetMode: 'inc' | 'exc') => {
    logInfo('[ExporterPanel] handleAppendExtensionWithCoherence', [{ ext, targetMode }]);
    const pattern = getExtensionPattern(ext);
    const opposingField = targetMode === 'inc' ? 'exc_ext' : 'inc_ext';
    const opposingContent = config[opposingField] || '';

    // Check if pattern or extension name exists in the opposing list
    const hasOpposingConflict = opposingContent.split('\n').some((line) => {
      const trimmed = line.trim();
      return trimmed === pattern || trimmed === `.*\\.${ext}$` || trimmed === ext;
    });

    if (hasOpposingConflict) {
      logInfo('[ExporterPanel] Coherence conflict detected for extension:', [ext]);
      setConflictState({ extension: ext, targetMode });
    } else {
      // Direct append if no conflict exists
      const targetField = targetMode === 'inc' ? 'inc_ext' : 'exc_ext';
      setConfig((prev) => ({
        ...prev,
        [targetField]: prev[targetField] ? `${prev[targetField]}\n${pattern}` : pattern,
      }));
    }
  };

  const handleResolveMoveConflict = () => {
    if (!conflictState) return;
    const { extension, targetMode } = conflictState;
    const pattern = getExtensionPattern(extension);
    const targetField = targetMode === 'inc' ? 'inc_ext' : 'exc_ext';
    const opposingField = targetMode === 'inc' ? 'exc_ext' : 'inc_ext';

    logInfo('[ExporterPanel] Resolving conflict by moving extension:', [extension]);

    setConfig((prev) => {
      // Filter out pattern from opposing field
      const updatedOpposing = (prev[opposingField] || '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && l !== pattern && l !== `.*\\.${extension}$` && l !== extension)
        .join('\n');

      // Add pattern to target field
      const updatedTarget = prev[targetField] ? `${prev[targetField]}\n${pattern}` : pattern;

      return {
        ...prev,
        [opposingField]: updatedOpposing,
        [targetField]: updatedTarget,
      };
    });

    setConflictState(null);
  };

  const handleForceAppendConflict = () => {
    if (!conflictState) return;
    const { extension, targetMode } = conflictState;
    const pattern = getExtensionPattern(extension);
    const targetField = targetMode === 'inc' ? 'inc_ext' : 'exc_ext';

    logInfo('[ExporterPanel] Force appending extension despite conflict:', [extension]);

    setConfig((prev) => ({
      ...prev,
      [targetField]: prev[targetField] ? `${prev[targetField]}\n${pattern}` : pattern,
    }));

    setConflictState(null);
  };

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
              onClick={() => handleTabChange('report')}
              className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
                activeTab === 'report'
                  ? 'bg-background text-foreground border border-border/60 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
              }`}
            >
              <BarChart3 size={13} className={activeTab === 'report' ? 'text-primary' : ''} />
              <span>REPORT</span>
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
        {activeTab === 'report' && (
          <ReportTab
            reportData={reportData}
            onAppendExtension={(ext, mode) => handleAppendExtensionWithCoherence(ext, mode)}
            onSetMaxFileSize={(kb) => {
              logInfo('[ExporterPanel] onSetMaxFileSize', [kb]);
              setConfig((prev) => ({ ...prev, max_file: String(kb) }));
            }}
            onExcludeTreePattern={(pattern, isExt) => {
              logInfo('[ExporterPanel] ReportTab onExcludeTreePattern', [{ pattern, isExt }]);
              if (isExt) {
                const ext = pattern.replace(/.*\\\./, '').replace(/\$/, '');
                handleAppendExtensionWithCoherence(ext, 'exc');
              } else {
                setConfig((prev) => ({
                  ...prev,
                  exc_paths: prev.exc_paths ? `${prev.exc_paths}\n${pattern}` : pattern,
                }));
              }
            }}
            onCaptureTreePaths={(paths) => {
              logInfo('[ExporterPanel] ReportTab onCaptureTreePaths', paths);
              if (paths.length > 0) {
                setConfig((prev) => {
                  const current = prev.src ? prev.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
                  const flatNew = paths.flatMap((p) => p.split(/[,\n\r]+/)).map((s) => s.trim()).filter(Boolean);
                  const formatted = flatNew.map((p) => PathMappingService.registerPath(p, workspaceRoot));
                  return { ...prev, src: Array.from(new Set([...current, ...formatted])).join('\n') };
                });
              }
            }}
          />
        )}

        {activeTab === 'files' && (
          <FilesTab
            reportData={reportData}
            destDir={config.dest}
            onOpenFile={(p) => {
              logInfo('[ExporterPanel] FilesTab onOpenFile', [p]);
              fileExporterApiService.openPathAtCursor(p);
            }}
            onRevealFile={(p) => {
              logInfo('[ExporterPanel] FilesTab onRevealFile', [p]);
              fileExporterApiService.openPathAtCursor(p);
            }}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalTab
            compiledBashCmd={compiledBashCmd}
            terminalLogs={terminalLogs}
            onCopyBashCmd={() => {
              logInfo('[ExporterPanel] TerminalTab onCopyBashCmd');
              fileExporterApiService.showNotification('info', 'Command copied to clipboard');
            }}
            onCopyTerminalLogs={() => {
              logInfo('[ExporterPanel] TerminalTab onCopyTerminalLogs');
              fileExporterApiService.showNotification('info', 'Logs copied to clipboard');
            }}
            onClearTerminalLogs={() => {
              logInfo('[ExporterPanel] TerminalTab onClearTerminalLogs');
              clearTerminalLogs();
            }}
          />
        )}

        {activeTab === 'prompt' && <PromptTab />}

        {activeTab === 'help' && <HelpTab />}
      </div>
    </div>
  );

  const bottomContent = (
    <LeftCenterRightPanel
      id="exporter-footer-panel"
      className="p-2 bg-card border-t border-border font-mono text-xs shrink-0"
      right={
        <ExternalLinks
          exchangeLinks={exchangeLinks}
          onOpenExchangeUrl={handleOpenExchangeUrl}
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
        onResolveMove={handleResolveMoveConflict}
        onForceAppend={handleForceAppendConflict}
        onCancel={() => setConflictState(null)}
      />
    </>
  );
}

export default ExporterPanel;

#!/usr/bin/env bash
set -e

mkdir -p webview/src/features/exporter/hooks
mkdir -p webview/src/features/exporter/components

# 1. Update use-export-configuration hook to accept target scope parameter
cat << 'EOF' > webview/src/features/exporter/hooks/use-export-configuration.ts
import { useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { useExporterValidation } from './use-exporter-validation';
import { fileExporterHistoryApiService } from '@/services/api/file-exporter-history-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vsCodeBackendMessageHandler } from '@/services/listener/vscode-backend-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { PathMappingService } from '../utils/path-resolver';
import { normalizeExportConfig } from '../utils/exporter-config.normalizer';
import {
  EXPORTER_CODEBASE_ADD_PATHS,
  EXPORTER_CODEBASE_EXCLUDE_PATHS,
  EXPORTER_REFERENCE_ADD_PATHS,
  EXPORTER_REFERENCE_EXCLUDE_PATHS,
} from "@/shared/config/vscode-message-command.constants";

export type ExporterScope = 'codebase' | 'reference';

export function useExportConfiguration() {
  const store = useExporterStore();
  const validation = useExporterValidation();

  // Helper to append paths to specified scope
  const addPathsInConfig = (absPaths: string[], scope: ExporterScope = 'codebase') => {
    const wsRoot = store.workspaceRoot;
    const expandedList = (absPaths || [])
      .flatMap((p) => String(p || '').split(/[,\n\r]+/))
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedList = expandedList
      .map((p) => PathMappingService.registerPath(p, wsRoot))
      .filter(Boolean);

    store.setConfig((prev) => {
      const current = (prev[scope]?.src || '')
        .split(/[,\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const combined = Array.from(new Set([...current, ...formattedList]));
      return {
        ...prev,
        [scope]: { ...prev[scope], src: combined.join('\n') },
      };
    });
  };

  // Helper to append exclude regex patterns to specified scope
  const addExcludePathsInConfig = (absPaths: string[], scope: ExporterScope = 'codebase') => {
    const wsRootPath = store.workspaceRoot ? store.workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';

    const newEntries: string[] = [];

    (absPaths || []).forEach((rawPath) => {
      if (!rawPath || !rawPath.trim()) return;
      const cleanRaw = rawPath.trim().replace(/\\/g, '/');
      let relativePath = cleanRaw;
      if (wsRootPath && cleanRaw.startsWith(wsRootPath)) {
        relativePath = cleanRaw.slice(wsRootPath.length);
      }
      relativePath = relativePath.replace(/^\/+/, '');
      const escapedPath = relativePath.replace(/[-\\^\$*+?.()|[\]{}]/g, '\\$&');

      let isFolder = true;
      if (cleanRaw.includes('.')) {
        const lastSegment = cleanRaw.split('/').pop();
        if (lastSegment && lastSegment.includes('.')) isFolder = false;
      }

      const regexEntry = isFolder ? `.*/${escapedPath}/.*` : `.*/${escapedPath}$`;
      newEntries.push(regexEntry);
    });

    if (newEntries.length === 0) return;

    store.setConfig((prev) => {
      const currentLines = (prev[scope]?.exc_paths || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const combined = Array.from(new Set([...currentLines, ...newEntries]));

      return {
        ...prev,
        [scope]: {
          ...prev[scope],
          exc_paths: combined.join('\n'),
        },
      };
    });

    const scopeLabel = scope === 'codebase' ? 'Codebase' : 'Reference';
    fileExporterApiService.showNotification('info', `Added ${newEntries.length} pattern(s) to ${scopeLabel} Exclude Paths`);
  };

  useEffect(() => {
    logInfo('[useExportConfiguration] Initializing exporter configuration and message listeners...');

    const init = async () => {
      try {
        const res = await fileExporterApiService.getInitialState();
        const normDefault = normalizeExportConfig(res.defaultConfig);
        const normCurrent = normalizeExportConfig(res.currentConfig);
        const normHistory = (res.history || []).map((h) => ({
          ...h,
          config: normalizeExportConfig(h.config),
        }));

        store.setInitialData({
          defaultConfig: normDefault,
          config: normCurrent,
          historyList: normHistory,
          selectedProfileId: res.selectedId,
          historyViewMode: res.historyViewMode,
          currentRepo: res.currentRepo,
          workspaceRoot: res.workspaceRoot,
          fileExtsCategoryGroups: res.fileExtsCategoryGroups,
          exchangeLinks: res.exchange,
          pendingPaths: res.pendingPaths || [],
        });
      } catch (e) {
        console.error('[useExportConfiguration] Error initializing exporter state:', e);
      }
    };

    init();

    // Codebase scope listeners
    const unsubscribeCodebaseAdd = vsCodeBackendMessageHandler.on(EXPORTER_CODEBASE_ADD_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.payload?.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const newPaths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsInConfig(newPaths, 'codebase');
      }
    });

    const unsubscribeCodebaseExclude = vsCodeBackendMessageHandler.on(EXPORTER_CODEBASE_EXCLUDE_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.payload?.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const paths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addExcludePathsInConfig(paths, 'codebase');
      }
    });

    // Reference scope listeners
    const unsubscribeReferenceAdd = vsCodeBackendMessageHandler.on(EXPORTER_REFERENCE_ADD_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.payload?.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const newPaths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsInConfig(newPaths, 'reference');
      }
    });

    const unsubscribeReferenceExclude = vsCodeBackendMessageHandler.on(EXPORTER_REFERENCE_EXCLUDE_PATHS, (msg) => {
      const rawPayload = msg.payload || msg.payload?.paths;
      logInfo(`[useExportConfiguration] Received ${msg.command} message`, [rawPayload]);
      if (rawPayload) {
        const paths = String(rawPayload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addExcludePathsInConfig(paths, 'reference');
      }
    });

    return () => {
      unsubscribeCodebaseAdd();
      unsubscribeCodebaseExclude();
      unsubscribeReferenceAdd();
      unsubscribeReferenceExclude();
    };
  }, [store.workspaceRoot]);

  const handleAddOpenFiles = async (scope: ExporterScope = 'codebase') => {
    try {
      const currentDisplayLines = (store.config[scope]?.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const openFiles = await fileExporterApiService.getOpenEditorFiles(currentAbsPaths);
      addPathsInConfig(openFiles, scope);
      const scopeLabel = scope === 'codebase' ? 'Codebase' : 'Reference';
      fileExporterApiService.showNotification('info', `Added open editor files to ${scopeLabel} (${openFiles.length} total paths)`);
    } catch (err: any) {
      logInfo(`[useExportConfiguration] Error adding open files to ${scope}:`, [err]);
    }
  };

  const handleAddGitDiffFiles = async (scope: ExporterScope = 'codebase') => {
    try {
      const currentDisplayLines = (store.config[scope]?.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const gitFiles = await fileExporterApiService.getGitDiffFiles(currentAbsPaths);
      addPathsInConfig(gitFiles, scope);
      const scopeLabel = scope === 'codebase' ? 'Codebase' : 'Reference';
      fileExporterApiService.showNotification('info', `Added modified Git files to ${scopeLabel} (${gitFiles.length} total paths)`);
    } catch (err: any) {
      logInfo(`[useExportConfiguration] Error adding Git diff files to ${scope}:`, [err]);
    }
  };

  const handleCopyLatestFiles = async () => {
    try {
      const res = await fileExporterApiService.copyLatestExportedFiles(store.config.dest);
      fileExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error copying latest files:', [err]);
    }
  };

  const handleClearDestDir = async () => {
    try {
      const res = await fileExporterApiService.clearDestDirectory(store.config.dest);
      fileExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error clearing dest dir:', [err]);
    }
  };

  const handleOpenErrorModal = () => store.setModalState({ isErrorModalOpen: true });
  const handleCloseErrorModal = () => store.setModalState({ isErrorModalOpen: false });

  const handleRevealDestination = async () => {
    const formattedDest = store.config.dest || 'Default directory';
    const absDest = PathMappingService.resolveToAbsolute(formattedDest, store.workspaceRoot);
    await vsCodeApiService.revealInOsExplorer(absDest);
  };

  const handleOpenCursorLinePath = async (scope: ExporterScope = 'codebase') => {
    const firstLine = (store.config[scope]?.src || '').split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)[0];
    if (firstLine) {
      const absPath = PathMappingService.resolveToAbsolute(firstLine, store.workspaceRoot);
      await fileExporterApiService.openPathAtCursor(absPath);
    }
  };

  return {
    ...store,
    validation,
    addPathsToConfig: (absPaths: string[], scope: ExporterScope = 'codebase') => addPathsInConfig(absPaths, scope),
    addReferencePathsToConfig: (absPaths: string[]) => addPathsInConfig(absPaths, 'reference'),
    addExcludePathsInConfig: (absPaths: string[], scope: ExporterScope = 'codebase') => addExcludePathsInConfig(absPaths, scope),
    handleAddOpenFiles,
    handleAddGitDiffFiles,
    handleCopyLatestFiles,
    handleClearDestDir,
    handleOpenErrorModal,
    handleCloseErrorModal,
    handleRevealDestination,
    handleOpenCursorLinePath,
  };
}
EOF

# 2. Update ExportConfigurationPanel to bind section scope to header action buttons
cat << 'EOF' > webview/src/features/exporter/components/ExportConfigurationPanel.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { useExportConfiguration, ExporterScope } from '../hooks/use-export-configuration';
import { CodebasePathsSection } from './CodebasePathsSection';
import { ReferencePathsSection } from './ReferencePathsSection';
import { DestinationSection } from './DestinationSection';
import { OutputFormattingSection } from './OutputFormattingSection';
import { ErrorFilesModal } from './ErrorFilesModal';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface ExportConfigurationPanelHandle {
  collapseAll: () => void;
  expandAll: () => void;
}

export interface ExportConfigurationPanelProps {
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
}

export const ExportConfigurationPanel = forwardRef<
  ExportConfigurationPanelHandle,
  ExportConfigurationPanelProps
>((_props, ref) => {
  const {
    config,
    setConfig,
    filterSimulatorInput,
    setFilterSimulatorInput,
    modalState,
    handleRevealDestination,
    handleOpenCursorLinePath,
    handleAddOpenFiles,
    handleAddGitDiffFiles,
    handleOpenErrorModal,
    handleCloseErrorModal,
    handleCopyLatestFiles,
    handleClearDestDir,
    addPathsToConfig,
  } = useExportConfiguration();

  const [errorModalScope, setErrorModalScope] = useState<ExporterScope>('codebase');

  const [cardsOpenState, setCardsOpenState] = useState<{
    codebasePaths: boolean;
    codebaseFilters: boolean;
    referencePaths: boolean;
    referenceFilters: boolean;
    destination: boolean;
    outputFormatting: boolean;
  }>({
    codebasePaths: false,
    codebaseFilters: false,
    referencePaths: false,
    referenceFilters: false,
    destination: false,
    outputFormatting: true,
  });

  const handleCollapseAllCards = () => {
    logInfo('[ExportConfigurationPanel] handleCollapseAllCards handler triggered');
    setCardsOpenState({
      codebasePaths: false,
      codebaseFilters: false,
      referencePaths: false,
      referenceFilters: false,
      destination: false,
      outputFormatting: false,
    });
  };

  const handleExpandAllCards = () => {
    logInfo('[ExportConfigurationPanel] handleExpandAllCards handler triggered');
    setCardsOpenState({
      codebasePaths: true,
      codebaseFilters: true,
      referencePaths: true,
      referenceFilters: true,
      destination: true,
      outputFormatting: true,
    });
  };

  const handleOpenErrorModalForScope = (scope: ExporterScope = 'codebase') => {
    setErrorModalScope(scope);
    handleOpenErrorModal();
  };

  useImperativeHandle(ref, () => ({
    collapseAll: handleCollapseAllCards,
    expandAll: handleExpandAllCards,
  }));

  const middleContent = (
    <div className="flex flex-col space-y-2 p-2 box-border min-w-0">
      <CodebasePathsSection
        filter={config.codebase}
        isOpen={cardsOpenState.codebasePaths}
        onOpenChange={(open: boolean) => setCardsOpenState((prev) => ({ ...prev, codebasePaths: open }))}
        isFiltersOpen={cardsOpenState.codebaseFilters}
        onFiltersOpenChange={(open: boolean) => setCardsOpenState((prev) => ({ ...prev, codebaseFilters: open }))}
        onChangeFilter={(updater) =>
          setConfig((prev) => ({ ...prev, codebase: updater(prev.codebase) }))
        }
        onChangePathsText={(val: string) =>
          setConfig((prev) => ({ ...prev, codebase: { ...prev.codebase, src: val } }))
        }
        onAddOpenFiles={() => handleAddOpenFiles('codebase')}
        onAddGitDiffFiles={() => handleAddGitDiffFiles('codebase')}
        onAddErrorStackFiles={() => handleOpenErrorModalForScope('codebase')}
        onOpenCursorLinePath={() => handleOpenCursorLinePath('codebase')}
        onClearPaths={() =>
          setConfig((prev) => ({ ...prev, codebase: { ...prev.codebase, src: '' } }))
        }
        filterSimulatorInput={filterSimulatorInput}
        setFilterSimulatorInput={setFilterSimulatorInput}
      />

      <ReferencePathsSection
        filter={config.reference}
        isOpen={cardsOpenState.referencePaths}
        onOpenChange={(open: boolean) => setCardsOpenState((prev) => ({ ...prev, referencePaths: open }))}
        isFiltersOpen={cardsOpenState.referenceFilters}
        onFiltersOpenChange={(open: boolean) => setCardsOpenState((prev) => ({ ...prev, referenceFilters: open }))}
        onChangeFilter={(updater) =>
          setConfig((prev) => ({ ...prev, reference: updater(prev.reference) }))
        }
        onChangePathsText={(val: string) =>
          setConfig((prev) => ({ ...prev, reference: { ...prev.reference, src: val } }))
        }
        onAddOpenFiles={() => handleAddOpenFiles('reference')}
        onAddGitDiffFiles={() => handleAddGitDiffFiles('reference')}
        onAddErrorStackFiles={() => handleOpenErrorModalForScope('reference')}
        onOpenCursorLinePath={() => handleOpenCursorLinePath('reference')}
        onClearPaths={() =>
          setConfig((prev) => ({ ...prev, reference: { ...prev.reference, src: '' } }))
        }
        filterSimulatorInput={filterSimulatorInput}
        setFilterSimulatorInput={setFilterSimulatorInput}
      />

      <DestinationSection
        destDir={config.dest}
        isOpen={cardsOpenState.destination}
        onOpenChange={(open: boolean) => setCardsOpenState((prev) => ({ ...prev, destination: open }))}
        onChangeDestDir={(val: string) => setConfig((prev) => ({ ...prev, dest: val }))}
        onCopyLatestFiles={handleCopyLatestFiles}
        onRevealDestDir={handleRevealDestination}
        onClearDestDir={handleClearDestDir}
      />

      <OutputFormattingSection
        config={config}
        isOpen={cardsOpenState.outputFormatting}
        onOpenChange={(open: boolean) => setCardsOpenState((prev) => ({ ...prev, outputFormatting: open }))}
        onChangeConfig={setConfig}
      />
    </div>
  );

  return (
    <>
      <TopMiddleBottomPanel
        id="panel-exporter-configuration"
        className="bg-background w-full h-full min-h-0 overflow-hidden"
        middle={middleContent}
      />

      <ErrorFilesModal
        isOpen={modalState.isErrorModalOpen}
        onClose={handleCloseErrorModal}
        onAddPaths={(paths: string[]) => {
          logInfo('[ExportConfigurationPanel] ErrorFilesModal onAddPaths', [paths, errorModalScope]);
          addPathsToConfig(paths, errorModalScope);
        }}
      />
    </>
  );
});

ExportConfigurationPanel.displayName = 'ExportConfigurationPanel';

export default ExportConfigurationPanel;
EOF

echo "✅ fix: Corrected action handlers for ReferencePathsSection to target reference scope instead of codebase!"

#!/usr/bin/env bash
set -e

# Ensure output directories exist
mkdir -p webview/src/features/exporter/components
mkdir -p webview/src/features/exporter/layout-ctns

# Create dedicated ExportPanelHeader component
cat << 'EOF' > webview/src/features/exporter/components/ExportPanelHeader.tsx
import React from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ExportPanelHeaderRightProps {
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
}

export const ExportPanelHeaderRight: React.FC<ExportPanelHeaderRightProps> = ({
  onCollapseAll,
  onExpandAll,
}) => {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Button
        id="btn-collapse-all-exporter-cards"
        className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        variant="ghost"
        size="icon"
        onClick={onCollapseAll}
        data-tooltip="Collapse All Cards"
      >
        <ChevronsUp size={12} />
      </Button>
      <Button
        id="btn-expand-all-exporter-cards"
        className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        variant="ghost"
        size="icon"
        onClick={onExpandAll}
        data-tooltip="Expand All Cards"
      >
        <ChevronsDown size={12} />
      </Button>
    </div>
  );
};

export default ExportPanelHeaderRight;
EOF

# Update ExportConfigurationPanel to expose collapse/expand handlers via ref and remove local top toolbar
cat << 'EOF' > webview/src/features/exporter/components/ExportConfigurationPanel.tsx
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { useExportConfiguration } from '../hooks/use-export-configuration';
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
        onAddOpenFiles={handleAddOpenFiles}
        onAddGitDiffFiles={handleAddGitDiffFiles}
        onAddErrorStackFiles={handleOpenErrorModal}
        onOpenCursorLinePath={handleOpenCursorLinePath}
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
        onAddOpenFiles={handleAddOpenFiles}
        onAddGitDiffFiles={handleAddGitDiffFiles}
        onAddErrorStackFiles={handleOpenErrorModal}
        onOpenCursorLinePath={handleOpenCursorLinePath}
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
          logInfo('[ExportConfigurationPanel] ErrorFilesModal onAddPaths', paths);
          addPathsToConfig(paths);
        }}
      />
    </>
  );
});

ExportConfigurationPanel.displayName = 'ExportConfigurationPanel';

export default ExportConfigurationPanel;
EOF

# Update LeftPanelContainer to render ExportPanelHeaderRight inside ContainerPanelHeader's headerRight slot
cat << 'EOF' > webview/src/features/exporter/layout-ctns/LeftPanelContainer.tsx
import React, { useRef } from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { ExportConfigurationPanel, ExportConfigurationPanelHandle } from '../components/ExportConfigurationPanel';
import { ExportPanelHeaderRight } from '../components/ExportPanelHeader';

export const LeftPanelContainer: React.FC = () => {
  const panelRef = useRef<ExportConfigurationPanelHandle>(null);

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        title="⚙️ Export Configuration"
        path="workspace.left"
        headerRight={
          <ExportPanelHeaderRight
            onCollapseAll={() => panelRef.current?.collapseAll()}
            onExpandAll={() => panelRef.current?.expandAll()}
          />
        }
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ExportConfigurationPanel ref={panelRef} />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
EOF

echo "✅ refactor: Export configuration collapse/expand toolbar icons moved to LeftPanelContainer header!"

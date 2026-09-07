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

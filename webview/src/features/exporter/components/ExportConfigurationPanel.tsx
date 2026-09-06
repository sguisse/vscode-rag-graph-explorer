import React, { useState } from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { useExportConfiguration } from '../hooks/use-export-configuration';
import { CodebasePathsSection } from './CodebasePathsSection';
import { ReferencePathsSection } from './ReferencePathsSection';
import { DestinationSection } from './DestinationSection';
import { OutputFormattingSection } from './OutputFormattingSection';
import { ErrorFilesModal } from './ErrorFilesModal';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export const ExportConfigurationPanel: React.FC = () => {
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
    codebasePaths: true,
    codebaseFilters: true,
    referencePaths: true,
    referenceFilters: true,
    destination: true,
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

  const topToolbar = (
    <div className="flex justify-between items-center px-2 py-1 bg-muted/20 border-b border-border/50 font-mono text-xs w-full shrink-0">
      <div className="flex items-center gap-1.5 font-bold text-foreground truncate">
        <span>⚙️ Export Configuration</span>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          id="btn-collapse-all-exporter-cards"
          className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors"
          variant="ghost"
          size="icon"
          onClick={handleCollapseAllCards}
          data-tooltip="Collapse All Cards"
        >
          <ChevronsUp size={12} />
        </Button>
        <Button
          id="btn-expand-all-exporter-cards"
          className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors"
          variant="ghost"
          size="icon"
          onClick={handleExpandAllCards}
          data-tooltip="Expand All Cards"
        >
          <ChevronsDown size={12} />
        </Button>
      </div>
    </div>
  );

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
        top={topToolbar}
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
};

export default ExportConfigurationPanel;

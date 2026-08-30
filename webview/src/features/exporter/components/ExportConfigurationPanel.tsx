import React from 'react';
import { useExportConfiguration } from '../hooks/use-export-configuration';
import { HistoryBar } from './HistoryBar';
import { SourcePathsSection } from './SourcePathsSection';
import { FiltersSection } from './FiltersSection';
import { DestinationSection } from './DestinationSection';
import { OutputFormattingSection } from './OutputFormattingSection';

export const ExportConfigurationPanel: React.FC = () => {
  const {
    historyList,
    selectedProfileId,
    setSelectedProfileId,
    config,
    setConfig,
    filterSimulatorInput,
    setFilterSimulatorInput,
    handleFreezeToggle,
    handleResetConfig,
    handleRenameProfile,
    handleDuplicateProfile,
    handleAddProfile,
    handleClearHistory,
    handleOpenHistoryFile,
    handleRevealDestination,
    handleOpenCursorLinePath,
  } = useExportConfiguration();

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto space-y-1 p-1">
      {/* 1. Configuration History */}
      <HistoryBar
        historyList={historyList}
        selectedProfileId={selectedProfileId}
        onSelectProfile={setSelectedProfileId}
        onFreezeToggle={handleFreezeToggle}
        onResetConfig={handleResetConfig}
        onRenameProfile={handleRenameProfile}
        onDuplicateProfile={handleDuplicateProfile}
        onAddProfile={handleAddProfile}
        onOpenFile={handleOpenHistoryFile}
        onRevealFolder={handleRevealDestination}
        onClearHistory={handleClearHistory}
      />

      {/* 2. Source Paths */}
      <SourcePathsSection
        pathsText={config.src}
        onChangePathsText={(val) => setConfig((prev) => ({ ...prev, src: val }))}
        onAddOpenFiles={() => {}}
        onAddGitDiffFiles={() => {}}
        onAddErrorStackFiles={() => {}}
        onOpenCursorLinePath={handleOpenCursorLinePath}
        onClearPaths={() => setConfig((prev) => ({ ...prev, src: '' }))}
      />

      {/* 3. Filters & Scope Constraints */}
      <FiltersSection
        config={config}
        onChangeConfig={setConfig}
        filterSimulatorInput={filterSimulatorInput}
        setFilterSimulatorInput={setFilterSimulatorInput}
      />

      {/* 4. Destination Directory */}
      <DestinationSection
        destDir={config.dest}
        onChangeDestDir={(val) => setConfig((prev) => ({ ...prev, dest: val }))}
        onCopyLatestFiles={() => {}}
        onRevealDestDir={handleRevealDestination}
        onClearDestDir={() => {}}
      />

      {/* 5. Output Formatting Rules */}
      <OutputFormattingSection
        config={config}
        onChangeConfig={setConfig}
      />
    </div>
  );
};

export default ExportConfigurationPanel;

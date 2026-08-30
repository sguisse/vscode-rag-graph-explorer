import React from 'react';
import { useExportConfiguration } from '../hooks/use-export-configuration';
import { SourcePathsSection } from './SourcePathsSection';
import { FiltersSection } from './FiltersSection';
import { DestinationSection } from './DestinationSection';
import { OutputFormattingSection } from './OutputFormattingSection';

export const ExportConfigurationPanel: React.FC = () => {
  const {
    config,
    setConfig,
    filterSimulatorInput,
    setFilterSimulatorInput,
    handleRevealDestination,
    handleOpenCursorLinePath,
  } = useExportConfiguration();

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto space-y-2 p-2 box-border min-w-0">
      {/* 1. Source Paths */}
      <SourcePathsSection
        pathsText={config.src}
        onChangePathsText={(val) => setConfig((prev) => ({ ...prev, src: val }))}
        onAddOpenFiles={() => {}}
        onAddGitDiffFiles={() => {}}
        onAddErrorStackFiles={() => {}}
        onOpenCursorLinePath={handleOpenCursorLinePath}
        onClearPaths={() => setConfig((prev) => ({ ...prev, src: '' }))}
      />

      {/* 2. Filters & Scope Constraints */}
      <FiltersSection
        config={config}
        onChangeConfig={setConfig}
        filterSimulatorInput={filterSimulatorInput}
        setFilterSimulatorInput={setFilterSimulatorInput}
      />

      {/* 3. Destination Directory */}
      <DestinationSection
        destDir={config.dest}
        onChangeDestDir={(val) => setConfig((prev) => ({ ...prev, dest: val }))}
        onCopyLatestFiles={() => {}}
        onRevealDestDir={handleRevealDestination}
        onClearDestDir={() => {}}
      />

      {/* 4. Output Formatting Rules */}
      <OutputFormattingSection
        config={config}
        onChangeConfig={setConfig}
      />
    </div>
  );
};

export default ExportConfigurationPanel;

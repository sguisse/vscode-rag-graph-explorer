import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { HistoryBar } from '../components/HistoryBar';
import { useExportConfiguration } from '../hooks/use-export-configuration';

export const TopPanelContainer: React.FC = () => {
  const {
    historyList,
    selectedProfileId,
    handleSelectProfile,
    handleFreezeToggle,
    handleResetConfig,
    handleRenameProfile,
    handleDuplicateProfile,
    handleAddProfile,
    handleClearHistory,
    handleOpenHistoryFile,
    handleRevealHistoryFolder,
  } = useExportConfiguration();

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="🕒 Configuration History" path="workspace.top" />
      <div className="flex-1 min-h-0 overflow-y-auto p-1">
        <HistoryBar
          historyList={historyList}
          selectedProfileId={selectedProfileId}
          onSelectProfile={handleSelectProfile}
          onFreezeToggle={handleFreezeToggle}
          onResetConfig={handleResetConfig}
          onRenameProfile={handleRenameProfile}
          onDuplicateProfile={handleDuplicateProfile}
          onAddProfile={handleAddProfile}
          onOpenFile={handleOpenHistoryFile}
          onRevealFolder={handleRevealHistoryFolder}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
};

export default TopPanelContainer;

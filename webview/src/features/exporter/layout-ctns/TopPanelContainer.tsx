import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { HistoryBar } from '../components/HistoryBar';
import { useHistoryBar } from '../hooks/use-history-bar';

export const TopPanelContainer: React.FC = () => {
  const historyBarProps = useHistoryBar();

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="🕒 Configuration History" path="workspace.top" />
      <div className="flex-1 min-h-0 overflow-y-auto p-1">
        <HistoryBar {...historyBarProps} />
      </div>
    </div>
  );
};

export default TopPanelContainer;

import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { InputPanel } from '../components/InputPanel';

interface LeftPanelContainerProps {
  inputText: string;
  setInputText: (val: string) => void;
}

export const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  inputText,
  setInputText,
}) => {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Ingestion Payload" path="workspace.left" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <InputPanel inputText={inputText} setInputText={setInputText} />
      </div>
    </div>
  );
};

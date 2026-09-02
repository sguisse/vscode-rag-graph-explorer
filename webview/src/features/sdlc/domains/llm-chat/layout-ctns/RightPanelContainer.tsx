import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { LlmChatHistory } from '../components/llm-chat-history/llm-chat-history';

export const RightPanelContainer: React.FC = () => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="LLM Chat History" path="workspace.right" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <LlmChatHistory />
      </div>
    </div>
  );
};

export default RightPanelContainer;

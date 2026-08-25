import React from 'react';
import { LLMChat } from './components/llm-chat';

export function LlmFeature() {
  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-card border-l border-border">
      <LLMChat />
    </div>
  );
}

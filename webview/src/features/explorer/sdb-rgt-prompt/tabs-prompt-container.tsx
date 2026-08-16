import React from 'react';
import { Button } from '@/components/ui/button';
import { PromptPanel } from './prompt';
import { LLMExplorerChat } from './LLM';
import { ConfigurationPanel } from './configuration';
import { SelectedEntity, CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useTabsPrompt } from './hooks/use-tabs-prompt';

interface TabsPromptContainerProps {
  selectedEntity?: SelectedEntity | null;
  initialCodebase?: CodebaseData;
  handleCopy?: (text: string, message: string) => void;
}

export function TabsPromptContainer({
  selectedEntity,
  initialCodebase,
  handleCopy
}: TabsPromptContainerProps) {
  const { activeTab, setActiveTab } = useTabsPrompt();

  return (
    <div className="flex flex-col bg-card h-full font-mono text-xs">
      <div className="flex bg-muted/40 border-border border-b overflow-x-auto shrink-0">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 min-w-[90px] py-2 text-[11px] font-bold rounded-none border-b-2 transition-all cursor-pointer ${
            activeTab === 'prompt' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Prompt Builder
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('llm')}
          className={`flex-1 min-w-[80px] py-2 text-[11px] font-bold rounded-none border-b-2 transition-all cursor-pointer ${
            activeTab === 'llm' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Local LLM
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('config')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 transition-all cursor-pointer ${
            activeTab === 'config' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Config
        </Button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'prompt' && <PromptPanel handleCopy={handleCopy} />}
        {activeTab === 'llm' && <LLMExplorerChat />}
        {activeTab === 'config' && <ConfigurationPanel />}
      </div>
    </div>
  );
}

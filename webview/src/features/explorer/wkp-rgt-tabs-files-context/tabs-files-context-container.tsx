import React from 'react';
import { Button } from '@/components/ui/button';
import { InspectorPanel } from './inspector-panel';
import { FilesContextPanel } from './files-context';
import { ContextTransformerPanel } from './context-transformer';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '../store/useExplorerStore';

interface TabsFilesContextContainerProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function TabsFilesContextContainer({
  selectedEntity,
  initialCodebase,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy
}: TabsFilesContextContainerProps) {
  const rightPanelTab = useExplorerStore((s) => s.rightPanelTab);
  const setRightPanelTab = useExplorerStore((s) => s.setRightPanelTab);

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="flex bg-muted/40 border-border border-b overflow-x-auto shrink-0">
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('inspect')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'inspect' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Inspector
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('files_context')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'files_context' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Context
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('transformer')}
          className={`flex-1 min-w-[80px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'transformer' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Transformer
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {rightPanelTab === 'files_context' && (
          <FilesContextPanel
            initialCodebase={initialCodebase}
            selectedEntity={selectedEntity}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'transformer' && (
          <ContextTransformerPanel
            initialCodebase={initialCodebase}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'inspect' && (
          <InspectorPanel
            selectedEntity={selectedEntity}
            initialCodebase={initialCodebase}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        )}
      </div>
    </div>
  );
}

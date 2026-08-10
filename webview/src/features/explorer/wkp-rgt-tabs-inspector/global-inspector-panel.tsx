import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InspectorTabPanel } from './inspector-tab-panel';
import { PlantUmlTabPanel } from './plantuml-tab-panel';
import { JsonTabPanel } from './json-tab-panel';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';

interface GlobalInspectorPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
  generatedPlantUML: string;
}

export function GlobalInspectorPanel({
  selectedEntity,
  initialCodebase,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy,
  generatedPlantUML
}: GlobalInspectorPanelProps) {
  const [rightPanelTab, setRightPanelTab] = useState<'inspect' | 'plantuml' | 'json_schema'>('inspect');

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="flex bg-muted/40 border-border border-b shrink-0">
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('inspect')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'inspect' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Inspector
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('plantuml')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'plantuml' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          PlantUML
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('json_schema')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'json_schema' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          JSON Schema
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {rightPanelTab === 'inspect' && (
          <InspectorTabPanel
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
        {rightPanelTab === 'plantuml' && (
          <PlantUmlTabPanel
            generatedPlantUML={generatedPlantUML}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'json_schema' && (
          <JsonTabPanel handleCopy={handleCopy} />
        )}
      </div>
    </div>
  );
}

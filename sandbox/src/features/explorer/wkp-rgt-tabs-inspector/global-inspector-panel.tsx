import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InspectorTabPanel } from './inspector-tab-panel';
import { PlantUmlTabPanel } from './plantuml-tab-panel';
import { JsonTabPanel } from './json-tab-panel';

interface GlobalInspectorPanelProps {
  selectedEntity: { type: 'node' | 'member' | 'edge'; nodeId: string; memberId?: string; } | null;
  initialCodebase: any;
  impactDirection: 'aval' | 'amont';
  setImpactDirection: (dir: 'aval' | 'amont') => void;
  impactedSet: Set<string>;
  generatedMarkdownRecipe: string;
  handleCopy: (text: string, message: string) => void;
  generatedPlantUML: string;
}

export function GlobalInspectorPanel({
  selectedEntity,
  initialCodebase,
  impactDirection,
  setImpactDirection,
  impactedSet,
  generatedMarkdownRecipe,
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
            impactDirection={impactDirection}
            setImpactDirection={setImpactDirection}
            impactedSet={impactedSet}
            generatedMarkdownRecipe={generatedMarkdownRecipe}
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

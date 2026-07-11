import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlantUmlViewer } from '@/components/app/viewer/plantuml-viewer';

interface PlantUmlTabPanelProps {
  generatedPlantUML: string;
  handleCopy: (text: string, message: string) => void;
}

export function PlantUmlTabPanel({ generatedPlantUML, handleCopy }: PlantUmlTabPanelProps) {
  return (
    <div className="group relative h-full">
      <Button onClick={() => handleCopy(generatedPlantUML, "PlantUML diagram code copied to clipboard!")} className="top-3 right-5 z-10 absolute flex items-center gap-1 bg-slate-800 hover:bg-slate-700 opacity-0 group-hover:opacity-100 shadow-md px-2 py-1 border border-slate-600 rounded h-6 font-mono text-[10px] text-white transition-opacity" data-tooltip="Copy PlantUML code to clipboard">
        <Copy size={10} /> Copy
      </Button>
      <PlantUmlViewer data={generatedPlantUML} onDoubleClick={() => handleCopy(generatedPlantUML, "PlantUML diagram code copied to clipboard!")} className="h-full cursor-pointer select-auto" data-tooltip="Double-click to copy content" />
    </div>
  );
}

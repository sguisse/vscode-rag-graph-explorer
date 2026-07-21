import React from 'react';
import { PlantUmlViewer } from '@/components/app/viewer/plantuml-viewer';
import { CopyFloatingButton } from '@/components/app/viewer/CopyFloatingButton';

interface PlantUmlTabPanelProps {
  generatedPlantUML: string;
  handleCopy: (text: string, message: string) => void;
}

export function PlantUmlTabPanel({ generatedPlantUML, handleCopy }: PlantUmlTabPanelProps) {
  const doCopy = () => handleCopy(generatedPlantUML, "PlantUML diagram code copied to clipboard!");

  return (
    <div className="group relative h-full">
      <CopyFloatingButton onCopy={doCopy} tooltipText="Copy PlantUML code to clipboard" />
      <PlantUmlViewer
        data={generatedPlantUML}
        onDoubleClick={doCopy}
        className="h-full cursor-pointer select-auto"
        data-tooltip="Double-click to copy content"
      />
    </div>
  );
}

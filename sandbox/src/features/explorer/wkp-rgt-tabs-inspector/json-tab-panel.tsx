import React from 'react';
import { JsonViewer } from '@/components/app/viewer/json-viewer';
import { CopyFloatingButton } from '@/components/app/viewer/CopyFloatingButton';
import { codebaseService } from '@/services/codebase';

interface JsonTabPanelProps {
  handleCopy: (text: string, message: string) => void;
}

export function JsonTabPanel({ handleCopy }: JsonTabPanelProps) {
  const jsonSchemaSpec = codebaseService.getJsonSchemaSpec();

  const doCopy = () => handleCopy(JSON.stringify(jsonSchemaSpec, null, 2), "JSON Schema copied to clipboard!");

  return (
    <div className="group relative h-full">
      <CopyFloatingButton onCopy={doCopy} tooltipText="Copy JSON Schema to clipboard" />
      <JsonViewer
        data={jsonSchemaSpec}
        onDoubleClick={doCopy}
        className="h-full cursor-pointer select-auto"
        data-tooltip="Double-click to copy content"
      />
    </div>
  );
}

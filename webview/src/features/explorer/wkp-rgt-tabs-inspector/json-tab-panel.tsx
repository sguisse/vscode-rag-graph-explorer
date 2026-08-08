import React, { useEffect, useState } from 'react';
import { JsonView } from '@/components/app/viewer/JsonView';
import { CopyFloatingButton } from '@/components/app/viewer/CopyFloatingButton';
import { CodebaseSchema } from '@/shared/services/graph-rag-explorer/domain/model/neo4j/codebase.schema';

interface JsonTabPanelProps {
  handleCopy: (text: string, message: string) => void;
}

export function JsonTabPanel({ handleCopy }: JsonTabPanelProps) {
  const [jsonSchemaSpec, setJsonSchemaSpec] = useState<unknown>(null);

  useEffect(() => {
    setJsonSchemaSpec(CodebaseSchema.getSchema());
  }, []);

  const doCopy = () => handleCopy(JSON.stringify(jsonSchemaSpec, null, 2), "JSON Schema copied to clipboard!");

  return (
    <div className="group relative h-full">
      <CopyFloatingButton onCopy={doCopy} tooltipText="Copy JSON Schema to clipboard" />
      <JsonView
        data={jsonSchemaSpec}
        onDoubleClick={doCopy}
        className="h-full cursor-pointer select-auto"
        data-tooltip="Double-click to copy content"
      />
    </div>
  );
}

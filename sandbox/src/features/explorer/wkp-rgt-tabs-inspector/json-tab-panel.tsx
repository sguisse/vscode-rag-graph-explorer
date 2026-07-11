import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonViewer } from '@/components/app/viewer/json-viewer';
import { JSON_SCHEMA_SPEC } from '../wksp-cnt-graph/components/graph/GraphData';

interface JsonTabPanelProps {
  handleCopy: (text: string, message: string) => void;
}

export function JsonTabPanel({ handleCopy }: JsonTabPanelProps) {
  return (
    <div className="group relative h-full">
      <Button onClick={() => handleCopy(JSON.stringify(JSON_SCHEMA_SPEC, null, 2), "JSON Schema copied to clipboard!")}
              className="top-3 right-5 z-10 absolute flex items-center gap-1 bg-slate-800 hover:bg-slate-700 opacity-0 group-hover:opacity-100 shadow-md px-2 py-1 border border-slate-600 rounded h-6 font-mono text-[10px] text-white transition-opacity"
              data-tooltip="Copy JSON Schema to clipboard">
        <Copy size={10} /> Copy
      </Button>
      <JsonViewer data={JSON_SCHEMA_SPEC} onDoubleClick={() => handleCopy(JSON.stringify(JSON_SCHEMA_SPEC, null, 2), "JSON Schema copied to clipboard!")} className="h-full cursor-pointer select-auto"
          data-tooltip="Double-click to copy content" />
    </div>
  );
}

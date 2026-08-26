import React from 'react';
import { User, Baby } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import {
  DISPLAY_LEVEL_LIST,
  DISPLAY_LEVEL_ICON_MAP,
} from '@/shared/services/graph-rag-explorer/domain/model/types';
import { useGraphToolbar } from './hooks/use-graph-toolbar';

export function GraphToolbar() {
  const {
    maxNodesLimit,
    setMaxNodesLimit,
    callersDepth,
    setCallersDepth,
    calleesDepth,
    setCalleesDepth,
    displayLevel,
    setDisplayLevel,
  } = useGraphToolbar();

  return (
    <div className="top-0 left-0 z-20 absolute flex items-center gap-2.5 bg-muted/20 px-2.5 py-1 border-b border-border w-full font-mono text-xs pointer-events-auto">
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm h-6">
        <span className="font-medium text-[10px] text-muted-foreground tracking-wider">Limit:</span>
        <Input
          id="input-max-nodes-limit"
          type="number"
          min={1}
          max={100}
          className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center"
          value={maxNodesLimit}
          onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)}
        />
      </div>

      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm h-6" data-tooltip="Callers Depth">
        <User size={12} className="text-muted-foreground" />
        <Input
          id="input-callers-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
          value={callersDepth}
          onChange={(e) => setCallersDepth(Number(e.target.value) || 0)}
        />
      </div>

      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm h-6" data-tooltip="Callees Depth">
        <Baby size={12} className="text-muted-foreground" />
        <Input
          id="input-callees-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
          value={calleesDepth}
          onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)}
        />
      </div>

      <SelectFromTypeBuilder
        id="select-display-level"
        value={displayLevel}
        onChange={setDisplayLevel}
        className="py-0"
        triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
        options={DISPLAY_LEVEL_LIST.map((key) => ({
          value: key,
          icon: DISPLAY_LEVEL_ICON_MAP[key].icon,
          label: DISPLAY_LEVEL_ICON_MAP[key].label,
        }))}
      />
    </div>
  );
}

export default GraphToolbar;

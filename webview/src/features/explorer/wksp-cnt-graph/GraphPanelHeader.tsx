import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, SquareFunction, Code2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ToggleButton } from '@/components/app/toggle-button';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';

import {
  DISPLAY_LEVEL_LIST,
  DISPLAY_LEVEL_ICON_MAP,
  GRAPH_LAYOUT_LIST,
  GRAPH_LAYOUT_ICON_MAP
} from '@/shared/services/graph-rag-explorer/domain/model/types';
import { useGraphPanelHeader } from './hooks/use-graph-panel-header';

export interface GraphPanelHeaderLeftProps {}

export const GraphPanelHeaderLeft: React.FC<GraphPanelHeaderLeftProps> = () => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-foreground truncate tracking-wider">Dependencies</span>
  </div>
);

export interface GraphPanelHeaderCenterProps {
  maxNodesLimit: number;
  setMaxNodesLimit: (val: number) => void;
  callersDepth: number;
  setCallersDepth: (val: number) => void;
  calleesDepth: number;
  setCalleesDepth: (val: number) => void;
  displayLevel: string;
  setDisplayLevel: (val: string) => void;
  currentLayout: string;
  setCurrentLayout: (val: string) => void;
}

export const GraphPanelHeaderCenter: React.FC<GraphPanelHeaderCenterProps> = ({
  maxNodesLimit,
  setMaxNodesLimit,
  callersDepth,
  setCallersDepth,
  calleesDepth,
  setCalleesDepth,
  displayLevel,
  setDisplayLevel,
  currentLayout,
  setCurrentLayout,
}) => {
  const { displayNeo4jHandler } = useGraphPanelHeader();

  return (
    <div className="flex items-center gap-3">
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
      <Button
        id="btn-neo4j-connect"
        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider"
        onClick={displayNeo4jHandler}
      >
        <Database size={11} /> Neo4j
      </Button>
      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm h-6">
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
      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm h-6">
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
      <SelectFromTypeBuilder
        id="select-graph-layout"
        value={currentLayout}
        onChange={setCurrentLayout}
        className="py-0"
        triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
        options={GRAPH_LAYOUT_LIST.map((key) => ({
          value: key,
          icon: GRAPH_LAYOUT_ICON_MAP[key].icon,
          label: GRAPH_LAYOUT_ICON_MAP[key].label,
        }))}
      />
    </div>
  );
};

export interface GraphPanelHeaderRightProps {
  cyRef: React.RefObject<any>;
  isGraphMaximized: boolean;
  setIsGraphMaximized: (maximized: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  attributesVisible: boolean;
  setAttributesVisible: (val: boolean) => void;
  methodsVisible: boolean;
  setMethodsVisible: (val: boolean) => void;
  showSelectedOnly: boolean;
  setShowSelectedOnly: (val: boolean) => void;
}

export const GraphPanelHeaderRight: React.FC<GraphPanelHeaderRightProps> = ({
  cyRef,
  isGraphMaximized,
  setIsGraphMaximized,
  showGrid,
  setShowGrid,
  attributesVisible,
  setAttributesVisible,
  methodsVisible,
  setMethodsVisible,
  showSelectedOnly,
  setShowSelectedOnly,
}) => {
  const { handleZoomIn, handleZoomOut, handleFitView } = useGraphPanelHeader(cyRef);

  return (
    <div className="flex items-center gap-1">
      <ToggleButton
        id="btn-toggle-show-selected-only"
        isSelected={showSelectedOnly}
        onToggle={() => setShowSelectedOnly(!showSelectedOnly)}
        tooltipText="Display Only Selected & Connected Items"
        icon={<Target size={12} />}
      />
      <ToggleButton
        id="btn-toggle-attributes-visibility"
        isSelected={attributesVisible}
        onToggle={() => setAttributesVisible(!attributesVisible)}
        tooltipText="Toggle Attributes Visibility"
        icon={<Code2 size={12} />}
      />
      <ToggleButton
        id="btn-toggle-methods-visibility"
        isSelected={methodsVisible}
        onToggle={() => setMethodsVisible(!methodsVisible)}
        tooltipText="Toggle Methods Visibility"
        icon={<SquareFunction size={12} />}
      />

      <ToolbarSeparator />

      <ToggleButton
        id="btn-toggle-grid"
        isSelected={showGrid}
        onToggle={() => setShowGrid(!showGrid)}
        tooltipText="Toggle Grid"
        icon={<Grid size={12} />}
      />

      <ToolbarSeparator />

      <Button
        id="btn-graph-zoom-in"
        variant="ghost"
        size="icon"
        className="w-5 h-5 text-muted-foreground"
        onClick={handleZoomIn}
      >
        <Plus size={12} />
      </Button>
      <Button
        id="btn-graph-zoom-out"
        variant="ghost"
        size="icon"
        className="w-5 h-5 text-muted-foreground"
        onClick={handleZoomOut}
      >
        <Minus size={12} />
      </Button>
      <Button
        id="btn-graph-fit-view"
        variant="ghost"
        size="icon"
        className="w-5 h-5 text-muted-foreground"
        onClick={handleFitView}
      >
        <Focus size={12} />
      </Button>
    </div>
  );
};

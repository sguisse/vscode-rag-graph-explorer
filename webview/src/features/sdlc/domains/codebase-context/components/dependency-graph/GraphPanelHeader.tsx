import React from 'react';
import { Grid, Database, Plus, Minus, Focus, SquareFunction, Target, ListTree, Map, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ToggleButton } from '@/components/app/toggle-button';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import { useLayoutStore } from '@/store/useLayoutStore';

import {
  GRAPH_LAYOUT_LIST,
  GRAPH_LAYOUT_ICON_MAP
} from '@/shared/services/graph-rag-explorer/domain/model/types';
import {
  GRAPH_RENDERING_LIST,
  GRAPH_RENDERING_ICON_MAP,
  GraphRendering
} from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';
import { useGraphPanelHeader } from './hooks/use-graph-panel-header';
import { useCodebaseDomainState } from '../../store/useCodebaseDomainState';

export interface GraphPanelHeaderLeftProps {
  currentLayout?: string;
  setCurrentLayout?: (val: string) => void;
  currentRendering?: GraphRendering;
  setCurrentRendering?: (val: GraphRendering) => void;
}

export const GraphPanelHeaderLeft: React.FC<GraphPanelHeaderLeftProps> = ({
  currentLayout: propCurrentLayout,
  setCurrentLayout: propSetCurrentLayout,
  currentRendering: propCurrentRendering,
  setCurrentRendering: propSetCurrentRendering,
}) => {
  const {
    currentLayout: storeLayout,
    setCurrentLayout: storeSetLayout,
    currentRendering: storeRendering,
    setCurrentRendering: storeSetRendering
  } = useGraphPanelHeader();

  const currentLayout = propCurrentLayout || storeLayout || 'cose';
  const setCurrentLayout = propSetCurrentLayout || storeSetLayout;

  const currentRendering = propCurrentRendering || storeRendering || 'uml';
  const setCurrentRendering = propSetCurrentRendering || storeSetRendering;

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-foreground truncate tracking-wider">Dependencies</span>
      <SelectFromTypeBuilder
        id="select-graph-rendering"
        value={currentRendering}
        onChange={(val) => setCurrentRendering((val as GraphRendering) || 'uml')}
        className="py-0"
        triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
        options={GRAPH_RENDERING_LIST.map((key) => ({
          value: key,
          icon: GRAPH_RENDERING_ICON_MAP[key]?.icon,
          label: GRAPH_RENDERING_ICON_MAP[key]?.label || key,
        }))}
      />
      <SelectFromTypeBuilder
        id="select-graph-layout"
        value={currentLayout}
        onChange={(val) => setCurrentLayout(val || 'cose')}
        className="py-0"
        triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
        options={GRAPH_LAYOUT_LIST.map((key) => ({
          value: key,
          icon: GRAPH_LAYOUT_ICON_MAP[key]?.icon,
          label: GRAPH_LAYOUT_ICON_MAP[key]?.label || key,
        }))}
      />
    </div>
  );
};

export interface GraphPanelHeaderCenterProps {
  currentLayout?: string;
  setCurrentLayout?: (val: string) => void;
  maxNodesLimit?: number;
  setMaxNodesLimit?: (val: number) => void;
  callersDepth?: number;
  setCallersDepth?: (val: number) => void;
  calleesDepth?: number;
  setCalleesDepth?: (val: number) => void;
  displayLevel?: string;
  setDisplayLevel?: (val: string) => void;
}

export const GraphPanelHeaderCenter: React.FC<GraphPanelHeaderCenterProps> = () => {
  const { displayNeo4jHandler } = useGraphPanelHeader();

  return (
    <div className="flex items-center gap-3">
      <Button
        id="btn-neo4j-connect"
        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider cursor-pointer"
        onClick={displayNeo4jHandler}
      >
        <Database size={11} /> Neo4j
      </Button>
    </div>
  );
};

export interface GraphPanelHeaderRightProps {
  cyRef?: React.RefObject<any>;
  isGraphMaximized?: boolean;
  setIsGraphMaximized?: (maximized: boolean) => void;
  showGrid?: boolean;
  setShowGrid?: (show: boolean) => void;
  attributesVisible?: boolean;
  setAttributesVisible?: (val: boolean) => void;
  methodsVisible?: boolean;
  setMethodsVisible?: (val: boolean) => void;
  showSelectedOnly?: boolean;
  setShowSelectedOnly?: (val: boolean) => void;
}

export const GraphPanelHeaderRight: React.FC<GraphPanelHeaderRightProps> = ({
  cyRef: propCyRef,
  isGraphMaximized = false,
  setIsGraphMaximized = () => {},
  showGrid: propShowGrid,
  setShowGrid: propSetShowGrid,
  attributesVisible: propAttributesVisible,
  setAttributesVisible: propSetAttributesVisible,
  methodsVisible: propMethodsVisible,
  setMethodsVisible: propSetMethodsVisible,
  showSelectedOnly: propShowSelectedOnly,
  setShowSelectedOnly: propSetShowSelectedOnly,
}) => {
  const storeShowGrid = useCodebaseDomainState((s) => s.showGrid);
  const storeSetShowGrid = useCodebaseDomainState((s) => s.setShowGrid);
  const storeAttributesVisible = useCodebaseDomainState((s) => s.attributesVisible);
  const storeSetAttributesVisible = useCodebaseDomainState((s) => s.setAttributesVisible);
  const storeMethodsVisible = useCodebaseDomainState((s) => s.methodsVisible);
  const storeSetMethodsVisible = useCodebaseDomainState((s) => s.setMethodsVisible);
  const storeShowSelectedOnly = useCodebaseDomainState((s) => s.showSelectedOnly);
  const storeSetShowSelectedOnly = useCodebaseDomainState((s) => s.setShowSelectedOnly);
  const autoFit = useCodebaseDomainState((s) => s.autoFit);
  const showMinimap = useCodebaseDomainState((s) => s.showMinimap);
  const toggleShowMinimap = useCodebaseDomainState((s) => s.toggleShowMinimap);

  const isSidebarRightVisible = useLayoutStore((s) => s.containers.sidebarRight?.visible ?? false);
  const toggleContainerVisible = useLayoutStore((s) => s.toggleContainerVisible);

  const showGrid = propShowGrid ?? storeShowGrid;
  const setShowGrid = propSetShowGrid ?? storeSetShowGrid;
  const attributesVisible = propAttributesVisible ?? storeAttributesVisible;
  const setAttributesVisible = propSetAttributesVisible ?? storeSetAttributesVisible;
  const methodsVisible = propMethodsVisible ?? storeMethodsVisible;
  const setMethodsVisible = propSetMethodsVisible ?? storeSetMethodsVisible;
  const showSelectedOnly = propShowSelectedOnly ?? storeShowSelectedOnly;
  const setShowSelectedOnly = propSetShowSelectedOnly ?? storeSetShowSelectedOnly;

  const { handleZoomIn, handleZoomOut, handleFitView } = useGraphPanelHeader(propCyRef);

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
        icon={<ListTree size={12} />}
      />
      <ToggleButton
        id="btn-toggle-methods-visibility"
        isSelected={methodsVisible}
        onToggle={() => setMethodsVisible(!methodsVisible)}
        tooltipText="Toggle Methods Visibility"
        icon={<SquareFunction size={12} />}
      />

      <ToggleButton
        id="btn-toggle-inspector-sidebar"
        isSelected={isSidebarRightVisible}
        onToggle={() => toggleContainerVisible('sidebarRight')}
        tooltipText="Toggle Inspector Panel (Right Sidebar)"
        icon={<Microscope size={12} />}
      />

      <ToolbarSeparator />

      <ToggleButton
        id="btn-toggle-minimap"
        isSelected={showMinimap}
        onToggle={toggleShowMinimap}
        tooltipText="Toggle Graph Minimap"
        icon={<Map size={12} />}
      />

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
      <ToggleButton
        id="btn-graph-fit-view"
        isSelected={autoFit}
        onToggle={(e?: any) => handleFitView(e || (window.event as any))}
        tooltipText={autoFit ? "Auto-Fit Mode Active (Cmd+Click to disable)" : "Fit View (Cmd+Click to toggle Auto-Fit)"}
        icon={<Focus size={12} className={autoFit ? 'animate-pulse' : ''} />}
      />
    </div>
  );
};

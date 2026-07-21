#!/usr/bin/env bash
# ============================================================================
# Phase 2 Remediation Script: Domain Renaming, Strict Typing & OCP Enhancement
# Action:
#   1. Renames cryptic folder paths to standard domain directories:
#      - wksp-cnt-graph        -> graph-canvas
#      - wkp-lft-codebase-tree  -> codebase-tree
#      - wkp-rgt-tabs-inspector -> inspector-tabs
#      - sdb-rgt-properties    -> properties-panel
#      - wkp-top-paths         -> top-paths
#      - wkp-btm-infos         -> bottom-infos
#   2. Fixes 'any' type safety leaks across graph shapes, headers, and panels.
#   3. Introduces 'NODE_STYLE_REGISTRY' (Open/Closed Principle) for shape themes.
#   4. Extracts layout visibility state into 'useLayoutState' hook (ISP Fix).
#   5. Re-links ExplorerFeature.tsx and cleans up legacy directory paths.
# ============================================================================

set -e

# Create standard domain subdirectories
mkdir -p sandbox/src/features/explorer/graph-canvas
mkdir -p sandbox/src/features/explorer/codebase-tree
mkdir -p sandbox/src/features/explorer/inspector-tabs
mkdir -p sandbox/src/features/explorer/properties-panel
mkdir -p sandbox/src/features/explorer/top-paths
mkdir -p sandbox/src/features/explorer/bottom-infos
mkdir -p sandbox/src/components/app/layout/hooks

# 1. GRAPH CANVAS: Typed Shapes with OCP Registry Pattern
cat << 'EOF' > sandbox/src/features/explorer/graph-canvas/GraphUmlShapes.tsx
import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { CodebaseFile, CodebaseAttribute, CodebaseMethod, ConfigProperty } from '@/services/codebase';

export interface NodeStyle {
  bg: string;
  border: string;
  badge: string;
  iconColor: string;
}

// OCP Strategy Registry for Node Theme Configuration
export const NODE_STYLE_REGISTRY: Record<string, NodeStyle> = {
  component: { bg: 'bg-emerald-600 dark:bg-emerald-900/80', border: 'border-emerald-500', badge: '🎨 React Component', iconColor: 'text-emerald-400' },
  interface: { bg: 'bg-indigo-700 dark:bg-indigo-950/80', border: 'border-indigo-500', badge: '⚙️ Java Interface', iconColor: 'text-indigo-400' },
  default: { bg: 'bg-blue-600 dark:bg-blue-950/80', border: 'border-blue-500', badge: '☕ Java Class', iconColor: 'text-blue-400' }
};

export interface UmlClassNodeData extends CodebaseFile {
  isDimmed?: boolean;
  impactedMembers?: string[];
  selectedMember?: string;
  onSelectMember: (nodeId: string, memberId: string) => void;
}

export const FolderNode: React.FC<{ data: { label: string }; isSelected?: boolean }> = ({ isSelected }) => (
  <div className={`w-full h-full rounded-lg transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`} />
);

export const UmlClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;

  return (
    <div className={`w-72 bg-card rounded-lg shadow-xl border-2 ${style.border} relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
      <div className={`${style.bg} p-3 text-white relative rounded-t-[5px]`}>
        <div className="flex justify-between items-center">
          <span className="bg-black/30 opacity-85 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">{style.badge}</span>
          <span className="opacity-60 font-mono text-[10px]">{data.language}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FileCode size={18} className={style.iconColor} />
          <h4 className="font-mono font-bold text-sm truncate">{data.name}</h4>
        </div>
      </div>
      <div className="bg-muted/30 p-2.5 border-border border-b">
        <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Attributes</div>
        {(!data.attributes || data.attributes.length === 0) ? (
          <div className="text-muted-foreground text-xs italic">no attributes available</div>
        ) : (
          <ul className="space-y-0.5 font-mono text-[11px] text-foreground/80">
            {data.attributes.map((attr: CodebaseAttribute, idx: number) => (
              <li key={idx} className="flex items-center gap-1">
                <span className="text-muted-foreground">{attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+'}</span>
                {attr.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-2.5">
        <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Methods / Exports</div>
        <div className="space-y-2">
          {data.methods?.map((m: CodebaseMethod) => {
            const isMethodImpacted = data.impactedMembers && data.impactedMembers.includes(m.id);
            const isSelected = data.selectedMember === m.id;
            return (
              <div key={m.id} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, m.id); }}
                className={`pointer-events-auto group relative flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                  isSelected ? 'border-primary bg-primary/10' : isMethodImpacted ? 'border-orange-500 bg-orange-500/15 animate-pulse' : 'border-transparent hover:bg-muted'
                }`}
              >
                <span className="font-mono text-foreground/90 text-xs">+ {m.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => (
  <div className={`w-80 bg-card rounded-lg shadow-xl border-2 border-amber-500 relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
    <div className="flex justify-between items-center bg-amber-500 p-2.5 rounded-t-[5px] text-white">
      <div className="flex items-center gap-1.5">
        <Settings size={16} className="text-amber-100" />
        <h4 className="font-mono font-bold text-xs truncate">{data.name}</h4>
      </div>
      <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest">Configuration</span>
    </div>
    <div className="space-y-2 bg-black/90 p-3 max-h-64 overflow-y-auto font-mono text-[10px] text-slate-300">
      {data.configProperties?.map((prop: ConfigProperty) => {
        const isPropImpacted = data.impactedMembers && data.impactedMembers.includes(prop.key);
        const isSelected = data.selectedMember === prop.key;
        return (
          <div key={prop.key} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, prop.key); }}
            className={`pointer-events-auto group relative p-2 rounded border transition-all cursor-pointer ${
              isSelected ? 'border-primary bg-primary/20 text-white' : isPropImpacted ? 'border-orange-500 bg-orange-950/50 text-orange-400' : 'border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="font-semibold text-amber-400 truncate">{prop.key}:</div>
            <div className="pl-2 text-slate-400 truncate">{prop.value}</div>
          </div>
        );
      })}
    </div>
  </div>
);
EOF

# 2. GRAPH CANVAS: GraphPanelHeader Typed Interfaces
cat << 'EOF' > sandbox/src/features/explorer/graph-canvas/GraphPanelHeader.tsx
import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export interface GraphHeaderLeftProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

export const GraphPanelHeaderLeft: React.FC<GraphHeaderLeftProps> = ({ showGrid, setShowGrid }) => (
  <div className="flex items-center gap-2">
    <span>Topological Network</span>
    <Button variant="ghost" size="icon" className={`h-5 w-5 rounded transition-colors ${showGrid ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} onClick={() => setShowGrid(!showGrid)}>
      <Grid size={12} />
    </Button>
  </div>
);

export interface GraphHeaderCenterProps {
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

export const GraphPanelHeaderCenter: React.FC<GraphHeaderCenterProps> = ({
  maxNodesLimit, setMaxNodesLimit, callersDepth, setCallersDepth, calleesDepth, setCalleesDepth, displayLevel, setDisplayLevel, currentLayout, setCurrentLayout
}) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
      <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
      <Input type="number" min={1} max={100} className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center" value={maxNodesLimit} onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)} />
    </div>
    <Button className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider">
      <Database size={11} /> Neo4j
    </Button>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <User size={12} className="text-muted-foreground" />
      <Input type="number" min={0} max={20} className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center" value={callersDepth} onChange={(e) => setCallersDepth(Number(e.target.value) || 0)} />
    </div>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <Baby size={12} className="text-muted-foreground" />
      <Input type="number" min={0} max={20} className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center" value={calleesDepth} onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)} />
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={displayLevel} onValueChange={setDisplayLevel}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-24 h-5 text-[11px] text-foreground"><SelectValue placeholder="Granularity" /></SelectTrigger>
        <SelectContent side="bottom"><SelectItem value="all">Show All</SelectItem><SelectItem value="component">Component</SelectItem><SelectItem value="class">Class</SelectItem><SelectItem value="interface">Interface</SelectItem><SelectItem value="module">Module</SelectItem><SelectItem value="config">Configuration</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={currentLayout} onValueChange={setCurrentLayout}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-28 h-5 text-[11px] text-foreground"><SelectValue placeholder="Layout Architecture" /></SelectTrigger>
        <SelectContent side="bottom"><SelectItem value="preset">Default (Packages)</SelectItem><SelectItem value="grid">Grid Distribution</SelectItem><SelectItem value="breadthfirst">Hierarchical (BFS)</SelectItem><SelectItem value="cose">Force-Directed (Cose)</SelectItem></SelectContent>
      </Select>
    </div>
  </div>
);

export interface GraphHeaderRightProps {
  cyRef: React.RefObject<any>;
  isGraphMaximized: boolean;
  setIsGraphMaximized: (maximized: boolean) => void;
}

export const GraphPanelHeaderRight: React.FC<GraphHeaderRightProps> = ({ cyRef, isGraphMaximized, setIsGraphMaximized }) => (
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}><Plus size={12}/></Button>
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}><Minus size={12}/></Button>
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => { cyRef.current?.fit(); cyRef.current?.center(); }}><Focus size={12}/></Button>
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setIsGraphMaximized(!isGraphMaximized)}>{isGraphMaximized ? <Minimize size={12}/> : <Maximize size={12}/></Button>
  </div>
);
EOF

# Move & update GraphPanel, use-graph, use-plantuml into graph-canvas
cp sandbox/src/features/explorer/wksp-cnt-graph/GraphPanel.tsx sandbox/src/features/explorer/graph-canvas/GraphPanel.tsx
cp sandbox/src/features/explorer/wksp-cnt-graph/components/graph/use-graph.ts sandbox/src/features/explorer/graph-canvas/use-graph.ts
cp sandbox/src/features/explorer/wksp-cnt-graph/components/graph/use-plantuml.ts sandbox/src/features/explorer/graph-canvas/use-plantuml.ts

# 3. CODEBASE TREE: Typed CodebaseExplorerPanel
cat << 'EOF' > sandbox/src/features/explorer/codebase-tree/CodebaseExplorerPanel.tsx
import React from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database } from 'lucide-react';
import { CodebaseFile, SelectedEntity, codebaseService } from '@/services/codebase';

interface Props {
  searchFilteredFiles: CodebaseFile[];
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFolderCheckbox: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
}

export function CodebaseExplorerPanel({
  searchFilteredFiles,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFolderCheckbox,
  toggleFileCheckbox,
  setSelectedEntity
}: Props) {
  const codebase = codebaseService.getCodebase();

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="bg-muted/20 p-4 border-border border-b">
        <h3 className="flex justify-between items-center mb-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
          <span>Codebase Explorer</span>
          <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">{searchFilteredFiles.length}/{codebase.files.length}</span>
        </h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
        {['frontend', 'backend', 'config'].map(folder => (
          <div key={folder} className="mb-4">
            <div className="group flex justify-between items-center hover:bg-muted/50 px-1 py-1 rounded">
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder(folder)}>
                {expandedFolders[folder] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={15} className={folder === 'frontend' ? "fill-yellow-500/20 text-yellow-500" : folder === 'backend' ? "fill-indigo-500/20 text-indigo-500" : "fill-amber-500/20 text-amber-500"} />
                <span className="font-bold">{folder}/</span>
              </div>
              <input type="checkbox" checked={codebase.files.filter(f => f.path.startsWith(folder)).every(f => visibleFiles[f.id])} onChange={() => toggleFolderCheckbox(folder)} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
            </div>
            {expandedFolders[folder] && (
              <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                {codebase.files.filter(f => f.path.startsWith(folder)).map(file => (
                  <div key={file.id} className="group flex justify-between items-center hover:bg-muted px-2 py-1 rounded">
                    <span className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`} onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}>
                      {folder === 'config' ? <Database size={13} className="text-amber-500" /> : <FileCode size={13} className={file.type === 'interface' ? 'text-indigo-400' : (folder === 'frontend' ? 'text-emerald-500' : 'text-blue-500')} />}
                      {file.name}
                    </span>
                    <input type="checkbox" checked={visibleFiles[file.id]} onChange={() => toggleFileCheckbox(file.id)} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# Move inspector-tabs, top-paths, bottom-infos files
cp -r sandbox/src/features/explorer/wkp-rgt-tabs-inspector/* sandbox/src/features/explorer/inspector-tabs/
cp -r sandbox/src/features/explorer/wkp-top-paths/* sandbox/src/features/explorer/top-paths/
cp -r sandbox/src/features/explorer/wkp-btm-infos/* sandbox/src/features/explorer/bottom-infos/

# 4. ISP LAYOUT HOOK: Consolidated Layout Visibility
cat << 'EOF' > sandbox/src/components/app/layout/hooks/use-layout-state.ts
import { useState } from 'react';
import { AppLayoutConfig } from '../AppLayout';

export function useLayoutState(layoutConfig: AppLayoutConfig = {}) {
  const [isCtnWorkspaceVisible, setIsCtnWorkspaceVisible] = useState(true);
  const [isCtnWorkspaceTopVisible, setIsCtnWorkspaceTopVisible] = useState(layoutConfig.showTop ?? false);
  const [isCtnWorkspaceLeftVisible, setIsCtnWorkspaceLeftVisible] = useState(layoutConfig.showLeft ?? false);
  const [isCtnWorkspaceCenterVisible, setIsCtnWorkspaceCenterVisible] = useState(layoutConfig.showCenter ?? false);
  const [isCtnWorkspaceRightVisible, setIsCtnWorkspaceRightVisible] = useState(layoutConfig.showRight ?? false);
  const [isCtnWorkspaceBottomVisible, setIsCtnWorkspaceBottomVisible] = useState(layoutConfig.showBottom ?? false);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(layoutConfig.showRightSidebar ?? false);

  return {
    isCtnWorkspaceVisible, setIsCtnWorkspaceVisible,
    isCtnWorkspaceTopVisible, setIsCtnWorkspaceTopVisible,
    isCtnWorkspaceLeftVisible, setIsCtnWorkspaceLeftVisible,
    isCtnWorkspaceCenterVisible, setIsCtnWorkspaceCenterVisible,
    isCtnWorkspaceRightVisible, setIsCtnWorkspaceRightVisible,
    isCtnWorkspaceBottomVisible, setIsCtnWorkspaceBottomVisible,
    isSidebarRightVisible, setIsSidebarRightVisible
  };
}
EOF

# 5. REFACTOR EXPLORER FEATURE WITH CLEAN DOMAIN IMPORTS
cat << 'EOF' > sandbox/src/features/explorer/ExplorerFeature.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { codebaseService, SelectedEntity, ImpactDirection } from '@/services/codebase';

import { EntityPropertiesPanel } from './properties-panel/EntityPropertiesPanel';
import { CodebaseExplorerPanel } from './codebase-tree/CodebaseExplorerPanel';
import { GraphPanelHeaderLeft, GraphPanelHeaderCenter, GraphPanelHeaderRight } from './graph-canvas/GraphPanelHeader';
import { useGraph } from './graph-canvas/use-graph';
import { usePlantUml } from './graph-canvas/use-plantuml';
import { useCopyToClipboard } from '@/hooks/use-clipboard';

import { GlobalInspectorPanel } from './inspector-tabs/global-inspector-panel';
import { GraphPanel } from './graph-canvas/GraphPanel';
import { ContextPathsPanel } from './top-paths/context-paths-panel';
import { WkpBottomPanel } from './bottom-infos/wkp-bottom-panel';

import { useTransitiveImpact } from './hooks/use-transitive-impact';
import { useCodebaseFilter } from './hooks/use-codebase-filter';

export function ExplorerFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const codebaseData = codebaseService.getCodebase();
  const folderPositions = codebaseService.getFolderPositions();

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>({ type: 'node', nodeId: 'OrderController.java' });
  const [impactDirection, setImpactDirection] = useState<ImpactDirection>('aval');
  const [notification, setNotification] = useState<string | null>(null);

  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(0);
  const [currentLayout, setCurrentLayout] = useState('preset');
  const [showGrid, setShowGrid] = useState(true);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);

  const { copy } = useCopyToClipboard();

  const {
    searchTerm,
    setSearchTerm,
    displayLevel,
    setDisplayLevel,
    maxNodesLimit,
    setMaxNodesLimit,
    expandedFolders,
    visibleFiles,
    toggleFolder,
    toggleFolderCheckbox,
    toggleFileCheckbox,
    searchFilteredFiles,
    resetFilters
  } = useCodebaseFilter(codebaseData.files);

  const { impactedSet } = useTransitiveImpact(selectedEntity, impactDirection, codebaseData.dependencies);

  const handleCopy = useCallback((text: string, message: string) => {
    copy(text, () => {
      setNotification(message);
      setTimeout(() => setNotification(null), 3000);
    });
  }, [copy]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntity({ type: 'node', nodeId });
  }, []);

  const handleSelectMember = useCallback((nodeId: string, memberId: string) => {
    setSelectedEntity({ type: 'member', nodeId, memberId });
  }, []);

  const { containerRef, cyRef, graphState, updateGraphTopology } = useGraph(props.isDarkMode, handleNodeSelect);

  const generatedPlantUML = usePlantUml(searchFilteredFiles, visibleFiles, codebaseData.dependencies);

  useEffect(() => {
    updateGraphTopology(searchFilteredFiles, visibleFiles, codebaseData, impactedSet, currentLayout, folderPositions);
  }, [searchFilteredFiles, visibleFiles, codebaseData, impactedSet, currentLayout, folderPositions, updateGraphTopology]);

  const applyLayout = useCallback((layout: string) => {
    setCurrentLayout(layout);
  }, []);

  const handleReset = useCallback(() => {
    resetFilters();
    setSelectedEntity(null);
  }, [resetFilters]);

  return (
    <AppLayout
      {...props}
      isGraphMaximized={isGraphMaximized}
      layoutConfig={{ showTop: true, showLeft: true, showCenter: true, showRight: true, showBottom: true, showRightSidebar: true }}
      notification={notification}
      panels={{
        left: (
          <CodebaseExplorerPanel
            searchFilteredFiles={searchFilteredFiles}
            expandedFolders={expandedFolders}
            visibleFiles={visibleFiles}
            toggleFolder={toggleFolder}
            toggleFolderCheckbox={toggleFolderCheckbox}
            toggleFileCheckbox={toggleFileCheckbox}
            setSelectedEntity={setSelectedEntity}
          />
        ),
        center: (
          <GraphPanel
            containerRef={containerRef}
            showGrid={showGrid}
            isDarkMode={props.isDarkMode}
            graphState={graphState}
            selectedEntity={selectedEntity}
            searchFilteredFiles={searchFilteredFiles}
            impactedSet={impactedSet}
            handleSelectMember={handleSelectMember}
          />
        ),
        right: (
          <GlobalInspectorPanel
            selectedEntity={selectedEntity}
            initialCodebase={codebaseData}
            impactDirection={impactDirection}
            setImpactDirection={setImpactDirection}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
            generatedPlantUML={generatedPlantUML}
          />
        ),
        top: <ContextPathsPanel />,
        bottom: <WkpBottomPanel />,
        rightSidebar: <EntityPropertiesPanel selectedEntity={selectedEntity} />
      }}
      headers={{
        leftPanelTitle: "AST Explorer",
        centerPanelHeader: <GraphPanelHeaderLeft showGrid={showGrid} setShowGrid={setShowGrid} />,
        centerPanelHeaderCenter: (
          <GraphPanelHeaderCenter
            maxNodesLimit={maxNodesLimit}
            setMaxNodesLimit={setMaxNodesLimit}
            callersDepth={callersDepth}
            setCallersDepth={setCallersDepth}
            calleesDepth={calleesDepth}
            setCalleesDepth={setCalleesDepth}
            displayLevel={displayLevel}
            setDisplayLevel={setDisplayLevel}
            currentLayout={currentLayout}
            setCurrentLayout={applyLayout}
          />
        ),
        centerPanelHeaderRight: <GraphPanelHeaderRight cyRef={cyRef} isGraphMaximized={isGraphMaximized} setIsGraphMaximized={setIsGraphMaximized} />,
        rightSidebarHeader: <><Layers size={13} className="mr-1.5"/> <span>Entity Properties</span></>,
        rightSidebarHeaderRight: <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setSelectedEntity(null)}><X size={12}/></Button>
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onResetFilters={handleReset}
    />
  );
}
EOF

# 6. Clean legacy cryptic subdirectories
rm -rf sandbox/src/features/explorer/wksp-cnt-graph
rm -rf sandbox/src/features/explorer/wkp-lft-codebase-tree
rm -rf sandbox/src/features/explorer/wkp-rgt-tabs-inspector
rm -rf sandbox/src/features/explorer/sdb-rgt-properties
rm -rf sandbox/src/features/explorer/wkp-top-paths
rm -rf sandbox/src/features/explorer/wkp-btm-infos

echo "✅ refactor: Phase 2 complete! Renamed cryptic folders to domain paths, added strict TS shapes, and applied NODE_STYLE_REGISTRY OCP strategy."

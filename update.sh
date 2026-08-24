#!/usr/bin/env bash
set -euo pipefail

# Ensure target directories exist
mkdir -p webview/src/features/explorer/wksp-cnt-graph/components
mkdir -p webview/src/features/explorer/wksp-cnt-graph/hooks
mkdir -p webview/src/features/explorer/layout-ctns

echo "📍 Patching useExplorerStore.ts with strongly typed graphRendering state..."

# Use a clean Python patcher file to avoid string escaping issues in bash
cat << 'EOF' > patch_store.py
import os, re, sys

store_path = "webview/src/features/explorer/store/useExplorerStore.ts"
if not os.path.exists(store_path):
    print(f"⚠️ File not found: {store_path}", file=sys.stderr)
    sys.exit(1)

with open(store_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1. Clean out any previous partial or corrupted injections
cleaned_lines = [
    line for line in lines
    if "graphRendering" not in line and "type-graph-rendering" not in line
]
content = "".join(cleaned_lines)

# 2. Add import for GraphRendering at top
import_stmt = "import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';\n"
content = import_stmt + content

# 3. Add strongly typed properties to interface ExplorerState
match_interface = re.search(r"(export\s+interface\s+ExplorerState\s*\{)", content)
if match_interface:
    pos = match_interface.end()
    content = content[:pos] + "\n  graphRendering: GraphRendering;\n  setGraphRendering: (graphRendering: GraphRendering) => void;" + content[pos:]

# 4. Add initial state and typed setter method to Zustand store creator
match_store = re.search(r"(create<ExplorerState>\s*\(\s*(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>\s*\{)", content)
if match_store:
    pos = match_store.end()
    content = content[:pos] + "\n  graphRendering: 'uml' as GraphRendering,\n  setGraphRendering: (graphRendering: GraphRendering) => set({ graphRendering })," + content[pos:]

with open(store_path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ Successfully patched useExplorerStore.ts with graphRendering state")
EOF

python3 patch_store.py
rm -f patch_store.py

# 1. Create Condensed Shapes component
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/components/GraphCondensedShapes.tsx
import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { UmlClassNodeData, NODE_STYLE_REGISTRY } from './GraphUmlShapes';

export const CondensedClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;

  let borderClass = style.border;
  let headerBg = `${style.bg} text-white`;
  let iconColor = style.iconColor;

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/80 ring-offset-2 ring-offset-background animate-pulse scale-105 shadow-2xl shadow-amber-500/50';
    headerBg = 'bg-amber-500/40 dark:bg-amber-500/45 text-foreground';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500 dark:text-amber-400';
  }

  const methodCount = data.methods?.length || 0;
  const attrCount = data.attributes?.length || 0;

  return (
    <div className={`w-56 bg-card rounded-md shadow-md border-2 ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden`}>
      <div className={`${headerBg} p-2 flex items-center justify-between gap-1.5`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <FileCode size={14} className={`${iconColor} shrink-0`} />
          <h4 className="font-mono font-bold text-xs truncate" title={data.name}>{data.name}</h4>
        </div>
        <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider shrink-0">
          {data.type}
        </span>
      </div>
      <div className="p-1.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground bg-muted/20">
        <span>Attr: <strong className="text-foreground">{attrCount}</strong></span>
        <span>Methods: <strong className="text-foreground">{methodCount}</strong></span>
        <span>LOC: <strong className="text-foreground">{data.size || 0}</strong></span>
      </div>
    </div>
  );
};

export const CondensedConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  let borderClass = 'border-amber-500';
  let headerBg = 'bg-amber-500 text-white';
  let iconColor = 'text-amber-100';

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/80 ring-offset-2 ring-offset-background animate-pulse scale-105 shadow-2xl shadow-amber-500/50';
    headerBg = 'bg-amber-500/40 dark:bg-amber-500/45 text-foreground';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500';
  }

  const propCount = data.configProperties?.length || 0;

  return (
    <div className={`w-60 bg-card rounded-md shadow-md border-2 ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden`}>
      <div className={`flex justify-between items-center ${headerBg} p-2`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <Settings size={14} className={`${iconColor} shrink-0`} />
          <h4 className="font-mono font-bold text-xs truncate" title={data.name}>{data.name}</h4>
        </div>
        <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest shrink-0">
          {propCount} Keys
        </span>
      </div>
    </div>
  );
};
EOF

# 2. Update use-graph-panel-header.ts
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/hooks/use-graph-panel-header.ts
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vscodeSettings } from '@/App';
import { useExplorerStore } from '@/features/explorer/store/useExplorerStore';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';

export function useGraphPanelHeader(cyRef?: React.RefObject<any>) {
  const currentLayout = useExplorerStore((s) => s.currentLayout);
  const setCurrentLayout = useExplorerStore((s) => s.setCurrentLayout);

  const currentRendering = useExplorerStore((s) => s.graphRendering) || 'uml';
  const setGraphRendering = useExplorerStore((s) => s.setGraphRendering);

  const setCurrentRendering = (val: GraphRendering) => {
    if (setGraphRendering) {
      setGraphRendering(val);
    }
  };

  const displayNeo4jHandler = () => {
    vsCodeApiService.openUrl(vscodeSettings.graphRagExplorer.neo4j.url, true);
  };

  const handleZoomIn = () => {
    cyRef?.current?.zoom((cyRef.current?.zoom() || 1) * 1.2);
  };

  const handleZoomOut = () => {
    cyRef?.current?.zoom((cyRef.current?.zoom() || 1) / 1.2);
  };

  const handleFitView = () => {
    cyRef?.current?.fit(undefined, 40);
    cyRef?.current?.center();
  };

  return {
    currentLayout,
    setCurrentLayout,
    currentRendering,
    setCurrentRendering,
    displayNeo4jHandler,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
  };
}
EOF

# 3. Update GraphPanelHeader.tsx
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanelHeader.tsx
import React from 'react';
import { Grid, Database, Plus, Minus, Focus, SquareFunction, Target, ListTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ToggleButton } from '@/components/app/toggle-button';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';

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

  const currentLayout = propCurrentLayout || storeLayout || 'preset';
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
        onChange={(val) => setCurrentLayout(val || 'preset')}
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
        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider"
        onClick={displayNeo4jHandler}
      >
        <Database size={11} /> Neo4j
      </Button>
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
        icon={<ListTree size={12} />}
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
EOF

# 4. Update useGraphTopology.ts
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/hooks/useGraphTopology.ts
import { useCallback, useRef } from 'react';
import cytoscape from 'cytoscape';
import {
  CodebaseData,
  CodebaseFile,
  Dependency,
  SelectedEntity,
} from '@/shared/services/graph-rag-explorer';
import { buildMemberKeyToken } from '@/services/view/graph-view.service';
import { FOLDER_BASE_X_POSITIONS_CONFIG } from '@/features/explorer/constants/graph.constants';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';

function getNodeDimensions(
  file: CodebaseFile,
  attributesVisible: boolean,
  methodsVisible: boolean,
  graphRendering: GraphRendering = 'uml'
): { width: number; height: number } {
  if (graphRendering === 'condensed') {
    if (file.type === 'config') {
      return { width: 240, height: 42 };
    }
    return { width: 224, height: 68 };
  }

  if (file.type === 'config') {
    return { width: 320, height: 240 };
  }

  const baseHeaderHeight = 76;

  let attrHeight = 0;
  if (attributesVisible) {
    const attrCount = file.attributes?.length || 0;
    attrHeight = attrCount > 0 ? 28 + attrCount * 18 : 36;
  }

  let methodHeight = 0;
  if (methodsVisible) {
    const methodCount = file.methods?.length || 0;
    methodHeight = methodCount > 0 ? 28 + methodCount * 32 : 36;
  }

  const totalHeight = baseHeaderHeight + attrHeight + methodHeight;
  return { width: 288, height: totalHeight };
}

function applyCustomHierarchicalLayout(
  cy: cytoscape.Core,
  effectiveFiles: CodebaseFile[],
  codebase: CodebaseData,
  attributesVisible: boolean,
  methodsVisible: boolean,
  graphRendering: GraphRendering
) {
  if (effectiveFiles.length === 0) return;

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  effectiveFiles.forEach(f => {
    inDegree.set(f.id, 0);
    adj.set(f.id, []);
  });

  codebase.dependencies.forEach(dep => {
    const src = dep.sourceNode || dep.source;
    const tgt = dep.targetNode || dep.target;
    if (src && tgt && inDegree.has(src) && inDegree.has(tgt) && src !== tgt) {
      adj.get(src)!.push(tgt);
      inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
    }
  });

  const levelMap = new Map<string, number>();
  const queue: string[] = [];

  effectiveFiles.forEach(f => {
    if ((inDegree.get(f.id) || 0) === 0) {
      levelMap.set(f.id, 0);
      queue.push(f.id);
    }
  });

  if (queue.length === 0 && effectiveFiles.length > 0) {
    levelMap.set(effectiveFiles[0].id, 0);
    queue.push(effectiveFiles[0].id);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levelMap.get(curr) || 0;

    const neighbors = adj.get(curr) || [];
    neighbors.forEach(nbr => {
      const nextLevel = currLevel + 1;
      if (!levelMap.has(nbr) || levelMap.get(nbr)! < nextLevel) {
        levelMap.set(nbr, nextLevel);
        queue.push(nbr);
      }
    });
  }

  effectiveFiles.forEach(f => {
    if (!levelMap.has(f.id)) {
      levelMap.set(f.id, 0);
    }
  });

  const maxLevel = Math.max(...Array.from(levelMap.values()), 0);
  const levels: CodebaseFile[][] = Array.from({ length: maxLevel + 1 }, () => []);

  effectiveFiles.forEach(f => {
    const lvl = levelMap.get(f.id) || 0;
    levels[lvl].push(f);
  });

  const edgeLabelLengths = new Map<string, number>();
  codebase.dependencies.forEach(dep => {
    const src = dep.sourceNode || dep.source;
    const tgt = dep.targetNode || dep.target;
    const label = dep.label || '';
    if (src && tgt && label) {
      const key1 = `${src}__${tgt}`;
      const key2 = `${tgt}__${src}`;
      edgeLabelLengths.set(key1, Math.max(edgeLabelLengths.get(key1) || 0, label.length));
      edgeLabelLengths.set(key2, Math.max(edgeLabelLengths.get(key2) || 0, label.length));
    }
  });

  let currentY = 80;

  levels.forEach((levelFiles) => {
    if (levelFiles.length === 0) return;

    const levelHeights = levelFiles.map(f => getNodeDimensions(f, attributesVisible, methodsVisible, graphRendering).height);
    const maxLevelHeight = Math.max(...levelHeights, 42);
    const dimsList = levelFiles.map(f => getNodeDimensions(f, attributesVisible, methodsVisible, graphRendering));

    const gaps: number[] = [];
    for (let i = 0; i < levelFiles.length - 1; i++) {
      const f1 = levelFiles[i].id;
      const f2 = levelFiles[i + 1].id;
      const labelLen = Math.max(
        edgeLabelLengths.get(`${f1}__${f2}`) || 0,
        edgeLabelLengths.get(`${f2}__${f1}`) || 0
      );
      const gapX = labelLen > 0 ? Math.round(labelLen * 7) + 20 : 10;
      gaps.push(gapX);
    }

    const totalLevelWidth = dimsList.reduce((acc, d) => acc + d.width, 0) + gaps.reduce((acc, g) => acc + g, 0);
    let currentX = 600 - totalLevelWidth / 2;

    levelFiles.forEach((file, idx) => {
      const cyNode = cy.getElementById(file.id);
      const dims = dimsList[idx];

      if (cyNode && cyNode.length > 0) {
        cyNode.position({
          x: currentX + dims.width / 2,
          y: currentY + maxLevelHeight / 2
        });
      }

      currentX += dims.width + (gaps[idx] || 10);
    });

    currentY += maxLevelHeight + 50;
  });
}

export function useGraphTopology(cyRef: React.RefObject<cytoscape.Core | null>) {
  const lastStructureKeyRef = useRef<string>('');

  const updateGraphTopology = useCallback((
    searchFilteredFiles: CodebaseFile[],
    visibleFiles: Record<string, boolean>,
    codebase: CodebaseData,
    impactedSet: Set<string>,
    currentLayout: string,
    folderPositions: Record<string, { label: string }>,
    attributesVisible: boolean = false,
    methodsVisible: boolean = true,
    selectedEntity: SelectedEntity | null = null,
    showSelectedOnly: boolean = false,
    graphRendering: GraphRendering = 'uml'
  ) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    const effectiveFiles = (showSelectedOnly && selectedEntity)
      ? searchFilteredFiles.filter(f => f.id === selectedEntity.nodeId || impactedSet.has(f.id))
      : searchFilteredFiles;

    const structureKey = JSON.stringify({
      files: effectiveFiles.map(f => f.id),
      visible: visibleFiles,
      layout: currentLayout,
      attributesVisible,
      methodsVisible,
      graphRendering,
      deps: codebase.dependencies.map(d => d.id)
    });

    const isStructureChanged = lastStructureKeyRef.current !== structureKey;

    if (isStructureChanged) {
      lastStructureKeyRef.current = structureKey;

      cy.elements().remove();

      const filesByFolder: Record<string, CodebaseFile[]> = {};
      effectiveFiles.forEach(file => {
        const folderKey = file.path.split('/')[0] || 'other';
        if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
        filesByFolder[folderKey].push(file);
      });

      const allFolderKeys = Array.from(
        new Set([...Object.keys(folderPositions), ...Object.keys(filesByFolder)])
      );

      let maxLabelLength = 0;
      codebase.dependencies.forEach(dep => {
        if (dep.label) {
          maxLabelLength = Math.max(maxLabelLength, dep.label.length);
        }
      });
      const dynamicGapX = maxLabelLength > 0 ? Math.round(maxLabelLength * 7) + 20 : 10;
      const gapY = 50;

      allFolderKeys.forEach(folderKey => {
        if ((filesByFolder[folderKey] || []).length > 0) {
          const label = folderPositions[folderKey]?.label || `📂 ${folderKey.charAt(0).toUpperCase() + folderKey.slice(1)}`;
          cy.add({ data: { id: `folder__${folderKey}`, label }, classes: 'folder' });
        }
      });

      allFolderKeys.forEach((folderKey, folderIdx) => {
        const folderFiles = filesByFolder[folderKey] || [];
        if (folderFiles.length === 0) return;

        const baseX = FOLDER_BASE_X_POSITIONS_CONFIG[folderKey as keyof typeof FOLDER_BASE_X_POSITIONS_CONFIG] || (40 + folderIdx * 450);

        const numCols = 2;
        let currentY = 80;
        const rowCount = Math.ceil(folderFiles.length / numCols);

        for (let r = 0; r < rowCount; r++) {
          const rowFiles = folderFiles.slice(r * numCols, (r + 1) * numCols);
          const rowHeights = rowFiles.map(f => getNodeDimensions(f, attributesVisible, methodsVisible, graphRendering).height);
          const maxRowHeight = Math.max(...rowHeights, 42);

          rowFiles.forEach((file, c) => {
            const dims = getNodeDimensions(file, attributesVisible, methodsVisible, graphRendering);
            const absX = baseX + 30 + c * (dims.width + dynamicGapX) + dims.width / 2;
            const absY = currentY + dims.height / 2;

            cy.add({
              data: {
                id: file.id,
                parent: `folder__${folderKey}`,
                width: dims.width,
                height: dims.height
              },
              position: { x: absX, y: absY }
            });
          });

          currentY += maxRowHeight + gapY;
        }
      });

      codebase.dependencies.forEach((dep: Dependency) => {
        const sourceNodeId = dep.sourceNode || dep.source;
        const targetNodeId = dep.targetNode || dep.target;

        if (
          sourceNodeId &&
          targetNodeId &&
          visibleFiles[sourceNodeId] &&
          visibleFiles[targetNodeId] &&
          cy.getElementById(sourceNodeId).length > 0 &&
          cy.getElementById(targetNodeId).length > 0
        ) {
          cy.add({
            data: { id: dep.id, source: sourceNodeId, target: targetNodeId, label: dep.label }
          });
        }
      });

      if (currentLayout === 'hierarchical' || currentLayout === 'breadthfirst' || currentLayout === 'dagre') {
        applyCustomHierarchicalLayout(cy, effectiveFiles, codebase, attributesVisible, methodsVisible, graphRendering);
      } else if (currentLayout !== 'preset') {
        cy.layout({
          name: currentLayout,
          animate: false,
          fit: true,
          padding: 30,
        } as cytoscape.LayoutOptions).run();
      }

      cy.fit(undefined, 30);
      if (cy.zoom() > 1) {
        cy.zoom(1);
      }
      cy.center();
    }

    codebase.dependencies.forEach((dep: Dependency) => {
      const edge = cy.getElementById(dep.id);
      if (edge && edge.length > 0) {
        const sourceNodeId = dep.sourceNode || dep.source;
        const targetNodeId = dep.targetNode || dep.target;
        const sourceHandle = dep.sourceHandle || 'header';
        const targetHandle = dep.targetHandle || 'header';

        if (sourceNodeId && targetNodeId) {
          const sourceKeyMember = buildMemberKeyToken(sourceNodeId, sourceHandle);
          const targetKeyMember = buildMemberKeyToken(targetNodeId, targetHandle);

          const isEdgeImpacted =
            (impactedSet.has(sourceNodeId) || impactedSet.has(sourceKeyMember)) &&
            (impactedSet.has(targetNodeId) || impactedSet.has(targetKeyMember));

          if (isEdgeImpacted) {
            edge.addClass('impacted');
          } else {
            edge.removeClass('impacted');
          }
        }
      }
    });

  }, [cyRef]);

  return { updateGraphTopology };
}
EOF

# 5. Update GraphPanel.tsx
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanel.tsx
import React from 'react';
import { Info } from 'lucide-react';
import { FolderNode, UmlClassNode, ConfigNode, UmlClassNodeData } from './components/GraphUmlShapes';
import { CondensedClassNode, CondensedConfigNode } from './components/GraphCondensedShapes';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { isMemberKeyForFileToken, extractMemberIdFromKeyToken } from '@/services/view/graph-view.service';
import { useGraphPanel } from './hooks/use-graph-panel';
import { GraphToolbar } from './Graph-toolbar';
import { useExplorerStore } from '../store/useExplorerStore';

interface GraphPanelProps {
  folderPositions: Record<string, { label: string }>;
  containerRef: (node: HTMLDivElement | null) => void;
  showGrid: boolean;
  isDarkMode: boolean;
  graphState: {
    zoom: number;
    pan: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  selectedEntity: SelectedEntity | null;
  focusedNodeId?: string | null;
  searchFilteredFiles: CodebaseFile[];
  impactedSet: Set<string>;
  handleSelectMember: (nodeId: string, memberId: string) => void;
  attributesVisible: boolean;
  methodsVisible: boolean;
  showSelectedOnly?: boolean;
}

export function GraphPanel({
  folderPositions,
  containerRef,
  showGrid,
  isDarkMode,
  graphState,
  selectedEntity,
  focusedNodeId,
  searchFilteredFiles,
  impactedSet,
  handleSelectMember,
  attributesVisible,
  methodsVisible,
  showSelectedOnly = false
}: GraphPanelProps) {
  const graphRendering = useExplorerStore((s) => s.graphRendering) || 'uml';

  const {
    effectiveFolderPositions,
    effectiveSearchFilteredFiles,
  } = useGraphPanel(
    folderPositions,
    graphState.nodePositions,
    showSelectedOnly,
    selectedEntity,
    searchFilteredFiles,
    impactedSet
  );

  return (
    <div className="relative inset-0 outline-none w-full h-full overflow-hidden">
      <GraphToolbar />

      <div
        ref={containerRef}
        className="z-0 absolute inset-0 w-full h-full"
        style={showGrid ? {
          backgroundImage: isDarkMode
            ? 'radial-gradient(#334155 1.2px, transparent 1.2px)'
            : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`,
          backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px`
        } : undefined}
      />

      <div
        className="z-10 absolute inset-0 origin-top-left pointer-events-none select-none"
        style={{ transform: `translate(${graphState.pan.x}px, ${graphState.pan.y}px) scale(${graphState.zoom})` }}
      >
        {Object.entries(effectiveFolderPositions).map(([folderKey, initialPos]) => {
          const bounds = graphState.nodePositions[`folder__${folderKey}`];
          if (!bounds) return null;
          const isSelected = selectedEntity?.nodeId === `folder__${folderKey}`;
          return (
            <div
              key={`folder-box-${folderKey}`}
              className="z-10 absolute transition-all duration-75 ease-out"
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              <FolderNode data={{ label: initialPos.label }} isSelected={isSelected} />
            </div>
          );
        })}

        {effectiveSearchFilteredFiles.map((file: CodebaseFile) => {
          const bounds = graphState.nodePositions[file.id];
          if (!bounds) return null;

          const impactedMembers: string[] = [];
          impactedSet.forEach(item => {
            if (isMemberKeyForFileToken(item, file.id)) {
              impactedMembers.push(extractMemberIdFromKeyToken(item));
            }
          });

          const isOrigin = selectedEntity?.nodeId === file.id;
          const isDependency = impactedSet.has(file.id) && !isOrigin;
          const isFocused = focusedNodeId === file.id;

          const nodeData: UmlClassNodeData = {
            ...file,
            isOrigin,
            isDependency,
            isFocused,
            impactedMembers,
            selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
            onSelectMember: handleSelectMember,
            attributesVisible,
            methodsVisible
          };

          return (
            <div
              key={file.id}
              className={`absolute transition-all duration-75 ease-out pointer-events-none ${isFocused ? 'z-30' : 'z-20'}`}
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              {file.type === 'config' ? (
                graphRendering === 'condensed' ? (
                  <CondensedConfigNode id={file.id} data={nodeData} />
                ) : (
                  <ConfigNode id={file.id} data={nodeData} />
                )
              ) : (
                graphRendering === 'condensed' ? (
                  <CondensedClassNode id={file.id} data={nodeData} />
                ) : (
                  <UmlClassNode id={file.id} data={nodeData} />
                )
              )}
            </div>
          );
        })}
      </div>

      <div
        id="cytoscape-engine-info"
        className="top-10 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto"
      >
        <div className="flex justify-between items-center gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            <span className="font-bold">Surgical Analysis (Cytoscape Engine)</span>
          </div>
          <button
            onClick={() => {
              const infoDiv = document.getElementById('cytoscape-engine-info');
              if (infoDiv) infoDiv.style.display = 'none';
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Drag-and-drop on headers and wheel zoom use Cytoscape's responsive architecture.
        </p>
      </div>
    </div>
  );
}
EOF

# 6. Update CenterPanelContainer.tsx
cat << 'EOF' > webview/src/features/explorer/layout-ctns/CenterPanelContainer.tsx
import React, { useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { GraphPanel } from '../wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from '../wksp-cnt-graph/GraphPanelHeader';
import { useCodebaseFilter } from '../hooks/use-codebase-filter';
import { useTransitiveImpact } from '../hooks/use-transitive-impact';
import { useGraph } from '../wksp-cnt-graph/hooks/use-graph';
import { useExplorerStore } from '../store/useExplorerStore';

export function CenterPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const folderPositions = useExplorerStore((s) => s.folderPositions);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const setSelectedEntity = useExplorerStore((s) => s.setSelectedEntity);
  const focusedNodeId = useExplorerStore((s) => s.focusedNodeId);

  const enableDownstream = useExplorerStore((s) => s.enableDownstream);
  const enableUpstream = useExplorerStore((s) => s.enableUpstream);

  const showGrid = useExplorerStore((s) => s.showGrid);
  const setShowGrid = useExplorerStore((s) => s.setShowGrid);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const setCallersDepth = useExplorerStore((s) => s.setCallersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setCalleesDepth = useExplorerStore((s) => s.setCalleesDepth);
  const currentLayout = useExplorerStore((s) => s.currentLayout);
  const setCurrentLayout = useExplorerStore((s) => s.setCurrentLayout);
  const graphRendering = useExplorerStore((s) => s.graphRendering) || 'uml';

  const attributesVisible = useExplorerStore((s) => s.attributesVisible);
  const setAttributesVisible = useExplorerStore((s) => s.setAttributesVisible);
  const methodsVisible = useExplorerStore((s) => s.methodsVisible);
  const setMethodsVisible = useExplorerStore((s) => s.setMethodsVisible);
  const showSelectedOnly = useExplorerStore((s) => s.showSelectedOnly);
  const setShowSelectedOnly = useExplorerStore((s) => s.setShowSelectedOnly);

  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      setSelectedEntity({ type: 'node', nodeId });
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Single-clicked graph item: ${nodeId}. Revealing path & copying to clipboard: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.copyToClipboard(targetFile.path);
      }
    },
    [codebase.files, setSelectedEntity]
  );

  const handleSelectMember = useCallback(
    (nodeId: string, memberId: string) => {
      setSelectedEntity({ type: 'member', nodeId, memberId });
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Single-clicked member item: ${memberId} in ${nodeId}. Revealing path & copying to clipboard: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.copyToClipboard(targetFile.path);
      }
    },
    [codebase.files, setSelectedEntity]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Double-clicked graph item: ${nodeId}. Opening file in VS Code: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
        vsCodeApiService.openFile(targetFile.path);
      }
    },
    [codebase.files]
  );

  const handleNodeCmdClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      const pathToAdd = targetFile?.path || nodeId;
      logInfo(`Cmd+Clicked graph item: ${nodeId}. Appending path to context paths panel: ${pathToAdd}`);
      vsCodeHandleMessage.emit('addPathToTop', { command: 'addPathToTop', payload: pathToAdd });
    },
    [codebase.files]
  );

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick,
    handleNodeCmdClick
  );

  useEffect(() => {
    if (!isReady || Object.keys(folderPositions).length === 0) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      folderPositions,
      attributesVisible,
      methodsVisible,
      selectedEntity,
      showSelectedOnly,
      graphRendering
    );
  }, [
    isReady,
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    folderPositions,
    attributesVisible,
    methodsVisible,
    selectedEntity,
    showSelectedOnly,
    graphRendering,
    updateGraphTopology,
  ]);

  return (
    <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        path="workspace.center"
        isHiddable={true}
        headerLeft={<GraphPanelHeaderLeft />}
        headerCenter={
          <GraphPanelHeaderCenter
            maxNodesLimit={filter.maxNodesLimit}
            setMaxNodesLimit={filter.setMaxNodesLimit}
            callersDepth={callersDepth}
            setCallersDepth={setCallersDepth}
            calleesDepth={calleesDepth}
            setCalleesDepth={setCalleesDepth}
            displayLevel={filter.displayLevel}
            setDisplayLevel={filter.setDisplayLevel}
            currentLayout={currentLayout}
            setCurrentLayout={setCurrentLayout}
          />
        }
        headerRight={
          <GraphPanelHeaderRight
            cyRef={cyRef}
            isGraphMaximized={false}
            setIsGraphMaximized={() => toggleContainerMaximized('workspace.center')}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            attributesVisible={attributesVisible}
            setAttributesVisible={setAttributesVisible}
            methodsVisible={methodsVisible}
            setMethodsVisible={setMethodsVisible}
            showSelectedOnly={showSelectedOnly}
            setShowSelectedOnly={setShowSelectedOnly}
          />
        }
      />
      <div className="relative flex-1 w-full h-full min-h-0">
        <GraphPanel
          folderPositions={folderPositions}
          containerRef={containerRef}
          showGrid={showGrid}
          isDarkMode={isDarkMode}
          graphState={graphState}
          selectedEntity={selectedEntity}
          focusedNodeId={focusedNodeId}
          searchFilteredFiles={filter.searchFilteredFiles}
          impactedSet={impactedSet}
          handleSelectMember={handleSelectMember}
          attributesVisible={attributesVisible}
          methodsVisible={methodsVisible}
          showSelectedOnly={showSelectedOnly}
        />
      </div>
    </div>
  );
}
EOF

# Compile to verify clean TypeScript compilation
npm run build

echo "✅ feat/fix: Successfully patched useExplorerStore.ts without Python syntax errors and compiled project with zero errors!"

#!/bin/bash
set -e

# Provide complete updated src/webview/components/ExplorerTab.tsx file
# to fix the TypeScript signature mismatch where useGraphSelection expects 'types: Set<string>'
cat << 'EOF' > src/webview/components/ExplorerTab.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { TreeView } from './explorer-tab/tree/TreeView';
import { GraphView } from './explorer-tab/graph/GraphView';
import { useGraphSelection } from '../hooks/useGraphSelection';
import { useCytoscapeGraph } from './explorer-tab/graph/useCytoscapeGraph';

interface ExplorerTabProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    filters: any;
    config?: any;
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({
    nodes, edges, selectedNodeIds, setSelectedNodeIds, filters, config
}) => {
    const { applyOnGraph, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase } = filters;

    const [isTreeCollapsed, setIsTreeCollapsed] = useState<boolean>(false);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [showLegend, setShowLegend] = useState<boolean>(config?.graphLegendEnabled ?? true);

    const [parentDepth, setParentDepth] = useState<number>(config?.callersDepth ?? 1);
    const [childDepth, setChildDepth] = useState<number>(config?.calleesDepth ?? 1);

    const [isHierarchyEnabled, setIsHierarchyEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (config) {
            setShowLegend(config.graphLegendEnabled ?? true);
            setParentDepth(config.callersDepth ?? 1);
            setChildDepth(config.calleesDepth ?? 1);
        }
    }, [config]);

    // Re-map entity lookup bounds to classes exclusively
    const nodeToFileIdMap = useMemo(() => {
        const map = new Map<string, string>();
        (nodes || []).filter(n => n.group === 'class').forEach(c => map.set(c.id, c.id));
        return map;
    }, [nodes]);

    const fileLevelEdges = useMemo(() => {
        return (edges || []).map(e => ({
            from: e.from,
            to: e.to,
            types: new Set([e.type])
        }));
    }, [edges]);

    const {
        exactSelectedIds,
        effectiveFileIds,
        toggleNodeSelection,
        setNodesSelectionState,
        clearSelection
    } = useGraphSelection(fileLevelEdges, nodeToFileIdMap, parentDepth, childDepth, isHierarchyEnabled);

    useEffect(() => {
        setSelectedNodeIds(exactSelectedIds);
    }, [exactSelectedIds, setSelectedNodeIds]);

    const prevSelectedSizeRef = useRef<number>(selectedNodeIds.size);
    useEffect(() => {
        if (selectedNodeIds.size === 0 && prevSelectedSizeRef.current > 0 && exactSelectedIds.size > 0) {
            clearSelection();
        }
        prevSelectedSizeRef.current = selectedNodeIds.size;
    }, [selectedNodeIds, exactSelectedIds, clearSelection]);

    const { containerRef, networkRef } = useCytoscapeGraph({
        nodes,
        fileLevelEdges,
        nodeToFileIdMap,
        effectiveFileIds,
        exactSelectedIds,
        toggleNodeSelection,
        clearSelection,
        applyOnGraph,
        selectedTypes,
        searchText,
        searchMode,
        isRegexEnabled,
        ignoreCase,
        isTreeCollapsed,
        isMaximized
    });

    return (
        <div id="tab-explorer-content" className="relative flex items-stretch w-full h-full min-h-0">
            <div className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] shadow-[2px_0_8px_var(--vscode-widget-shadow)] z-0 bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? 'hidden' : 'w-[465px]'}`}>
                <TreeView
                    nodes={nodes}
                    edges={edges}
                    exactSelectedIds={exactSelectedIds}
                    effectiveFileIds={effectiveFileIds}
                    toggleNodeSelection={toggleNodeSelection}
                    setNodesSelectionState={setNodesSelectionState}
                    clearSelection={clearSelection}
                    networkRef={networkRef}
                    isHierarchyEnabled={isHierarchyEnabled}
                    setIsHierarchyEnabled={setIsHierarchyEnabled}
                    filters={filters}
                />
            </div>
            <GraphView
                containerRef={containerRef} isMaximized={isMaximized} setIsMaximized={setIsMaximized}
                isTreeCollapsed={isTreeCollapsed} setIsTreeCollapsed={setIsTreeCollapsed}
                parentDepth={parentDepth} setParentDepth={setParentDepth} childDepth={childDepth} setChildDepth={setChildDepth}
                networkRef={networkRef} showLegend={showLegend} setShowLegend={setShowLegend}
                neo4jUrl={config?.neo4jUrl}
            />
        </div>
    );
};
EOF

# Trigger compilation to verify configuration is fully clean
npm run package

echo "✅ fix: Converted edge 'type' string into a 'types' Set in ExplorerTab to solve compilation error TS2345!"

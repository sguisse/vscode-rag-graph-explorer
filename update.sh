#!/bin/bash

# Ensure target directory structure exists
mkdir -p src/webview/components/explorer-tab

# 1. Provide the complete /full content of ExplorerTabContainer.tsx with fixed common prefix calculation and single root layout
cat << 'EOF' > src/webview/components/explorer-tab/ExplorerTabContainer.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DataSet } from 'vis-network/standalone';
import { Network } from 'vis-network';
import { GraphNode, GraphEdge } from '../../types';
import { TreeView } from './TreeView';
import { GraphView } from './GraphView';
import { useGraphSelection } from '../../hooks/useGraphSelection';

interface ExplorerTabContainerProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    filters: any;
    config?: any;
}

interface TreeElement {
    id: string;
    label: string;
    isGroup: boolean;
    icon?: string;
    node?: GraphNode;
    children?: TreeElement[];
    allLeafIds: string[];
    folderPath?: string;
}

export const ExplorerTabContainer: React.FC<ExplorerTabContainerProps> = ({
    nodes, edges, selectedNodeIds, setSelectedNodeIds, filters, config
}) => {
    const { applyOnGraph, applyOnTree, selectedTypes, searchText, searchMode, isRegexEnabled } = filters;

    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);

    const visNodesRef = useRef<DataSet<any>>(new DataSet([]));
    const visEdgesRef = useRef<DataSet<any>>(new DataSet([]));

    const [isTreeCollapsed, setIsTreeCollapsed] = useState<boolean>(false);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [showLegend, setShowLegend] = useState<boolean>(config?.graphLegendEnabled ?? true);

    const [treeGrouping, setTreeGrouping] = useState<'folder' | 'extension' | 'root'>('folder');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [ignoreCase, setIgnoreCase] = useState(true);
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    const [parentDepth, setParentDepth] = useState<number>(config?.callersDepth ?? 1);
    const [childDepth, setChildDepth] = useState<number>(config?.calleesDepth ?? 1);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    const [isHierarchyEnabled, setIsHierarchyEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (config) {
            setShowLegend(config.graphLegendEnabled ?? true);
            setParentDepth(config.callersDepth ?? 1);
            setChildDepth(config.calleesDepth ?? 1);
        }
    }, [config]);

    const nodeToFileIdMap = useMemo(() => {
        const map = new Map<string, string>();
        const fileNodes = nodes.filter(n => n.group === 'file');
        fileNodes.forEach(f => map.set(f.id, f.id));
        nodes.forEach(n => {
            if (n.group !== 'file' && n.source_file) {
                const matchingFile = fileNodes.find(f => f.source_file === n.source_file || f.label === n.source_file || f.id === n.source_file);
                if (matchingFile) map.set(n.id, matchingFile.id);
            }
        });
        return map;
    }, [nodes]);

    const { parentMap, childrenMap } = useMemo(() => {
        const pMap: { [key: string]: string } = {};
        const cMap: { [key: string]: string[] } = {};
        edges.forEach(e => {
            if (e.type === 'contains' || e.type === 'relation') {
                pMap[e.to] = e.from;
                if (!cMap[e.from]) cMap[e.from] = [];
                cMap[e.from].push(e.to);
            }
        });
        return { parentMap: pMap, childrenMap: cMap };
    }, [edges]);

    const fileLevelEdges = useMemo(() => {
        const fileEdgesMap = new Map<string, { from: string, to: string, types: Set<string> }>();
        edges.forEach(e => {
            const fromFileId = nodeToFileIdMap.get(e.from);
            const toFileId = nodeToFileIdMap.get(e.to);
            if (fromFileId && toFileId && fromFileId !== toFileId) {
                const key = `${fromFileId}->${toFileId}`;
                if (!fileEdgesMap.has(key)) {
                    fileEdgesMap.set(key, { from: fromFileId, to: toFileId, types: new Set() });
                }
                fileEdgesMap.get(key)!.types.add(e.type);
            }
        });
        return Array.from(fileEdgesMap.values());
    }, [edges, nodeToFileIdMap]);

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

    useEffect(() => {
        if (selectedNodeIds.size === 0 && exactSelectedIds.size > 0) {
            clearSelection();
        }
    }, [selectedNodeIds, exactSelectedIds, clearSelection]);

    useEffect(() => {
        if (!containerRef.current) return;

        const options = {
            interaction: {
                multiselect: true,
                selectConnectedEdges: false
            },
            nodes: {
                shape: 'dot', size: 16,
                font: { color: '#e5e7eb', face: 'var(--vscode-font-family)', size: 12 },
                borderWidth: 2, shadow: true
            },
            edges: {
                width: 1.5, color: { color: '#9ca3af', highlight: '#3b82f6' },
                arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                smooth: { enabled: true, type: 'continuous', roundness: 0.5 }
            },
            groups: {
                file: { color: { background: '#3b82f6', border: '#2563eb' }, shape: 'hexagon', size: 20, font: { color: 'rgba(59, 130, 246, 0.85)' } }
            },
            physics: {
                solver: 'forceAtlas2Based',
                forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100 },
                stabilization: { iterations: 150 }
            }
        };

        const network = new Network(containerRef.current, { nodes: visNodesRef.current, edges: visEdgesRef.current }, options as any);
        networkRef.current = network;

        network.on("stabilizationIterationsDone", () => { network.setOptions({ physics: false } as any); });

        network.on("click", (params) => {
            if (params.nodes.length > 0) {
                toggleNodeSelection(String(params.nodes[0]));
            }
            network.unselectAll();
        });

        return () => { network.destroy(); };
    }, [toggleNodeSelection]);

    useEffect(() => {
        visNodesRef.current.clear();
        visEdgesRef.current.clear();

        const fileNodes = nodes.filter(n => n.group === 'file');
        visNodesRef.current.add(fileNodes.map(n => ({ id: n.id, label: n.label, group: n.group, title: n.label })));

        const synthesizedEdges = fileLevelEdges.map((fe, index) => ({ id: index, from: fe.from, to: fe.to, type: Array.from(fe.types).join(', ') }));
        visEdgesRef.current.add(synthesizedEdges);

        if (networkRef.current) {
            networkRef.current.setOptions({ physics: true } as any);
            networkRef.current.stabilize();
        }
    }, [nodes, fileLevelEdges]);

    useEffect(() => {
        const fileNodes = nodes.filter(n => n.group === 'file');
        const nodeUpdates = fileNodes.map(f => {
            let isVisible = true;
            if (applyOnGraph) {
                const relatedNodes = nodes.filter(n => nodeToFileIdMap.get(n.id) === f.id);
                const filteredRelated = selectedTypes.length > 0 ? relatedNodes.filter(rn => selectedTypes.includes(rn.group)) : relatedNodes;
                if (filteredRelated.length === 0) isVisible = false;
                else if (searchText) {
                    const queryStr = ignoreCase ? searchText.toLowerCase() : searchText;
                    const matchesSearch = filteredRelated.some(rn => {
                        const labelStr = ignoreCase ? rn.label.toLowerCase() : rn.label;
                        if (isRegexEnabled) {
                            try { return new RegExp(queryStr).test(labelStr); } catch { return true; }
                        } else {
                            return searchMode === 'exact' ? labelStr === queryStr : labelStr.includes(queryStr);
                        }
                    });
                    if (!matchesSearch) isVisible = false;
                }
            }

            const isContextuallySelected = effectiveFileIds.has(f.id);
            const isExactlySelected = exactSelectedIds.has(f.id);

            return {
                id: f.id,
                hidden: !isVisible,
                opacity: effectiveFileIds.size === 0 ? 1 : (isContextuallySelected ? 1 : 0.18),
                shadow: isContextuallySelected,
                borderWidth: isExactlySelected ? 5 : (isContextuallySelected ? 2 : 1)
            };
        });

        if (nodeUpdates.length > 0) visNodesRef.current.update(nodeUpdates);

        const edgeUpdates = fileLevelEdges.map((fe, index) => {
            const isHighlighted = effectiveFileIds.has(fe.from) && effectiveFileIds.has(fe.to);
            return { id: index, color: isHighlighted ? '#3b82f6' : '#4b5563', width: isHighlighted ? 2.5 : 1 };
        });

        if (edgeUpdates.length > 0) visEdgesRef.current.update(edgeUpdates);

    }, [effectiveFileIds, exactSelectedIds, applyOnGraph, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase, nodes, fileLevelEdges, nodeToFileIdMap]);

    useEffect(() => {
        if (networkRef.current) {
            setTimeout(() => {
                networkRef.current?.setSize('100%', '100%');
                networkRef.current?.redraw();
            }, 100);
        }
    }, [isTreeCollapsed, isMaximized]);

    const treeSelectionDep = showOnlySelected ? exactSelectedIds : null;

    const strictlyVisibleIds = useMemo(() => {
        const visible = new Set<string>();
        nodes.forEach(n => {
            if (!applyOnTree) {
                visible.add(n.id);
                return;
            }

            if (treeSelectionDep) {
                if (!treeSelectionDep.has(n.id)) return;
            }

            if (selectedTypes.length > 0 && !selectedTypes.includes(n.group)) return;
            if (!searchText) {
                visible.add(n.id);
                return;
            }

            const labelStr = ignoreCase ? n.label.toLowerCase() : n.label;
            const queryStr = ignoreCase ? searchText.toLowerCase() : searchText;
            let matches = false;
            if (isRegexEnabled) {
                try { matches = new RegExp(queryStr).test(labelStr); } catch { matches = true; }
            } else {
                matches = searchMode === 'exact' ? labelStr === queryStr : labelStr.includes(queryStr);
            }
            if (matches) visible.add(n.id);
        });
        return visible;
    }, [nodes, applyOnTree, showOnlySelected, treeSelectionDep, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase]);

    const hierarchicallyVisibleIds = useMemo(() => {
        const visible = new Set<string>(strictlyVisibleIds);
        let added = true;
        while (added) {
            added = false;
            for (const id of Array.from(visible)) {
                const pid = parentMap[id];
                if (pid && !visible.has(pid)) {
                    visible.add(pid);
                    added = true;
                }
            }
        }
        return visible;
    }, [strictlyVisibleIds, parentMap]);

    const treeData = useMemo((): TreeElement[] => {
        const visibleNodes = nodes.filter(n => hierarchicallyVisibleIds.has(n.id));
        const sortNodes = (arr: GraphNode[]) => arr.sort((a, b) => a.label.localeCompare(b.label));

        let commonPrefix: string[] = [];
        let workspaceName = 'Workspace';
        let commonPrefixPath = '';

        const fileNodes = nodes.filter(n => n.group === 'file' && n.source_file);
        if (fileNodes.length > 0) {
            const splitPaths = fileNodes.map(n => n.source_file!.split('/').filter(Boolean));
            for (let i = 0; i < splitPaths[0].length; i++) {
                const part = splitPaths[0][i];
                if (splitPaths.every(p => p[i] === part)) {
                    commonPrefix.push(part);
                } else {
                    break;
                }
            }
            workspaceName = commonPrefix.length > 0 ? commonPrefix[commonPrefix.length - 1] : 'Workspace';

            const firstPath = fileNodes[0].source_file as string;
            commonPrefixPath = commonPrefix.join('/');
            if (firstPath.startsWith('/')) {
                commonPrefixPath = '/' + commonPrefixPath;
            }
        }

        const buildNodeSubtree = (node: GraphNode): TreeElement => {
            const childIds = childrenMap[node.id] || [];
            const visibleChildrenIds = childIds.filter(cid => hierarchicallyVisibleIds.has(cid));
            const sortedChildren = sortNodes(nodes.filter(n => visibleChildrenIds.includes(n.id)));
            const childrenElements = sortedChildren.map(cn => buildNodeSubtree(cn));
            const allLeafIds = [node.id];
            childrenElements.forEach(c => allLeafIds.push(...c.allLeafIds));

            return { id: node.id, label: node.label, isGroup: false, node, children: childrenElements.length > 0 ? childrenElements : undefined, allLeafIds };
        };

        const rootNodes = visibleNodes.filter(n => !parentMap[n.id] || !hierarchicallyVisibleIds.has(parentMap[n.id]));
        const sortedRoots = sortNodes(rootNodes);

        let result: TreeElement[] = [];

        if (treeGrouping === 'root') {
            result = sortedRoots.map(rn => buildNodeSubtree(rn));
        } else if (treeGrouping === 'extension') {
            const extGroups: { [key: string]: GraphNode[] } = {};
            const nonExtRoots: GraphNode[] = [];
            sortedRoots.forEach(rn => {
                if (rn.group === 'file' || rn.group === 'document') {
                    const ext = rn.label.includes('.') ? '.' + rn.label.split('.').pop() : 'No extension';
                    if (!extGroups[ext]) extGroups[ext] = [];
                    extGroups[ext].push(rn);
                } else nonExtRoots.push(rn);
            });
            const groupElements: TreeElement[] = Object.keys(extGroups).sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)).map(ext => {
                const children = extGroups[ext].map(rn => buildNodeSubtree(rn));
                const allLeafIds: string[] = [];
                children.forEach(c => allLeafIds.push(...c.allLeafIds));
                return { id: `ext-${ext}`, label: ext, isGroup: true, icon: '🗂️', children, allLeafIds };
            });
            result = [...groupElements, ...nonExtRoots.map(rn => buildNodeSubtree(rn))];
        } else if (treeGrouping === 'folder') {
            interface FolderNode { name: string; path: string; nodes: GraphNode[]; subfolders: { [key: string]: FolderNode }; }
            const rootFolder: FolderNode = { name: '', path: commonPrefixPath, nodes: [], subfolders: {} };
            const nonFolderRoots: GraphNode[] = [];

            sortedRoots.forEach(rn => {
                if ((rn.group === 'file' || rn.group === 'document') && rn.source_file) {
                    const parts = rn.source_file.split('/').filter(Boolean);
                    const relParts = parts.slice(commonPrefix.length);

                    let current = rootFolder;
                    let accumulatedPath = commonPrefixPath;
                    for (let i = 0; i < relParts.length - 1; i++) {
                        const part = relParts[i];
                        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
                        if (!current.subfolders[part]) current.subfolders[part] = { name: part, path: accumulatedPath, nodes: [], subfolders: {} };
                        current = current.subfolders[part];
                    }
                    current.nodes.push(rn);
                } else nonFolderRoots.push(rn);
            });

            const convertFolderToTreeElement = (folder: FolderNode, pathName: string): TreeElement => {
                const subfolderElements = Object.keys(folder.subfolders).sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)).map(k => convertFolderToTreeElement(folder.subfolders[k], k));
                const nodeElements = sortNodes(folder.nodes).map(n => buildNodeSubtree(n));
                const combinedChildren = [...subfolderElements, ...nodeElements];
                const allLeafIds: string[] = [];
                combinedChildren.forEach(c => allLeafIds.push(...c.allLeafIds));

                return { id: `folder-${folder.path || 'root'}`, label: pathName || 'Workspace', isGroup: true, icon: '🗂️', children: combinedChildren, allLeafIds, folderPath: folder.path || undefined };
            };
            const builtRoot = convertFolderToTreeElement(rootFolder, workspaceName);
            result = [...(builtRoot.children || []), ...nonFolderRoots.map(rn => buildNodeSubtree(rn))];
        }

        const allLeafIds: string[] = [];
        result.forEach(child => allLeafIds.push(...child.allLeafIds));

        const workspaceRoot: TreeElement = {
            id: 'workspace-root',
            label: workspaceName,
            isGroup: true,
            icon: '💻',
            children: result,
            allLeafIds: allLeafIds,
            folderPath: commonPrefixPath || undefined
        };

        return [workspaceRoot];
    }, [nodes, parentMap, childrenMap, hierarchicallyVisibleIds, treeGrouping, sortOrder]);

    const handleExpandAll = () => setCollapsedIds(new Set());
    const handleCollapseAll = () => {
        const nextCollapsed = new Set<string>();
        const collapseChildrenRecursive = (elements: any[]) => {
            elements.forEach(el => {
                if (el.isGroup) {
                    nextCollapsed.add(el.id);
                    if (el.children) collapseChildrenRecursive(el.children);
                }
            });
        };
        collapseChildrenRecursive(treeData);
        setCollapsedIds(nextCollapsed);
    };

    return (
        <div className="relative flex items-stretch w-full h-full min-h-0">
            <div className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] shadow-[2px_0_8px_var(--vscode-widget-shadow)] z-0 bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? 'hidden' : 'w-[465px]'}`}>
                <TreeView
                    nodes={nodes}
                    exactSelectedIds={exactSelectedIds}
                    effectiveFileIds={effectiveFileIds}
                    toggleNodeSelection={toggleNodeSelection}
                    setNodesSelectionState={setNodesSelectionState}
                    clearSelection={clearSelection}
                    treeData={treeData}
                    sortOrder={sortOrder} setSortOrder={setSortOrder} ignoreCase={ignoreCase} setIgnoreCase={setIgnoreCase}
                    treeGrouping={treeGrouping} setTreeGrouping={setTreeGrouping} showOnlySelected={showOnlySelected}
                    setShowOnlySelected={setShowOnlySelected} collapsedIds={collapsedIds} setCollapsedIds={setCollapsedIds}
                    handleExpandAll={handleExpandAll} handleCollapseAll={handleCollapseAll} networkRef={networkRef}
                    isHierarchyEnabled={isHierarchyEnabled} setIsHierarchyEnabled={setIsHierarchyEnabled}
                />
            </div>
            <GraphView
                containerRef={containerRef} isMaximized={isMaximized} setIsMaximized={setIsMaximized}
                isTreeCollapsed={isTreeCollapsed} setIsTreeCollapsed={setIsTreeCollapsed}
                parentDepth={parentDepth} setParentDepth={setParentDepth} childDepth={childDepth} setChildDepth={setChildDepth}
                networkRef={networkRef} showLegend={showLegend} setShowLegend={setShowLegend}
            />
        </div>
    );
};
EOF

# 2. Provide the complete /full content of TreeView.tsx with precise tooltips and stable checking logic
cat << 'EOF' > src/webview/components/explorer-tab/TreeView.tsx
import React from 'react';
import { GraphNode } from '../../types';

interface TreeElement {
    id: string;
    label: string;
    isGroup: boolean;
    icon?: string;
    node?: GraphNode;
    children?: TreeElement[];
    allLeafIds: string[];
    folderPath?: string;
}

interface TreeViewProps {
    nodes: GraphNode[];
    exactSelectedIds: Set<string>;
    effectiveFileIds: Set<string>;
    toggleNodeSelection: (id: string) => void;
    setNodesSelectionState: (ids: string[], checked: boolean) => void;
    clearSelection: () => void;
    treeData: TreeElement[];
    sortOrder: 'asc' | 'desc';
    setSortOrder: (val: 'asc' | 'desc') => void;
    ignoreCase: boolean;
    setIgnoreCase: (val: boolean) => void;
    treeGrouping: 'folder' | 'extension' | 'root';
    setTreeGrouping: (val: 'folder' | 'extension' | 'root') => void;
    showOnlySelected: boolean;
    setShowOnlySelected: (val: boolean) => void;
    collapsedIds: Set<string>;
    setCollapsedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    handleExpandAll: () => void;
    handleCollapseAll: () => void;
    networkRef: React.RefObject<any>;
    isHierarchyEnabled: boolean;
    setIsHierarchyEnabled: (val: boolean) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
    nodes, exactSelectedIds, effectiveFileIds, toggleNodeSelection, setNodesSelectionState, clearSelection,
    treeData, sortOrder, setSortOrder, ignoreCase, setIgnoreCase, treeGrouping, setTreeGrouping,
    showOnlySelected, setShowOnlySelected, collapsedIds, setCollapsedIds,
    handleExpandAll, handleCollapseAll, networkRef, isHierarchyEnabled, setIsHierarchyEnabled
}) => {

    const handleClearSelectionWithConfirm = () => {
        if (exactSelectedIds.size === 0) return;
        if (window.confirm(`Clear selection of all ${exactSelectedIds.size} node(s)?`)) {
            clearSelection();
        }
    };

    const renderTreeElements = (elements: TreeElement[]): React.ReactNode => {
        return elements.map(el => {
            if (el.isGroup) {
                const isGroupOpen = !collapsedIds.has(el.id);
                const isChecked = el.allLeafIds.length > 0 && el.allLeafIds.every(id => exactSelectedIds.has(id));
                const isIndeterminate = !isChecked && el.allLeafIds.some(id => exactSelectedIds.has(id));

                const tooltipMessage = el.id === 'workspace-root'
                    ? (el.folderPath ? `Workspace Absolute Context: ${el.folderPath}` : 'Workspace')
                    : (el.folderPath ? `Path: ${el.folderPath}` : undefined);

                return (
                    <details key={el.id} className="w-full select-none" open={isGroupOpen}>
                        <summary
                            className="[&::-webkit-details-marker]:hidden flex items-center gap-1.5 px-1.5 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer list-none hover:bg-[var(--vscode-list-hoverBackground)]"
                            data-tooltip={tooltipMessage}
                            onClick={(e) => {
                                e.preventDefault();
                                if ((window as any).vscodeApi && el.folderPath) {
                                    try {
                                        (window as any).vscodeApi.postMessage({ command: 'revealFile', path: el.folderPath, openEditor: false });
                                    } catch (err) {}
                                }
                                setCollapsedIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(el.id)) next.delete(el.id);
                                    else next.add(el.id);
                                    return next;
                                });
                            }}
                        >
                            <span className={`codicon transition-transform duration-200 ${isGroupOpen ? 'codicon-chevron-down' : 'codicon-chevron-right'} text-[12px] flex-shrink-0 w-3 text-center`}></span>
                            <input
                                type="checkbox"
                                className="flex-shrink-0 w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                                checked={isChecked}
                                ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                                onChange={(e) => setNodesSelectionState(el.allLeafIds, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="flex-shrink-0 opacity-90 text-xs">{el.icon}</span>
                            <span className="flex-1 text-[var(--vscode-foreground)] truncate tracking-wide">{el.label}</span>
                        </summary>
                        <div className="space-y-0 mt-0 ml-[24px] pl-2 border-[var(--vscode-panel-border)] border-l">
                            {renderTreeElements(el.children || [])}
                        </div>
                    </details>
                );
            } else {
                const isChecked = exactSelectedIds.has(el.id);

                return (
                    <div key={el.id} className="group flex items-center gap-1.5 px-1.5 py-0.5 rounded-md w-full transition-colors hover:bg-[var(--vscode-list-hoverBackground)]">
                        <span className="w-3 flex-shrink-0" />
                        <input
                            type="checkbox"
                            className="flex-shrink-0 w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                            checked={isChecked}
                            onChange={() => toggleNodeSelection(el.id)}
                        />
                        <span className="flex-shrink-0 opacity-80 text-xs">
                            {el.node?.group === 'file' ? '📂' : el.node?.group === 'class' ? '📦' : el.node?.group === 'method' ? '⚡' : '📄'}
                        </span>
                        <span
                            className="flex-1 text-[var(--vscode-foreground)] hover:text-blue-400 text-xs truncate transition-colors cursor-pointer select-none"
                            onClick={() => {
                                if (networkRef.current) {
                                    networkRef.current.focus(el.id, { scale: 1.2, animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
                                }
                            }}
                            onDoubleClick={() => {
                                clearSelection();
                                toggleNodeSelection(el.id);
                                if ((window as any).vscodeApi && el.node?.group === 'file' && el.node.source_file) {
                                    try {
                                        (window as any).vscodeApi.postMessage({ command: 'revealFile', path: el.node.source_file, openEditor: true });
                                    } catch (err) {}
                                }
                            }}
                        >
                            {el.label}
                        </span>
                    </div>
                );
            }
        });
    };

    return (
        <>
            <div className="z-10 relative flex flex-col flex-shrink-0 justify-center bg-[var(--vscode-editorGroupHeader-tabsBackground)] shadow-[0_2px_4px_var(--vscode-widget-shadow)] px-3 border-[var(--vscode-panel-border)] border-b h-10">
                <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-[11px] uppercase tracking-wider">Tree&nbsp;View</span>
                    <div className="flex items-center">
                        <button onClick={() => setSortOrder('asc')} className={`w-7 h-7 flex items-center justify-center rounded-md text-xs ${sortOrder === 'asc' ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}>▲</button>
                        <button onClick={() => setSortOrder('desc')} className={`w-7 h-7 flex items-center justify-center rounded-md text-xs ${sortOrder === 'desc' ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}>▼</button>
                        <button onClick={() => setIgnoreCase(!ignoreCase)} className={`w-7 h-7 flex items-center justify-center text-xs font-mono rounded-md ${ignoreCase ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}>Aa</button>

                        <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5" />

                        <button onClick={handleExpandAll} className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded-md w-7 h-7 codicon codicon-expand-all"></button>
                        <button onClick={handleCollapseAll} className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded-md w-7 h-7 codicon codicon-collapse-all"></button>

                        <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5" />

                        <button
                            onClick={() => setIsHierarchyEnabled(!isHierarchyEnabled)}
                            className={`w-7 h-7 mr-1 flex items-center justify-center codicon codicon-references rounded-md transition-all duration-200 ${isHierarchyEnabled ? 'text-blue-500 bg-blue-500/10 border border-blue-500/20 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)] opacity-60'}`}
                            data-tooltip={isHierarchyEnabled ? "Hierarchy Link Sync active (Forcing Callers/Callees)" : "Hierarchy Link Sync inactive (Manual Tuning enabled)"}
                        />

                        <select
                            value={treeGrouping}
                            onChange={(e: any) => setTreeGrouping(e.target.value)}
                            className="bg-[var(--vscode-input-background)] shadow-sm py-1 pr-2 border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-md outline-none max-w-[95px] h-7 font-semibold text-[var(--vscode-input-foreground)] text-xs cursor-pointer"
                        >
                            <option value="folder">📂 Folder</option>
                            <option value="extension">⚙️ Extension</option>
                            <option value="root">📄 Flat</option>
                        </select>

                        <button onClick={() => setShowOnlySelected(!showOnlySelected)} className={`w-7 h-7 flex items-center justify-center codicon codicon-eye rounded-md ${showOnlySelected ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}></button>

                        <button
                            onClick={() => {
                                const paths = Array.from(new Set(nodes.filter(n => effectiveFileIds.has(n.id) && n.source_file).map(n => n.source_file as string)));
                                if (paths.length > 0) {
                                    if ((window as any).vscodeApi) {
                                        (window as any).vscodeApi.postMessage({ command: 'publishToSharedList', paths });
                                    }
                                } else {
                                    if ((window as any).vscodeApi) {
                                        (window as any).vscodeApi.postMessage({ command: 'showNotification', type: 'warn', text: 'No files selected to publish.' });
                                    }
                                }
                            }}
                            className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded-md w-7 h-7 text-[var(--vscode-foreground)] hover:text-blue-400 text-sm codicon codicon-cloud-upload"
                            data-tooltip="Publish selected files to Files Exporter shared list"
                        ></button>

                        <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5" />

                        <button onClick={handleClearSelectionWithConfirm} className="flex justify-center items-center hover:bg-red-500/10 rounded-md w-7 h-7 hover:text-red-500 codicon codicon-trash"></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-0 bg-[var(--vscode-sideBar-background)] inner-shadow p-3 overflow-y-auto">
                {treeData.length > 0 ? renderTreeElements(treeData) : (
                    <div className="flex flex-col justify-center items-center opacity-60 py-12">
                        <span className="mb-2 text-3xl codicon-list-tree codicon"></span>
                        <span className="text-[var(--vscode-descriptionForeground)] text-xs italic">No visible elements.</span>
                    </div>
                )}
            </div>
        </>
    );
};
EOF

# Compile files back to application webview bundles
npm run compile

echo "✅ fix: Resolved selection regressions by preserving absolute leaf node path identifiers inside the optimized, limited single root workspace tree container!"
EOF

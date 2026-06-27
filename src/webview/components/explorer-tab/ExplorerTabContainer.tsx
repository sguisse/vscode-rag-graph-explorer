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
    // FIX: Destructure primitive values to ensure React hooks check exact values, not unstable object references
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
        manualSelectedIds,
        effectiveSelectedNodeIds,
        toggleNodeSelection,
        setNodesSelectionState,
        clearSelection
    } = useGraphSelection(fileLevelEdges, nodeToFileIdMap, parentDepth, childDepth, isHierarchyEnabled);

    useEffect(() => {
        setSelectedNodeIds(effectiveSelectedNodeIds);
    }, [effectiveSelectedNodeIds, setSelectedNodeIds]);

    useEffect(() => {
        if (selectedNodeIds.size === 0 && manualSelectedIds.size > 0) {
            clearSelection();
        }
    }, [selectedNodeIds, manualSelectedIds, clearSelection]);

    useEffect(() => {
        if (!containerRef.current) return;

        const options = {
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
            const isMultiSelect = params.event.srcEvent.ctrlKey || params.event.srcEvent.metaKey;
            if (params.nodes.length > 0) {
                toggleNodeSelection(String(params.nodes[0]), isMultiSelect);
            } else if (!isMultiSelect) {
                clearSelection();
            }
        });

        return () => { network.destroy(); };
    }, [toggleNodeSelection, clearSelection]);

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

    // Graph DataView rendering logic using scalar dependencies
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

            const isSelected = effectiveSelectedNodeIds.has(f.id);
            return {
                id: f.id,
                hidden: !isVisible,
                opacity: effectiveSelectedNodeIds.size === 0 || isSelected ? 1 : 0.18,
                shadow: isSelected,
                borderWidth: isSelected ? 4 : 2
            };
        });

        if (nodeUpdates.length > 0) visNodesRef.current.update(nodeUpdates);

        const edgeUpdates = fileLevelEdges.map((fe, index) => {
            const isHighlighted = effectiveSelectedNodeIds.has(fe.from) && effectiveSelectedNodeIds.has(fe.to);
            return { id: index, color: isHighlighted ? '#3b82f6' : '#4b5563', width: isHighlighted ? 2.5 : 1 };
        });

        if (edgeUpdates.length > 0) visEdgesRef.current.update(edgeUpdates);

        if (networkRef.current) networkRef.current.selectNodes(Array.from(effectiveSelectedNodeIds), false);
    }, [effectiveSelectedNodeIds, applyOnGraph, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase, nodes, fileLevelEdges, nodeToFileIdMap]);

    useEffect(() => {
        if (networkRef.current) {
            setTimeout(() => {
                networkRef.current?.setSize('100%', '100%');
                networkRef.current?.redraw();
            }, 100);
        }
    }, [isTreeCollapsed, isMaximized]);

    // FIX: Decouple 'effectiveSelectedNodeIds' from the Tree dependency array unless 'showOnlySelected' is actively true.
    // If showOnlySelected is false, 'selectionDep' evaluates to null, breaking the render cascade on user clicks!
    const selectionDep = showOnlySelected ? effectiveSelectedNodeIds : null;

    const strictlyVisibleIds = useMemo(() => {
        const visible = new Set<string>();
        nodes.forEach(n => {
            if (!applyOnTree) {
                visible.add(n.id);
                return;
            }

            // Only apply selection-based filtering if 'selectionDep' is not null (meaning showOnlySelected is active)
            if (selectionDep) {
                const fileId = nodeToFileIdMap.get(n.id);
                const isNodeSelected = selectionDep.has(n.id) || (fileId && selectionDep.has(fileId));
                if (!isNodeSelected) return;
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
    }, [nodes, applyOnTree, showOnlySelected, selectionDep, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase, nodeToFileIdMap]);

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

        if (treeGrouping === 'root') return sortedRoots.map(rn => buildNodeSubtree(rn));

        if (treeGrouping === 'extension') {
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
            return [...groupElements, ...nonExtRoots.map(rn => buildNodeSubtree(rn))];
        }

        if (treeGrouping === 'folder') {
            interface FolderNode { name: string; path: string; nodes: GraphNode[]; subfolders: { [key: string]: FolderNode }; }
            const rootFolder: FolderNode = { name: '', path: '', nodes: [], subfolders: {} };
            const nonFolderRoots: GraphNode[] = [];

            sortedRoots.forEach(rn => {
                if ((rn.group === 'file' || rn.group === 'document') && rn.source_file) {
                    const parts = rn.source_file.split('/').filter(p => p);
                    let current = rootFolder;
                    let accumulatedPath = '';
                    for (let i = 0; i < parts.length - 1; i++) {
                        const part = parts[i];
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
            const builtRoot = convertFolderToTreeElement(rootFolder, '');
            return [...(builtRoot.children || []), ...nonFolderRoots.map(rn => buildNodeSubtree(rn))];
        }
        return [];
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
                    effectiveSelectedNodeIds={effectiveSelectedNodeIds}
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

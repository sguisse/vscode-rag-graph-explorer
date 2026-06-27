import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { GraphNode, GraphEdge } from '../../types';
import { TreeView } from './TreeView';
import { GraphView } from './graph/GraphView';
import { getGraphStyle, layoutOptions } from './graph/GraphConfig';
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
    const cyRef = useRef<cytoscape.Core | null>(null);
    const networkRef = useRef<any>(null);

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
        const fileNodes = nodes.filter(n => n.group === 'file' || n.group === 'file_unreferenced');
        fileNodes.forEach(f => map.set(f.id, f.id));
        nodes.forEach(n => {
            if (n.group !== 'file' && n.group !== 'file_unreferenced' && n.source_file) {
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
        const fileEdgesMap = new Map<string, { from: string; to: string; types: Set<string> }>();
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

    const prevSelectedSizeRef = useRef<number>(selectedNodeIds.size);
    useEffect(() => {
        if (selectedNodeIds.size === 0 && prevSelectedSizeRef.current > 0 && exactSelectedIds.size > 0) {
            clearSelection();
        }
        prevSelectedSizeRef.current = selectedNodeIds.size;
    }, [selectedNodeIds, exactSelectedIds, clearSelection]);

    useEffect(() => {
        if (!containerRef.current) return;

        const fileNodes = nodes.filter(n => n.group === 'file' || n.group === 'file_unreferenced');
        const cyElements: any[] = [];

        fileNodes.forEach(f => {
            cyElements.push({
                data: { id: f.id, label: f.label, group: f.group }
            });
        });

        fileLevelEdges.forEach((fe, index) => {
            cyElements.push({
                data: { id: `edge-${index}`, source: fe.from, target: fe.to, type: Array.from(fe.types).join(', ') }
            });
        });

        const cy = cytoscape({
            container: containerRef.current,
            elements: cyElements,
            boxSelectionEnabled: false,
            style: getGraphStyle(),
            layout: layoutOptions as any
        });

        cyRef.current = cy;

        networkRef.current = {
            fit: () => {
                if (cyRef.current) {
                    cyRef.current.animate({
                        fit: { eles: cyRef.current.elements(), padding: 40 },
                        duration: 350
                    });
                }
            },
            focus: (nodeId: string, options?: any) => {
                if (cyRef.current) {
                    const targetNode = cyRef.current.$(`[id = "${nodeId}"]`);
                    if (targetNode.length) {
                        cyRef.current.animate({
                            center: { eles: targetNode },
                            zoom: options?.scale || 1.1,
                            duration: options?.animation?.duration || 450
                        });
                    }
                }
            },
            setOptions: () => {},
            stabilize: () => {}
        };

        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            const nodeId = node.id();
            const srcEvent = evt.originalEvent;
            const isMultiSelect = srcEvent ? (srcEvent.ctrlKey || srcEvent.metaKey) : false;

            if (!isMultiSelect) {
                clearSelection();
            }
            toggleNodeSelection(nodeId);
        });

        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                const srcEvent = evt.originalEvent;
                const isMultiSelect = srcEvent ? (srcEvent.ctrlKey || srcEvent.metaKey) : false;
                if (!isMultiSelect) {
                    clearSelection();
                }
            }
        });

        return () => {
            cy.destroy();
        };
    }, [nodes, fileLevelEdges, toggleNodeSelection, clearSelection]);

    useEffect(() => {
        if (!cyRef.current) return;
        cyRef.current.batch(() => {
            cyRef.current!.nodes().forEach(node => {
                const id = node.id();
                let isVisible = true;

                if (applyOnGraph) {
                    const relatedNodes = nodes.filter(n => nodeToFileIdMap.get(n.id) === id);
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

                const isContextuallySelected = effectiveFileIds.has(id);
                const isExactlySelected = exactSelectedIds.has(id);

                let opacity = 1;
                if (effectiveFileIds.size > 0) {
                    opacity = isContextuallySelected ? 1 : 0.15;
                }

                node.style({
                    'display': isVisible ? 'element' : 'none',
                    'opacity': opacity,
                    'border-width': isExactlySelected ? 4 : (isContextuallySelected ? 2.5 : (node.data('group') === 'file_unreferenced' ? 2.5 : 2)),
                    'border-color': isExactlySelected ? '#007acc' : (isContextuallySelected ? '#3b82f6' : (node.data('group') === 'file_unreferenced' ? '#000000' : '#1177bb')),
                    'background-color': isExactlySelected ? '#1f8ad2' : (node.data('group') === 'file_unreferenced' ? '#3a1e22' : '#0e639c')
                });
            });

            cyRef.current!.edges().forEach(edge => {
                const sourceId = edge.source().id();
                const targetId = edge.target().id();
                const isHighlighted = effectiveFileIds.has(sourceId) && effectiveFileIds.has(targetId);

                let opacity = 0.65;
                if (effectiveFileIds.size > 0) {
                    opacity = isHighlighted ? 1 : 0.05;
                }

                edge.style({
                    'line-color': isHighlighted ? '#3b82f6' : '#444444',
                    'target-arrow-color': isHighlighted ? '#3b82f6' : '#444444',
                    'width': isHighlighted ? 2.5 : 1.5,
                    'opacity': opacity
                });
            });
        });
    }, [effectiveFileIds, exactSelectedIds, applyOnGraph, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase, nodes, fileLevelEdges, nodeToFileIdMap]);

    useEffect(() => {
        if (cyRef.current) {
            setTimeout(() => {
                cyRef.current?.resize();
            }, 150);
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

        const fileNodes = nodes.filter(n => (n.group === 'file' || n.group === 'file_unreferenced') && n.source_file);
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
                if (rn.group === 'file' || rn.group === 'file_unreferenced' || rn.group === 'document') {
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
                if ((rn.group === 'file' || rn.group === 'file_unreferenced' || rn.group === 'document') && rn.source_file) {
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

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DataSet } from 'vis-network/standalone';
import { Network } from 'vis-network';
import { GraphNode, GraphEdge } from '../types';

interface ExplorerTabProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    filters: any;
}

interface TreeElement {
    id: string;
    label: string;
    isGroup: boolean;
    icon?: string;
    node?: GraphNode;
    children?: TreeElement[];
    allLeafIds: string[];
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({
    nodes, edges, selectedNodeIds, setSelectedNodeIds, filters
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);

    // Persistent datasets protect node layout metrics from being reset on selection changes
    const visNodesRef = useRef<DataSet<any>>(new DataSet([]));
    const visEdgesRef = useRef<DataSet<any>>(new DataSet([]));

    const [treeGrouping, setTreeGrouping] = useState<'folder' | 'extension' | 'root'>('folder');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [ignoreCase, setIgnoreCase] = useState(true);
    const [showOnlySelected, setShowOnlySelected] = useState(false);

    const [parentDepth, setParentDepth] = useState<number>(0);
    const [childDepth, setChildDepth] = useState<number>(0);

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

    // Graph engine initialization
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
                file: { color: { background: '#3b82f6', border: '#2563eb' }, shape: 'hexagon', size: 20 },
                class: { color: { background: '#22c55e', border: '#16a34a' }, shape: 'box' },
                method: { color: { background: '#a855f7', border: '#9333ea' } },
                document: { color: { background: '#eab308', border: '#ca8a04' }, shape: 'note' }
            },
            physics: {
                forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100 },
                solver: 'forceAtlas2Based',
                stabilization: { iterations: 150 }
            }
        };

        const network = new Network(containerRef.current, { nodes: visNodesRef.current, edges: visEdgesRef.current }, options as any);
        networkRef.current = network;

        // Permanently freeze simulation after early stabilization to allow free user positioning
        network.on("stabilizationIterationsDone", () => {
            network.setOptions({ physics: false } as any);
        });

        network.on("click", (params) => {
            const isMultiSelect = params.event.srcEvent.ctrlKey || params.event.srcEvent.metaKey;
            if (params.nodes.length > 0) {
                const targetId = String(params.nodes[0]);
                setSelectedNodeIds(prev => {
                    const next = new Set(prev);
                    if (isMultiSelect) {
                        if (next.has(targetId)) next.delete(targetId);
                        else next.add(targetId);
                    } else {
                        next.clear();
                        next.add(targetId);
                    }
                    return next;
                });
            } else if (!isMultiSelect) {
                setSelectedNodeIds(new Set());
            }
        });

        return () => { network.destroy(); };
    }, []);

    // Load initial topology payload only when raw structures alter
    useEffect(() => {
        visNodesRef.current.clear();
        visEdgesRef.current.clear();

        visNodesRef.current.add(nodes.map(n => ({
            id: n.id,
            label: n.label,
            group: n.group,
            title: n.label
        })));

        visEdgesRef.current.add(edges.map((e, index) => ({
            id: index,
            from: e.from,
            to: e.to,
            type: e.type
        })));

        if (networkRef.current) {
            networkRef.current.setOptions({ physics: true } as any);
            networkRef.current.stabilize();
        }
    }, [nodes, edges]);

    // Handle high-performance properties adjustment inline without resetting positions
    useEffect(() => {
        const nodeUpdates = nodes.map(n => {
            let isVisible = true;
            if (filters.applyOnGraph) {
                if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(n.group)) isVisible = false;
                if (filters.searchText) {
                    const labelStr = ignoreCase ? n.label.toLowerCase() : n.label;
                    const queryStr = ignoreCase ? filters.searchText.toLowerCase() : filters.searchText;
                    if (filters.isRegexEnabled) {
                        try { isVisible = new RegExp(queryStr).test(labelStr); } catch { isVisible = true; }
                    } else {
                        isVisible = filters.searchMode === 'exact' ? labelStr === queryStr : labelStr.includes(queryStr);
                    }
                }
            }

            const isSelected = selectedNodeIds.has(n.id);
            return {
                id: n.id,
                hidden: !isVisible,
                opacity: selectedNodeIds.size === 0 || isSelected ? 1 : 0.18,
                shadow: isSelected,
                borderWidth: isSelected ? 4 : 2
            };
        });

        if (nodeUpdates.length > 0) {
            visNodesRef.current.update(nodeUpdates);
        }

        const edgeUpdates = edges.map((e, index) => {
            const isHighlighted = selectedNodeIds.has(e.from) && selectedNodeIds.has(e.to);
            return {
                id: index,
                color: isHighlighted ? '#3b82f6' : '#4b5563',
                width: isHighlighted ? 2.5 : 1
            };
        });

        if (edgeUpdates.length > 0) {
            visEdgesRef.current.update(edgeUpdates);
        }

        // Synchronize active selection markers on the canvas layout
        if (networkRef.current) {
            networkRef.current.selectNodes(Array.from(selectedNodeIds), false);
        }
    }, [selectedNodeIds, filters, ignoreCase, nodes, edges]);

    const strictlyVisibleIds = useMemo(() => {
        const visible = new Set<string>();
        nodes.forEach(n => {
            if (!filters.applyOnTree) {
                visible.add(n.id);
                return;
            }
            if (showOnlySelected && !selectedNodeIds.has(n.id)) return;
            if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(n.group)) return;
            if (!filters.searchText) {
                visible.add(n.id);
                return;
            }

            const labelStr = ignoreCase ? n.label.toLowerCase() : n.label;
            const queryStr = ignoreCase ? filters.searchText.toLowerCase() : filters.searchText;

            let matches = false;
            if (filters.isRegexEnabled) {
                try { matches = new RegExp(queryStr).test(labelStr); } catch { matches = true; }
            } else {
                matches = filters.searchMode === 'exact' ? labelStr === queryStr : labelStr.includes(queryStr);
            }

            if (matches) visible.add(n.id);
        });
        return visible;
    }, [nodes, filters, showOnlySelected, selectedNodeIds, ignoreCase]);

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

        const sortNodes = (arr: GraphNode[]) => {
            return [...arr].sort((a, b) => {
                const cmp = a.label.localeCompare(b.label);
                return sortOrder === 'asc' ? cmp : -cmp;
            });
        };

        const buildNodeSubtree = (node: GraphNode): TreeElement => {
            const childIds = childrenMap[node.id] || [];
            const visibleChildrenIds = childIds.filter(cid => hierarchicallyVisibleIds.has(cid));
            const visibleChildrenNodes = nodes.filter(n => visibleChildrenIds.includes(n.id));
            const sortedChildren = sortNodes(visibleChildrenNodes);

            const childrenElements = sortedChildren.map(cn => buildNodeSubtree(cn));
            const allLeafIds = [node.id];
            childrenElements.forEach(c => allLeafIds.push(...c.allLeafIds));

            return {
                id: node.id,
                label: node.label,
                isGroup: false,
                node,
                children: childrenElements.length > 0 ? childrenElements : undefined,
                allLeafIds
            };
        };

        const rootNodes = visibleNodes.filter(n => !parentMap[n.id] || !hierarchicallyVisibleIds.has(parentMap[n.id]));
        const sortedRoots = sortNodes(rootNodes);

        if (treeGrouping === 'root') {
            return sortedRoots.map(rn => buildNodeSubtree(rn));
        }

        if (treeGrouping === 'extension') {
            const extGroups: { [key: string]: GraphNode[] } = {};
            const nonExtRoots: GraphNode[] = [];

            sortedRoots.forEach(rn => {
                if (rn.group === 'file' || rn.group === 'document') {
                    const ext = rn.label.includes('.') ? '.' + rn.label.split('.').pop() : 'Sans extension';
                    if (!extGroups[ext]) extGroups[ext] = [];
                    extGroups[ext].push(rn);
                } else {
                    nonExtRoots.push(rn);
                }
            });

            const groupElements: TreeElement[] = Object.keys(extGroups)
                .sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
                .map(ext => {
                    const children = extGroups[ext].map(rn => buildNodeSubtree(rn));
                    const allLeafIds: string[] = [];
                    children.forEach(c => allLeafIds.push(...c.allLeafIds));
                    return {
                        id: `ext-${ext}`,
                        label: ext,
                        isGroup: true,
                        icon: '🗂️',
                        children,
                        allLeafIds
                    };
                });

            return [...groupElements, ...nonExtRoots.map(rn => buildNodeSubtree(rn))];
        }

        if (treeGrouping === 'folder') {
            interface FolderNode {
                name: string;
                nodes: GraphNode[];
                subfolders: { [key: string]: FolderNode };
            }

            const rootFolder: FolderNode = { name: '', nodes: [], subfolders: {} };
            const nonFolderRoots: GraphNode[] = [];

            sortedRoots.forEach(rn => {
                if ((rn.group === 'file' || rn.group === 'document') && rn.source_file) {
                    const parts = rn.source_file.split('/').filter(p => p);
                    let current = rootFolder;
                    for (let i = 0; i < parts.length - 1; i++) {
                        const part = parts[i];
                        if (!current.subfolders[part]) {
                            current.subfolders[part] = { name: part, nodes: [], subfolders: {} };
                        }
                        current = current.subfolders[part];
                    }
                    current.nodes.push(rn);
                } else {
                    nonFolderRoots.push(rn);
                }
            });

            const convertFolderToTreeElement = (folder: FolderNode, pathName: string): TreeElement => {
                const subfolderElements = Object.keys(folder.subfolders)
                    .sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
                    .map(k => convertFolderToTreeElement(folder.subfolders[k], k));

                const nodeElements = sortNodes(folder.nodes).map(n => buildNodeSubtree(n));
                const combinedChildren = [...subfolderElements, ...nodeElements];

                const allLeafIds: string[] = [];
                combinedChildren.forEach(c => allLeafIds.push(...c.allLeafIds));

                return {
                    id: `folder-${pathName || 'root'}`,
                    label: pathName || 'Workspace',
                    isGroup: true,
                    icon: '🗂️',
                    children: combinedChildren,
                    allLeafIds
                };
            };

            const builtRoot = convertFolderToTreeElement(rootFolder, '');
            return [...(builtRoot.children || []), ...nonFolderRoots.map(rn => buildNodeSubtree(rn))];
        }

        return [];
    }, [nodes, parentMap, childrenMap, hierarchicallyVisibleIds, treeGrouping, sortOrder]);

    const toggleNodeSelection = (id: string) => {
        setSelectedNodeIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleGroupCheckboxChange = (element: TreeElement, checked: boolean) => {
        setSelectedNodeIds(prev => {
            const next = new Set(prev);
            element.allLeafIds.forEach(id => {
                if (checked) next.add(id);
                else next.delete(id);
            });
            return next;
        });
    };

    const renderTreeElements = (elements: TreeElement[]): React.ReactNode => {
        return elements.map(el => {
            if (el.isGroup) {
                return (
                    <details key={el.id} className="w-full select-none" open>
                        <summary className="flex items-center gap-2 py-1 px-1.5 rounded font-bold hover:bg-[var(--vscode-list-hoverBackground)] cursor-pointer text-xs transition-colors list-none [&::-webkit-details-marker]:hidden">
                            <input
                                type="checkbox"
                                className="cursor-pointer"
                                ref={input => {
                                    if (input) {
                                        const selectedCount = el.allLeafIds.filter(id => selectedNodeIds.has(id)).length;
                                        if (selectedCount === 0) {
                                            input.checked = false;
                                            input.indeterminate = false;
                                        } else if (selectedCount === el.allLeafIds.length) {
                                            input.checked = true;
                                            input.indeterminate = false;
                                        } else {
                                            input.checked = false;
                                            input.indeterminate = true;
                                        }
                                    }
                                }}
                                onChange={(e) => handleGroupCheckboxChange(el, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs">{el.icon}</span>
                            <span className="truncate flex-1 text-[var(--vscode-foreground)]">{el.label}</span>
                        </summary>
                        <div className="border-l border-[var(--vscode-panel-border)] ml-3.5 pl-2 mt-0.5 space-y-0.5">
                            {renderTreeElements(el.children || [])}
                        </div>
                    </details>
                );
            } else {
                const isChecked = selectedNodeIds.has(el.id);
                return (
                    <div key={el.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-[var(--vscode-list-hoverBackground)] transition-colors group w-full">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleNodeSelection(el.id)}
                            className="cursor-pointer"
                        />
                        <span className="text-xs">
                            {el.node?.group === 'file' ? '📂' : el.node?.group === 'class' ? '📦' : el.node?.group === 'method' ? '⚡' : '📄'}
                        </span>
                        <span
                            className="text-xs truncate cursor-pointer flex-1 text-[var(--vscode-foreground)]"
                            onClick={() => {
                                if (networkRef.current) {
                                    (networkRef.current as any).focus(el.id, {
                                        scale: 1.2,
                                        animation: { duration: 400, easingFunction: 'easeInOutQuad' }
                                    });
                                }
                            }}
                            title={el.label}
                        >
                            {el.label}
                        </span>
                    </div>
                );
            }
        });
    };

    return (
        <div className="w-full h-full flex min-h-0 relative">
            <div className="w-[35%] min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x">
                <div className="p-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] flex flex-col gap-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Arbre Hiérarchique</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setSortOrder('asc')} className={`p-1 rounded text-xs ${sortOrder === 'asc' ? 'text-blue-500 bg-gray-700/40' : ''}`} title="Tri ASC">▲</button>
                            <button onClick={() => setSortOrder('desc')} className={`p-1 rounded text-xs ${sortOrder === 'desc' ? 'text-blue-500 bg-gray-700/40' : ''}`} title="Tri DESC">▼</button>
                            <button onClick={() => setIgnoreCase(!ignoreCase)} className={`p-1 text-xs font-mono rounded ${ignoreCase ? 'text-blue-500 bg-gray-700/40' : ''}`} title="Ignorer la casse">Aa</button>
                            <button onClick={() => setShowOnlySelected(!showOnlySelected)} className={`codicon codicon-eye p-1 rounded ${showOnlySelected ? 'text-blue-500' : ''}`} title="Afficher uniquement les sélectionnés"></button>
                            <button onClick={() => setSelectedNodeIds(new Set())} className="codicon codicon-trash p-1 rounded hover:text-red-500" title="Vider la sélection"></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">Regrouper par :</span>
                        <select
                            value={treeGrouping}
                            onChange={(e: any) => setTreeGrouping(e.target.value)}
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] text-xs border border-[var(--vscode-input-border)] rounded px-1 outline-none flex-1 font-medium"
                        >
                            <option value="folder">📂 Dossier</option>
                            <option value="extension">⚙️ Extension</option>
                            <option value="root">📄 Racine (Flat)</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {treeData.length > 0 ? renderTreeElements(treeData) : (
                        <div className="text-center italic text-xs py-8 text-[var(--vscode-descriptionForeground)]">Aucun élément visible.</div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--vscode-editor-background)]">
                <div className="h-9 px-3 bg-[var(--vscode-editorGroupHeader-tabsBackground)] border-b border-[var(--vscode-panel-border)] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4 text-xs">
                        <span className="font-semibold text-[11px] uppercase tracking-wider text-[var(--vscode-descriptionForeground)]">Vue Topologique</span>
                        <div className="flex items-center gap-1.5">
                            <label className="text-[10px]">Appelants (Parents) :</label>
                            <input type="number" min="0" max="5" value={parentDepth} onChange={(e) => setParentDepth(parseInt(e.target.value) || 0)} className="w-10 bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] rounded text-center px-1 text-[11px]" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <label className="text-[10px]">Appelés (Enfants) :</label>
                            <input type="number" min="0" max="5" value={childDepth} onChange={(e) => setChildDepth(parseInt(e.target.value) || 0)} className="w-10 bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] rounded text-center px-1 text-[11px]" />
                        </div>
                    </div>
                    <button onClick={() => networkRef.current?.fit({ animation: true })} className="px-2 py-0.5 bg-[var(--vscode-button-secondaryBackground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] text-[var(--vscode-button-secondaryForeground)] text-[11px] rounded flex items-center gap-1">
                        <span className="codicon codicon-screen-full text-[11px]"></span> Recadrer
                    </button>
                </div>

                <div className="flex-1 relative bg-[var(--vscode-editor-background)]">
                    <div ref={containerRef} className="absolute inset-0 outline-none" />

                    <div className="absolute bottom-4 left-4 p-3 bg-[var(--vscode-editorWidget-background)]/80 backdrop-blur-md border border-[var(--vscode-panel-border)] rounded shadow-xl text-[11px] pointer-events-none space-y-1.5 z-10">
                        <span className="font-bold block border-b border-gray-600/30 pb-1 mb-1">Légende Topologique</span>
                        <div className="flex items-center gap-2">📂 <span className="w-3 h-3 bg-[#3b82f6] rounded-sm"></span> Fichier</div>
                        <div className="flex items-center gap-2">📦 <span className="w-3 h-3 bg-[#22c55e] rounded-sm"></span> Classe</div>
                        <div className="flex items-center gap-2">⚡ <span className="w-3 h-3 bg-[#a855f7] rounded-sm"></span> Méthode</div>
                        <div className="flex items-center gap-2">📄 <span className="w-3 h-3 bg-[#eab308] rounded-sm"></span> Rationale / Doc</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

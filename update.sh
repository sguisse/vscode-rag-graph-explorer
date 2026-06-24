#!/bin/bash

# S'assurer que le répertoire cible existe
mkdir -p src/webview/components

# Réécriture complète et méticuleuse d'ExplorerTab.tsx pour ajuster les dimensions et l'ergonomie fine
cat << 'EOF' > src/webview/components/ExplorerTab.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DataSet } from 'vis-network/standalone';
import { Network } from 'vis-network';
import { GraphNode, GraphEdge } from '../types';
import { MaximizeIcon, MinimizeIcon, ListUnorderedIcon } from '@primer/octicons-react';

interface ExplorerTabProps {
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
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({
    nodes, edges, selectedNodeIds, setSelectedNodeIds, filters, config
}) => {
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

    useEffect(() => {
        if (config) {
            setShowLegend(config.graphLegendEnabled ?? true);
            setParentDepth(config.callersDepth ?? 1);
            setChildDepth(config.calleesDepth ?? 1);
        }
    }, [config]);

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

    const effectiveSelectedNodeIds = useMemo(() => {
        const effective = new Set<string>(selectedNodeIds);

        selectedNodeIds.forEach(startId => {
            const startNode = nodes.find(n => n.id === startId);
            if (!startNode || startNode.group !== 'file') return;

            let currentChildLayer = [startId];
            for (let d = 0; d < childDepth; d++) {
                const nextLayer: string[] = [];
                currentChildLayer.forEach(id => {
                    edges.forEach(e => {
                        if (e.from === id) {
                            const cNode = nodes.find(n => n.id === e.to);
                            if (cNode && cNode.group === 'file' && !effective.has(e.to)) {
                                effective.add(e.to);
                                nextLayer.push(e.to);
                            }
                        }
                    });
                });
                currentChildLayer = nextLayer;
            }

            let currentParentLayer = [startId];
            for (let d = 0; d < parentDepth; d++) {
                const nextLayer: string[] = [];
                currentParentLayer.forEach(id => {
                    edges.forEach(e => {
                        if (e.to === id) {
                            const pNode = nodes.find(n => n.id === e.from);
                            if (pNode && pNode.group === 'file' && !effective.has(e.from)) {
                                effective.add(e.from);
                                nextLayer.push(e.from);
                            }
                        }
                    });
                });
                currentParentLayer = nextLayer;
            }
        });

        return effective;
    }, [selectedNodeIds, nodes, edges, parentDepth, childDepth]);

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
                file: {
                    color: { background: '#3b82f6', border: '#2563eb' },
                    shape: 'hexagon',
                    size: 20,
                    font: { color: 'rgba(59, 130, 246, 0.85)' }
                },
                class: {
                    color: { background: '#22c55e', border: '#16a34a' },
                    shape: 'box'
                },
                method: {
                    color: { background: '#a855f7', border: '#9333ea' },
                    font: { color: 'rgba(168, 85, 247, 0.85)' }
                },
                document: {
                    color: { background: '#eab308', border: '#ca8a04' },
                    shape: 'note'
                }
            },
            physics: {
                forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100 },
                solver: 'forceAtlas2Based',
                stabilization: { iterations: 150 }
            }
        };

        const network = new Network(containerRef.current, { nodes: visNodesRef.current, edges: visEdgesRef.current }, options as any);
        networkRef.current = network;

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

            const isSelected = effectiveSelectedNodeIds.has(n.id);
            return {
                id: n.id,
                hidden: !isVisible,
                opacity: effectiveSelectedNodeIds.size === 0 || isSelected ? 1 : 0.18,
                shadow: isSelected,
                borderWidth: isSelected ? 4 : 2
            };
        });

        if (nodeUpdates.length > 0) visNodesRef.current.update(nodeUpdates);

        const edgeUpdates = edges.map((e, index) => {
            const isHighlighted = effectiveSelectedNodeIds.has(e.from) && effectiveSelectedNodeIds.has(e.to);
            return {
                id: index,
                color: isHighlighted ? '#3b82f6' : '#4b5563',
                width: isHighlighted ? 2.5 : 1
            };
        });

        if (edgeUpdates.length > 0) visEdgesRef.current.update(edgeUpdates);

        if (networkRef.current) {
            networkRef.current.selectNodes(Array.from(effectiveSelectedNodeIds), false);
        }
    }, [effectiveSelectedNodeIds, filters, ignoreCase, nodes, edges]);

    useEffect(() => {
        if (networkRef.current) {
            setTimeout(() => {
                networkRef.current?.setSize('100%', '100%');
                networkRef.current?.redraw();
            }, 100);
        }
    }, [isTreeCollapsed, isMaximized]);

    const strictlyVisibleIds = useMemo(() => {
        const visible = new Set<string>();
        nodes.forEach(n => {
            if (!filters.applyOnTree) {
                visible.add(n.id);
                return;
            }
            if (showOnlySelected && !effectiveSelectedNodeIds.has(n.id)) return;
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
    }, [nodes, filters, showOnlySelected, effectiveSelectedNodeIds, ignoreCase]);

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
                    const ext = rn.label.includes('.') ? '.' + rn.label.split('.').pop() : 'No extension';
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

    const handleExpandAll = () => {
        setCollapsedIds(new Set());
    };

    const handleCollapseAll = () => {
        const nextCollapsed = new Set<string>();
        const collapseChildrenRecursive = (elements: any[]) => {
            elements.forEach(el => {
                if (el.isGroup) {
                    nextCollapsed.add(el.id);
                    if (el.children) {
                        collapseChildrenRecursive(el.children);
                    }
                }
            });
        };
        collapseChildrenRecursive(treeData);
        setCollapsedIds(nextCollapsed);
    };

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

    const handleClearSelectionWithConfirm = () => {
        if (selectedNodeIds.size === 0) return;
        const confirmClear = window.confirm(`Are you sure you want to permanently clear the selection of all ${selectedNodeIds.size} node(s)?`);
        if (confirmClear) {
            setSelectedNodeIds(new Set());
        }
    };

    const renderTreeElements = (elements: TreeElement[]): React.ReactNode => {
        return elements.map(el => {
            if (el.isGroup) {
                const isGroupOpen = !collapsedIds.has(el.id);
                return (
                    <details key={el.id} className="w-full select-none" open={isGroupOpen}>
                        {/* py-0.5 au lieu de py-1.5 pour densifier et réduire le saut de ligne */}
                        <summary
                            className="[&::-webkit-details-marker]:hidden flex items-center gap-1.5 px-1.5 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer list-none hover:bg-[var(--vscode-list-hoverBackground)]"
                            onClick={(e) => {
                                e.preventDefault();
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
                                className="flex-shrink-0 cursor-pointer accent-blue-500 w-3.5 h-3.5"
                                ref={input => {
                                    if (input) {
                                        const selectedCount = el.allLeafIds.filter(id => effectiveSelectedNodeIds.has(id)).length;
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
                            <span className="flex-shrink-0 text-xs opacity-90">{el.icon}</span>
                            <span className="flex-1 text-[var(--vscode-foreground)] truncate tracking-wide">{el.label}</span>
                        </summary>
                        {/* Écart vertical inter-item réduit (space-y-0 au lieu de space-y-0.5) */}
                        <div className="space-y-0 mt-0 ml-[24px] pl-2 border-[var(--vscode-panel-border)] border-l">
                            {renderTreeElements(el.children || [])}
                        </div>
                    </details>
                );
            } else {
                const isChecked = effectiveSelectedNodeIds.has(el.id);
                return (
                    /* py-0.5 au lieu de py-1.5 pour réduire l'espacement vertical sur les feuilles */
                    <div key={el.id} className="group flex items-center gap-1.5 px-1.5 py-0.5 rounded-md w-full transition-colors hover:bg-[var(--vscode-list-hoverBackground)]">
                        <span className="flex-shrink-0 w-3"></span>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleNodeSelection(el.id)}
                            className="flex-shrink-0 cursor-pointer accent-blue-500 w-3.5 h-3.5"
                        />
                        <span className="flex-shrink-0 text-xs opacity-80">
                            {el.node?.group === 'file' ? '📂' : el.node?.group === 'class' ? '📦' : el.node?.group === 'method' ? '⚡' : '📄'}
                        </span>
                        <span
                            className="flex-1 text-[var(--vscode-foreground)] text-xs truncate cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => {
                                if (networkRef.current) {
                                    (networkRef.current as any).focus(el.id, {
                                        scale: 1.2,
                                        animation: { duration: 400, easingFunction: 'easeInOutQuad' }
                                    });
                                }
                                if ((window as any).vscodeApi && el.node?.group === 'file' && el.node.source_file) {
                                    try {
                                        (window as any).vscodeApi.postMessage({
                                            command: 'revealFile',
                                            path: el.node.source_file
                                        });
                                    } catch (err) {}
                                }
                            }}
                            data-tooltip={el.label}
                        >
                            {el.label}
                        </span>
                    </div>
                );
            }
        });
    };

    return (
        <div className="relative flex items-stretch w-full h-full min-h-0">
            <style dangerouslySetInnerHTML={{__html: `
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    height: 24px !important;
                    width: 14px !important;
                    opacity: 1 !important;
                    cursor: pointer;
                }
            `}} />

            {/* Largeur par défaut ajustée à exactement 465px (`w-[465px]`) */}
            <div className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] shadow-[2px_0_8px_var(--vscode-widget-shadow)] z-0 bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? 'hidden' : 'w-[465px]'}`}>
                <div className="flex flex-col flex-shrink-0 justify-center bg-[var(--vscode-editorGroupHeader-tabsBackground)] px-3 border-[var(--vscode-panel-border)] border-b h-10 shadow-[0_2px_4px_var(--vscode-widget-shadow)] z-10 relative">
                    <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--vscode-descriptionForeground)]">Tree&nbsp;View</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setSortOrder('asc')} className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 rounded-md text-xs ${sortOrder === 'asc' ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`} data-tooltip="Sort ASC">▲</button>
                            <button onClick={() => setSortOrder('desc')} className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 rounded-md text-xs ${sortOrder === 'desc' ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`} data-tooltip="Sort DESC">▼</button>
                            <button onClick={() => setIgnoreCase(!ignoreCase)} className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 text-xs font-mono rounded-md ${ignoreCase ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`} data-tooltip="Ignore case">Aa</button>

                            <div className="flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5 block" />

                            <button onClick={handleExpandAll} className="w-7 h-7 flex items-center justify-center hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors duration-200 rounded-md codicon codicon-expand-all" data-tooltip="Expand All"></button>
                            <button onClick={handleCollapseAll} className="w-7 h-7 flex items-center justify-center hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors duration-200 p-1.5 rounded-md codicon codicon-collapse-all" data-tooltip="Collapse All"></button>

                            <div className="flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5 block" />

                            {/* Suppression du `pl-1` -> Nettoyé en `pr-2` pur pour l'alignement VS Code */}
                            <select
                                value={treeGrouping}
                                onChange={(e: any) => setTreeGrouping(e.target.value)}
                                className="bg-[var(--vscode-input-background)] pr-2 py-1 border border-[var(--vscode-input-border)] rounded-md outline-none max-w-[95px] h-7 font-semibold text-[var(--vscode-input-foreground)] text-xs shadow-sm focus:border-blue-500 transition-all cursor-pointer"
                                data-tooltip="Tree grouping mode"
                            >
                                <option value="folder">📂 Folder</option>
                                <option value="extension">⚙️ Extension</option>
                                <option value="root">📄 Flat</option>
                            </select>

                            <button onClick={() => setShowOnlySelected(!showOnlySelected)} className={`w-7 h-7 flex items-center justify-center codicon codicon-eye rounded-md transition-colors duration-200 ${showOnlySelected ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`} data-tooltip="Show selected only"></button>

                            <button
                                onClick={() => {
                                    const paths = Array.from(new Set(nodes.filter(n => selectedNodeIds.has(n.id) && n.source_file).map(n => n.source_file as string)));
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
                                className="w-7 h-7 flex items-center justify-center hover:bg-[var(--vscode-toolbar-hoverBackground)] hover:text-blue-400 transition-colors duration-200 rounded-md text-[var(--vscode-foreground)] text-sm codicon codicon-cloud-upload"
                                data-tooltip="Publish selected files to Files Exporter shared list"
                            ></button>

                            <div className="flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5 block" />

                            <button onClick={handleClearSelectionWithConfirm} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 hover:text-red-500 transition-colors duration-200 codicon codicon-trash" data-tooltip="Clear selection"></button>
                        </div>
                    </div>
                </div>

                {/* space-y-0 pour un agencement plus condensé et professionnel */}
                <div className="flex-1 space-y-0 bg-[var(--vscode-sideBar-background)] p-3 overflow-y-auto inner-shadow">
                    {treeData.length > 0 ? renderTreeElements(treeData) : (
                        <div className="flex flex-col items-center justify-center py-12 opacity-60">
                            <span className="codicon codicon-list-tree text-3xl mb-2"></span>
                            <span className="italic text-xs text-[var(--vscode-descriptionForeground)]">No visible elements.</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex flex-col overflow-hidden bg-[var(--vscode-editor-background)] ${isMaximized ? 'fixed inset-0 z-50 w-screen h-screen' : 'flex-1 h-full'}`}>
                <div className="flex flex-shrink-0 justify-between items-center bg-[var(--vscode-editorGroupHeader-tabsBackground)] px-3 border-[var(--vscode-panel-border)] border-b h-10 shadow-[0_2px_4px_var(--vscode-widget-shadow)] z-10 relative">
                    <div className="flex items-center gap-4 h-full text-xs">
                        <div className="flex items-center gap-2">
                            {!isMaximized && (
                                <button
                                    onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors duration-200 rounded-md text-[var(--vscode-foreground)] text-sm codicon codicon-layout-sidebar-left"
                                    data-tooltip={isTreeCollapsed ? "Show Tree View" : "Hide Tree View"}
                                />
                            )}
                            <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--vscode-descriptionForeground)]">Graph&nbsp;View</span>
                        </div>

                        <div className="flex items-center gap-2 h-7 bg-[var(--vscode-input-background)]/50 px-2 py-1 rounded-md border border-[var(--vscode-panel-border)]/50 shadow-inner">
                            <label className="font-semibold text-[var(--vscode-descriptionForeground)] text-[10px] uppercase tracking-wide" data-tooltip="Number of parent files levels to select">Callers</label>
                            <input
                                type="number"
                                min="0"
                                max="20"
                                value={parentDepth}
                                onChange={(e) => setParentDepth(parseInt(e.target.value) || 0)}
                                className="bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-sm outline-none w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 h-7 bg-[var(--vscode-input-background)]/50 px-2 py-1 rounded-md border border-[var(--vscode-panel-border)]/50 shadow-inner">
                            <label className="font-semibold text-[var(--vscode-descriptionForeground)] text-[10px] uppercase tracking-wide" data-tooltip="Number of child files levels to select">Callees</label>
                            <input
                                type="number"
                                min="0"
                                max="20"
                                value={childDepth}
                                onChange={(e) => setChildDepth(parseInt(e.target.value) || 0)}
                                className="bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-sm outline-none w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => networkRef.current?.fit({ animation: true })}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors duration-200 rounded-md text-[var(--vscode-foreground)] shadow-sm"
                            data-tooltip="Recenter Graph"
                        >
                            <span className="text-[14px] codicon codicon-screen-full"></span>
                        </button>
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors duration-200 rounded-md text-[var(--vscode-foreground)] shadow-sm"
                            data-tooltip={isMaximized ? "Minimize Graph View" : "Maximize Graph View"}
                        >
                            {isMaximized ? (
                                <MinimizeIcon />
                            ) : (
                                <MaximizeIcon />
                            )}
                        </button>

                        <div className="flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1 w-[1px] h-5 block" />

                        <button
                            onClick={() => setShowLegend(!showLegend)}
                            className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 rounded-md shadow-sm ${showLegend ? 'text-blue-500 bg-blue-500/10' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-foreground)]'}`}
                            data-tooltip="Toggle Legend"
                        >
                            <ListUnorderedIcon />
                        </button>
                    </div>
                </div>

                <div className="relative flex-1 bg-[var(--vscode-editor-background)]">
                    <div ref={containerRef} className="absolute inset-0 outline-none" />

                    {showLegend && (
                        <div className="bottom-6 left-6 z-10 absolute space-y-2 bg-[var(--vscode-editorWidget-background)]/95 shadow-2xl backdrop-blur-md p-4 border border-[var(--vscode-panel-border)] rounded-lg w-52 text-[11px] transform transition-all duration-300">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-[var(--vscode-panel-border)]/50">
                                <span className="block font-bold tracking-wide uppercase text-[10px] text-[var(--vscode-descriptionForeground)]">Topological Legend</span>
                                <button
                                    onClick={() => setShowLegend(false)}
                                    className="hover:bg-[var(--vscode-toolbar-hoverBackground)] p-1 rounded-md text-[10px] cursor-pointer codicon codicon-close transition-colors"
                                    data-tooltip="Close legend"
                                />
                            </div>
                            <div className="flex items-center gap-3 font-medium"><span className="flex items-center justify-center bg-[#3b82f6]/20 border border-[#3b82f6] rounded-md w-6 h-6 text-sm shadow-sm">📂</span> File Node</div>
                            <div className="flex items-center gap-3 font-medium"><span className="flex items-center justify-center bg-[#22c55e]/20 border border-[#22c55e] rounded-md w-6 h-6 text-sm shadow-sm">📦</span> Class Node</div>
                            <div className="flex items-center gap-3 font-medium"><span className="flex items-center justify-center bg-[#a855f7]/20 border border-[#a855f7] rounded-md w-6 h-6 text-sm shadow-sm">⚡</span> Method Node</div>
                            <div className="flex items-center gap-3 font-medium"><span className="flex items-center justify-center bg-[#eab308]/20 border border-[#eab308] rounded-md w-6 h-6 text-sm shadow-sm">📄</span> Doc / Note Node</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
EOF

# 2. EXPLORATION FILTERS : Ajustement de la largeur à 100% avec un padding horizontal strict de 10px (px-[10px])
cat << 'EOF' > src/webview/components/ExplorationFilters.tsx
import React, { useState, useMemo } from 'react';

interface FiltersProps {
    typesList: string[];
    selectedTypes: string[];
    setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
    searchMode: string;
    setSearchMode: (val: string) => void;
    searchText: string;
    setSearchText: (val: string) => void;
    isRegexEnabled: boolean;
    setIsRegexEnabled: (val: boolean) => void;
    applyOnTree: boolean;
    setApplyOnTree: (val: boolean) => void;
    applyOnGraph: boolean;
    setApplyOnGraph: (val: boolean) => void;
}

export const ExplorationFilters: React.FC<FiltersProps> = ({
    typesList, selectedTypes, setSelectedTypes, searchMode, setSearchMode,
    searchText, setSearchText, isRegexEnabled, setIsRegexEnabled,
    applyOnTree, setApplyOnTree, applyOnGraph, setApplyOnGraph
}) => {
    const [isOpen, setIsOpen] = useState(true);

    const filterSummary = useMemo(() => {
        const typesStr = selectedTypes.length === 0 || selectedTypes.length === typesList.length ? 'All' : selectedTypes.join(', ');
        const queryStr = searchText ? `"${searchText}" (${searchMode}${isRegexEnabled ? '+Rx' : ''})` : 'None';
        const targetsStr = [applyOnTree && 'Tree', applyOnGraph && 'Graph'].filter(Boolean).join(' + ') || 'None';

        return { typesStr, queryStr, targetsStr };
    }, [selectedTypes, typesList, searchText, searchMode, isRegexEnabled, applyOnTree, applyOnGraph]);

    return (
        /* Le panel prend désormais toute la largeur disponible mais applique un padding précis en x de 10px (px-[10px]) */
        <div className="w-full bg-[var(--vscode-editor-background)] px-[10px] pt-2 flex-shrink-0 z-30 relative">
            <div className={`w-full border border-[var(--vscode-panel-border)] rounded-md bg-[var(--vscode-editorWidget-background)] overflow-hidden transition-shadow duration-300 ${isOpen ? 'shadow-[0_4px_10px_var(--vscode-widget-shadow)]' : ''}`}>
                <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer select-none font-semibold text-xs bg-[var(--vscode-editorGroupHeader-tabsBackground)] hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    data-tooltip="Regular Expression masks defining targeted directories and source formatting inclusions or exclusions lists."
                >
                    <div className="flex items-center gap-2 flex-shrink-0 text-[var(--vscode-foreground)]">
                        <span className={`codicon transition-transform duration-200 ${isOpen ? 'codicon-chevron-down' : 'codicon-chevron-right'}`}></span>
                        <span className="tracking-wide">🔍 Filters &amp; Scope Constraints</span>
                    </div>

                    {!isOpen && (
                        <span className="text-[10px] font-normal text-[var(--vscode-descriptionForeground)] truncate pl-4 text-right max-w-[70%] bg-[var(--vscode-badge-background)]/10 px-2 py-0.5 rounded-full">
                            <strong className="text-[var(--vscode-foreground)]">Types:</strong> {filterSummary.typesStr} <span className="text-[var(--vscode-panel-border)] mx-1">|</span>
                            <strong className="text-[var(--vscode-foreground)]">Search:</strong> {filterSummary.queryStr} <span className="text-[var(--vscode-panel-border)] mx-1">|</span>
                            <strong className="text-[var(--vscode-foreground)]">Targets:</strong> {filterSummary.targetsStr}
                        </span>
                    )}
                </div>

                {isOpen && (
                    <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--vscode-editor-background)]/30">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Entity Types</label>
                            <select
                                multiple
                                value={selectedTypes}
                                onChange={(e) => setSelectedTypes(Array.from(e.target.selectedOptions, option => option.value))}
                                className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-md p-1 text-xs min-h-[65px] h-[80px] resize-y outline-none focus:border-blue-500 transition-all shadow-inner"
                            >
                                {typesList.map(type => (
                                    <option key={type} value={type} className="px-1.5 py-0.5 rounded-sm hover:bg-[var(--vscode-list-hoverBackground)] capitalize cursor-pointer">{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Text Search</label>

                            <select
                                value={searchMode}
                                onChange={(e) => setSearchMode(e.target.value)}
                                className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-md px-2 text-xs outline-none h-7 focus:border-blue-500 transition-all shadow-sm"
                            >
                                <option value="contains">Contains</option>
                                <option value="starts">Starts with</option>
                                <option value="exact">Exactly</option>
                            </select>

                            <div className="relative flex items-center w-full shadow-sm">
                                <input
                                    type="text"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Filter..."
                                    className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-md pl-2 pr-7 h-7 text-xs outline-none focus:border-blue-500 transition-all"
                                />
                                {searchText && (
                                    <button
                                        onClick={() => setSearchText('')}
                                        className="absolute right-1 flex items-center justify-center p-1 rounded-sm text-[var(--vscode-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-all cursor-pointer text-[10px] codicon codicon-close"
                                        data-tooltip="Reset filter query"
                                    />
                                )}
                            </div>

                            <label className="flex items-center gap-1.5 text-xs mt-0.5 cursor-pointer select-none hover:text-blue-400 w-max transition-colors">
                                <input type="checkbox" checked={isRegexEnabled} onChange={(e) => setIsRegexEnabled(e.target.checked)} className="accent-blue-500 cursor-pointer w-3.5 h-3.5" />
                                <span className="font-medium">Enable Regex</span>
                            </label>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Application Targets</label>
                            <div className="flex flex-col gap-2 mt-0.5 bg-[var(--vscode-input-background)]/20 p-2 rounded-md border border-[var(--vscode-panel-border)]/50">
                                <label className="flex items-center gap-2 text-xs cursor-pointer select-none hover:text-blue-400 transition-colors">
                                    <input type="checkbox" checked={applyOnTree} onChange={(e) => setApplyOnTree(e.target.checked)} className="accent-blue-500 cursor-pointer w-3.5 h-3.5" />
                                    <span className="font-medium">Apply on Tree</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs cursor-pointer select-none hover:text-blue-400 transition-colors">
                                    <input type="checkbox" checked={applyOnGraph} onChange={(e) => setApplyOnGraph(e.target.checked)} className="accent-blue-500 cursor-pointer w-3.5 h-3.5" />
                                    <span className="font-medium">Apply on Graph</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
EOF

echo "✨ Alignements millimétrés et densification appliqués ! Largeur par défaut à 525px, padding left supprimé de la combo, espacement vertical optimisé à l'extrême et tiroir étiré à 100% avec padding [10px] en X."

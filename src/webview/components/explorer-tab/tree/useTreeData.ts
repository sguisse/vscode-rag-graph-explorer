import { useState, useMemo } from 'react';
import { GraphNode, GraphEdge } from '../../../types';
import { TreeElement } from './treeTypes';

export function useTreeData(
    nodes: GraphNode[],
    edges: GraphEdge[],
    exactSelectedIds: Set<string>,
    filters: any
) {
    const { applyOnTree, selectedTypes, searchText, searchMode, isRegexEnabled } = filters;

    const [treeGrouping, setTreeGrouping] = useState<'folder' | 'extension' | 'root'>('folder');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [ignoreCase, setIgnoreCase] = useState(true);
    const [showOnlySelected, setShowOnlySelected] = useState(false);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

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

    const { incomingConnectivity, outgoingConnectivity } = useMemo(() => {
        const incoming = new Map<string, Set<string>>();
        const outgoing = new Map<string, Set<string>>();

        nodes.forEach(n => {
            if (n.group === 'file' || n.group === 'file_unreferenced') {
                incoming.set(n.id, new Set());
                outgoing.set(n.id, new Set());
            }
        });

        edges.forEach(e => {
            if (incoming.has(e.to) && outgoing.has(e.from)) {
                outgoing.get(e.from)?.add(e.to);
                incoming.get(e.to)?.add(e.from);
            }
        });

        return { incomingConnectivity: incoming, outgoingConnectivity: outgoing };
    }, [nodes, edges]);

    const treeSelectionDep = showOnlySelected ? exactSelectedIds : null;

    const strictlyVisibleIds = useMemo(() => {
        const visible = new Set<string>();
        nodes.forEach(n => {
            if (!applyOnTree) {
                visible.add(n.id);
                return;
            }

            if (treeSelectionDep && !treeSelectionDep.has(n.id)) return;
            if (selectedTypes.length > 0 && !selectedTypes.includes(n.group)) return;
            if (!searchText) {
                visible.add(n.id);
                return;
            }

            const labelStr = ignoreCase ? n.label.toLowerCase() : n.label;
            const pathStr = n.source_file ? (ignoreCase ? n.source_file.toLowerCase() : n.source_file) : '';
            const queryStr = ignoreCase ? searchText.toLowerCase() : searchText;
            let matches = false;

            if (isRegexEnabled) {
                try {
                    matches = new RegExp(queryStr).test(labelStr) || new RegExp(queryStr).test(pathStr);
                } catch { matches = true; }
            } else {
                if (searchMode === 'exact') {
                    matches = labelStr === queryStr || pathStr === queryStr;
                } else if (searchMode === 'starts') {
                    matches = labelStr.startsWith(queryStr) || pathStr.startsWith(queryStr);
                } else {
                    matches = labelStr.includes(queryStr) || pathStr.includes(queryStr);
                }
            }
            if (matches) visible.add(n.id);
        });
        return visible;
    }, [nodes, applyOnTree, treeSelectionDep, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase]);

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

            let leafIcon = '📄';
            let iconTooltip = 'Generic Resource Artifact Node';
            const isFile = node.group === 'file' || node.group === 'file_unreferenced';

            if (isFile) {
                const incCount = incomingConnectivity.get(node.id)?.size || 0;
                const outCount = outgoingConnectivity.get(node.id)?.size || 0;

                if (incCount === 0 && outCount === 0) {
                    leafIcon = '📭';
                    iconTooltip = 'No parent & No children';
                } else if (incCount === 0) {
                    leafIcon = '📥';
                    iconTooltip = 'No parent';
                } else if (outCount === 0) {
                    leafIcon = '📤';
                    iconTooltip = 'No children';
                } else {
                    leafIcon = '📂';
                    iconTooltip = 'Connected Module';
                }
            } else if (node.group === 'class') {
                leafIcon = '📦';
                iconTooltip = 'Class Definition';
            } else if (node.group === 'method') {
                leafIcon = '⚡';
                iconTooltip = 'Method Subroutine';
            }

            return {
                id: node.id,
                label: node.label,
                isGroup: false,
                icon: leafIcon,
                iconTooltip: iconTooltip,
                node,
                children: childrenElements.length > 0 ? childrenElements : undefined,
                allLeafIds
            };
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
                return { id: `ext-${ext}`, label: ext, isGroup: true, icon: '🗂️', iconTooltip: `Extension Category Group (${ext})`, children, allLeafIds };
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

                return { id: `folder-${folder.path || 'root'}`, label: pathName || 'Workspace', isGroup: true, icon: '🗂️', iconTooltip: `Directory Scope (${folder.path || 'Root'})`, children: combinedChildren, allLeafIds, folderPath: folder.path || undefined };
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
            iconTooltip: 'Unified Workspace Context Root',
            children: result,
            allLeafIds: allLeafIds,
            folderPath: commonPrefixPath || undefined
        };

        return [workspaceRoot];
    }, [nodes, parentMap, childrenMap, hierarchicallyVisibleIds, treeGrouping, sortOrder, incomingConnectivity, outgoingConnectivity]);

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

    return {
        treeData,
        sortOrder,
        setSortOrder,
        ignoreCase,
        setIgnoreCase,
        treeGrouping,
        setTreeGrouping,
        showOnlySelected,
        setShowOnlySelected,
        collapsedIds,
        setCollapsedIds,
        handleExpandAll,
        handleCollapseAll
    };
}

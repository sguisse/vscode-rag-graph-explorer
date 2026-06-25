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
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    effectiveSelectedNodeIds: Set<string>;
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
}

export const TreeView: React.FC<TreeViewProps> = ({
    nodes,
    selectedNodeIds,
    setSelectedNodeIds,
    effectiveSelectedNodeIds,
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
    handleCollapseAll,
    networkRef
}) => {
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
                        <summary
                            className="[&::-webkit-details-marker]:hidden flex items-center gap-1.5 px-1.5 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer list-none hover:bg-[var(--vscode-list-hoverBackground)]"
                            onClick={(e) => {
                                e.preventDefault();
                                if ((window as any).vscodeApi && el.folderPath) {
                                    try {
                                        (window as any).vscodeApi.postMessage({
                                            command: 'revealFile',
                                            path: el.folderPath,
                                            openEditor: false
                                        });
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
                            <span className="flex-shrink-0 opacity-90 text-xs">{el.icon}</span>
                            <span className="flex-1 text-[var(--vscode-foreground)] truncate tracking-wide">{el.label}</span>
                        </summary>
                        <div className="space-y-0 mt-0 ml-[24px] pl-2 border-[var(--vscode-panel-border)] border-l">
                            {renderTreeElements(el.children || [])}
                        </div>
                    </details>
                );
            } else {
                const isChecked = effectiveSelectedNodeIds.has(el.id);
                return (
                    <div key={el.id} className="group flex items-center gap-1.5 px-1.5 py-0.5 rounded-md w-full transition-colors hover:bg-[var(--vscode-list-hoverBackground)]">
                        <span className="flex-shrink-0 w-3"></span>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleNodeSelection(el.id)}
                            className="flex-shrink-0 w-3.5 h-3.5 accent-blue-500 cursor-pointer"
                        />
                        <span className="flex-shrink-0 opacity-80 text-xs">
                            {el.node?.group === 'file' ? '📂' : el.node?.group === 'class' ? '📦' : el.node?.group === 'method' ? '⚡' : '📄'}
                        </span>
                        <span
                            className="flex-1 text-[var(--vscode-foreground)] hover:text-blue-400 text-xs truncate transition-colors cursor-pointer select-none"
                            onClick={() => {
                                if (networkRef.current) {
                                    networkRef.current.focus(el.id, {
                                        scale: 1.2,
                                        animation: { duration: 400, easingFunction: 'easeInOutQuad' }
                                    });
                                }
                                if ((window as any).vscodeApi && el.node?.group === 'file' && el.node.source_file) {
                                    try {
                                        (window as any).vscodeApi.postMessage({
                                            command: 'revealFile',
                                            path: el.node.source_file,
                                            openEditor: false
                                        });
                                    } catch (err) {}
                                }
                            }}
                            onDoubleClick={() => {
                                setSelectedNodeIds(new Set([el.id]));
                                if (networkRef.current) {
                                    networkRef.current.focus(el.id, {
                                        scale: 1.2,
                                        animation: { duration: 400, easingFunction: 'easeInOutQuad' }
                                    });
                                }
                                if ((window as any).vscodeApi && el.node?.group === 'file' && el.node.source_file) {
                                    try {
                                        (window as any).vscodeApi.postMessage({
                                            command: 'revealFile',
                                            path: el.node.source_file,
                                            openEditor: true
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
        <>
            <div className="z-10 relative flex flex-col flex-shrink-0 justify-center bg-[var(--vscode-editorGroupHeader-tabsBackground)] shadow-[0_2px_4px_var(--vscode-widget-shadow)] px-3 border-[var(--vscode-panel-border)] border-b h-10">
                <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-[11px] uppercase tracking-wider">Tree&nbsp;View</span>
                    <div className="flex items-center">
                        <button onClick={() => setSortOrder('asc')} className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 rounded-md text-xs ${sortOrder === 'asc' ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`} data-tooltip="Sort ASC">▲</button>
                        <button onClick={() => setSortOrder('desc')} className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 rounded-md text-xs ${sortOrder === 'desc' ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`} data-tooltip="Sort DESC">▼</button>
                        <button onClick={() => setIgnoreCase(!ignoreCase)} className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 text-xs font-mono rounded-md ${ignoreCase ? 'text-blue-500 bg-blue-500/10 shadow-sm' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`} data-tooltip="Ignore case">Aa</button>

                        <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5" />

                        <button onClick={handleExpandAll} className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded-md w-7 h-7 transition-colors duration-200 codicon codicon-expand-all" data-tooltip="Expand All"></button>
                        <button onClick={handleCollapseAll} className="codicon-collapse-all flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] p-1.5 rounded-md w-7 h-7 transition-colors duration-200 codicon" data-tooltip="Collapse All"></button>

                        <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5" />

                        <select
                            value={treeGrouping}
                            onChange={(e: any) => setTreeGrouping(e.target.value)}
                            className="bg-[var(--vscode-input-background)] shadow-sm py-1 pr-2 border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-md outline-none max-w-[95px] h-7 font-semibold text-[var(--vscode-input-foreground)] text-xs transition-all cursor-pointer"
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
                            className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded-md w-7 h-7 text-[var(--vscode-foreground)] hover:text-blue-400 text-sm transition-colors duration-200 codicon codicon-cloud-upload"
                            data-tooltip="Publish selected files to Files Exporter shared list"
                        ></button>

                        <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1.5 w-[1px] h-5" />

                        <button onClick={handleClearSelectionWithConfirm} className="flex justify-center items-center hover:bg-red-500/10 rounded-md w-7 h-7 hover:text-red-500 transition-colors duration-200 codicon codicon-trash" data-tooltip="Clear selection"></button>
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

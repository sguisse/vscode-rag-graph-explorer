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
    // FIXED: Appended the correct execution return callback arrow definition signature
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
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (typeof (window as any).logToTerminal === 'function') {
                                        (window as any).logToTerminal('debug', `🌳 TreeView Group Checkbox Changed: ID=[${el.id}] | TargetState=${checked} | Total Children: ${el.allLeafIds.length}`);
                                    }
                                    setNodesSelectionState(el.allLeafIds, checked);
                                }}
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
                            onChange={() => {
                                if (typeof (window as any).logToTerminal === 'function') {
                                    (window as any).logToTerminal('debug', `🌳 TreeView Leaf Checkbox Changed: ID=[${el.id}] | Group='${el.node?.group}' | Prior Checked State=${isChecked}`);
                                }
                                toggleNodeSelection(el.id);
                            }}
                        />
                        <span className="flex-shrink-0 opacity-80 text-xs">
                            {el.node?.group === 'file' ? '📂' : el.node?.group === 'class' ? '📦' : el.node?.group === 'method' ? '⚡' : '📄'}
                        </span>
                        <span
                            className="flex-1 text-[var(--vscode-foreground)] hover:text-blue-400 text-xs truncate transition-colors cursor-pointer select-none"
                            onClick={() => {
                                if (typeof (window as any).logToTerminal === 'function') {
                                    (window as any).logToTerminal('debug', `🌳 TreeView Text Node Requested Focus: ID=[${el.id}]`);
                                }
                                if (networkRef.current) {
                                    networkRef.current.focus(el.id, { scale: 1.2, animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
                                }
                            }}
                            onDoubleClick={() => {
                                if (typeof (window as any).logToTerminal === 'function') {
                                    (window as any).logToTerminal('warn', `🌳 TreeView Text Node DoubleClick (Isolate Document Focus Request): ID=[${el.id}]`);
                                }
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

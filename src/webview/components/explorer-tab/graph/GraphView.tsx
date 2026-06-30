import React from 'react';
import { MaximizeIcon, MinimizeIcon, ListUnorderedIcon } from '@primer/octicons-react';
import { Legend } from '../Legend';

interface GraphViewProps {
    containerRef: React.RefObject<HTMLDivElement>;
    isMaximized: boolean;
    setIsMaximized: (val: boolean) => void;
    isTreeCollapsed: boolean;
    setIsTreeCollapsed: (val: boolean) => void;
    parentDepth: number;
    setParentDepth: (val: number) => void;
    childDepth: number;
    setChildDepth: (val: number) => void;
    networkRef: React.RefObject<any>;
    showLegend: boolean;
    setShowLegend: (val: boolean) => void;
    neo4jUrl?: string;
}

export const GraphView: React.FC<GraphViewProps> = ({
    containerRef,
    isMaximized,
    setIsMaximized,
    isTreeCollapsed,
    setIsTreeCollapsed,
    parentDepth,
    setParentDepth,
    childDepth,
    setChildDepth,
    networkRef,
    showLegend,
    setShowLegend,
    neo4jUrl
}) => {
    return (
        <div className={`flex flex-col overflow-hidden bg-[var(--vscode-editor-background)] ${isMaximized ? 'fixed inset-0 z-50 w-screen h-screen' : 'flex-1 h-full'}`}>
            <div className="z-10 relative flex flex-shrink-0 justify-between items-center bg-[var(--vscode-editorGroupHeader-tabsBackground)] shadow-[0_2px_4px_var(--vscode-widget-shadow)] px-3 border-[var(--vscode-panel-border)] border-b h-10">
                <div className="flex items-center gap-4 h-full text-xs">
                    <div className="flex items-center gap-2">
                        {!isMaximized && (
                            <button
                                onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
                                className="codicon-layout-sidebar-left flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded-md w-7 h-7 text-[var(--vscode-foreground)] text-sm transition-colors duration-200 codicon"
                                data-tooltip={isTreeCollapsed ? "Show Tree View" : "Hide Tree View"}
                            />
                        )}
                        <span className="block font-bold text-[11px] uppercase tracking-wider">Graph&nbsp;View</span>
                    </div>

                    <div className="flex items-center gap-2 bg-[var(--vscode-input-background)]/50 shadow-inner px-2 py-1 border border-[var(--vscode-panel-border)]/50 rounded-md h-7">
                        <label className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide" data-tooltip="Number of parent files levels to select">Callers</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={parentDepth}
                            onChange={(e) => setParentDepth(parseInt(e.target.value) || 0)}
                            className="bg-[var(--vscode-input-background)] shadow-sm border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-sm outline-none focus:ring-1 focus:ring-blue-500/50 w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-[var(--vscode-input-background)]/50 shadow-inner px-2 py-1 border border-[var(--vscode-panel-border)]/50 rounded-md h-7">
                        <label className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide" data-tooltip="Number of child files levels to select">Callees</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={childDepth}
                            onChange={(e) => setChildDepth(parseInt(e.target.value) || 0)}
                            className="bg-[var(--vscode-input-background)] shadow-sm border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-sm outline-none focus:ring-1 focus:ring-blue-500/50 w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all"
                        />
                    </div>

                    {/* Standalone Neo4j Browser Client console utility navigation launch module */}
                    <button
                        onClick={() => {
                            const vscode = (window as any).vscodeApi;
                            if (vscode && neo4jUrl) {
                                vscode.postMessage({ command: 'openExternal', url: neo4jUrl });
                            } else if (neo4jUrl) {
                                window.open(neo4jUrl, '_blank', 'noopener,noreferrer');
                            }
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-sm px-2.5 rounded-md font-bold text-white text-[10px] uppercase tracking-wider h-7 transition-all cursor-pointer select-none"
                        data-tooltip="Open embedded Neo4j Web Console Client Browser"
                    >
                        <span className="codicon codicon-database"></span> Neo4j
                    </button>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={() => networkRef.current?.fit({ animation: true })}
                        className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] shadow-sm rounded-md w-7 h-7 text-[var(--vscode-foreground)] transition-colors duration-200"
                        data-tooltip="Recenter Graph"
                    >
                        <span className="text-[14px] codicon codicon-screen-full"></span>
                    </button>
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] shadow-sm rounded-md w-7 h-7 text-[var(--vscode-foreground)] transition-colors duration-200"
                        data-tooltip={isMaximized ? "Minimize Graph View" : "Maximize Graph View"}
                    >
                        {isMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
                    </button>

                    <div className="block flex-shrink-0 bg-[var(--vscode-panel-border)] mx-1 w-[1px] h-5" />

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
                <Legend showLegend={showLegend} onClose={() => setShowLegend(false)} />
            </div>
        </div>
    );
};

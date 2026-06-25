import React from 'react';
import { GraphNode } from '../types';
import { GraphService } from '../services/GraphService';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onGraphLoaded: (data: any) => void;
    nodes: GraphNode[];
    selectedNodeIds: Set<string>;
    status: 'ready' | 'building' | 'error';
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onGraphLoaded, nodes, selectedNodeIds, status }) => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await GraphService.loadGraphDataFromFile(file);
            onGraphLoaded(data);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Invalid graph.json file.');
        }
    };

    return (
        <header className="h-12 border-b border-[var(--vscode-panel-border)] flex items-center justify-between px-4 flex-shrink-0 bg-[var(--vscode-editor-background)] shadow-[0_2px_8px_var(--vscode-widget-shadow)] z-40 relative">
            <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 shadow-inner rounded-md flex items-center justify-center font-bold text-white text-sm">G</div>
                <div>
                    <span className="font-bold text-sm block leading-tight tracking-wide">Graph RAG</span>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--vscode-descriptionForeground)] font-semibold">Expert Node Navigator</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--vscode-descriptionForeground)] hidden md:inline mr-2">Structural analysis tool</span>

                <button onClick={toggleTheme} className="p-1.5 hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors duration-200 rounded-md text-[var(--vscode-foreground)]">
                    <span className={`codicon ${theme === 'dark' ? 'codicon-sun' : 'codicon-moon'}`}></span>
                </button>

                <div className="w-[1px] h-5 bg-[var(--vscode-panel-border)] mx-1" />

                <span
                    className="text-lg flex items-center justify-center w-6 select-none"
                    title={status === 'building' ? 'Building graph via Python Backend...' : status === 'error' ? 'Python Engine Error' : 'Engine Ready'}
                >
                    {status === 'building' ? '🟠' : status === 'error' ? '🔴' : '🟢'}
                </span>

                <label className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white transition-all duration-200 rounded-md text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg ml-1">
                    <span className="codicon codicon-file-symlink-file"></span> Load graph.json
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
        </header>
    );
};

import React from 'react';
import { GraphNode } from '../types';
import { GraphService } from '../services/GraphService';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onGraphLoaded: (data: any) => void;
    nodes: GraphNode[];
    selectedNodeIds: Set<string>;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onGraphLoaded, nodes, selectedNodeIds }) => {
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
        <header className="z-40 relative flex flex-shrink-0 justify-between items-center bg-[var(--vscode-editor-background)] shadow-[0_2px_8px_var(--vscode-widget-shadow)] px-4 border-[var(--vscode-panel-border)] border-b h-12">
            <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-gradient-to-br from-blue-500 to-blue-700 shadow-inner rounded-md w-7 h-7 font-bold text-white text-sm">G</div>
                <div>
                    <span className="block font-bold text-sm leading-tight tracking-wide">Graph RAG</span>
                    <span className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-widest">Expert Node Navigator</span>
                </div>
            </div>

            <div className="flex items-center gap-2">

                <button onClick={toggleTheme} className="hover:bg-[var(--vscode-toolbar-hoverBackground)] p-1.5 rounded-md text-[var(--vscode-foreground)] transition-colors duration-200">
                    <span className={`codicon ${theme === 'dark' ? 'codicon-sun' : 'codicon-moon'}`}></span>
                </button>

                <div className="bg-[var(--vscode-panel-border)] mx-1 w-[1px] h-5" />

                <label className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 hover:from-blue-500 to-blue-500 hover:to-blue-400 shadow-md hover:shadow-lg px-3 py-1.5 rounded-md text-white text-xs transition-all duration-200 cursor-pointer">
                    <span className="codicon codicon-file-symlink-file"></span> Load graph.json
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
        </header>
    );
};

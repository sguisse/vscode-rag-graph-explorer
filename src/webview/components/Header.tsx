import React from 'react';
import { GraphNode } from '../types';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onGraphLoaded: (data: any) => void;
    nodes: GraphNode[];
    selectedNodeIds: Set<string>;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onGraphLoaded, nodes, selectedNodeIds }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                onGraphLoaded(json);
            } catch (err) {
                alert('Invalid graph.json file.');
            }
        };
        reader.readAsText(file);
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

                <label className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white transition-all duration-200 rounded-md text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg">
                    <span className="codicon codicon-file-symlink-file"></span> Load graph.json
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                </label>
            </div>

            </header>
    );
};

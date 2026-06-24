import React, { useState } from 'react';
import { GraphNode } from '../types';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    onGraphLoaded: (data: any) => void;
    nodes: GraphNode[];
    selectedNodeIds: Set<string>;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, onGraphLoaded, nodes, selectedNodeIds }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalFilters, setModalFilters] = useState<string[]>(['file', 'class', 'method', 'document']);

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

    const selectedEntities = nodes.filter(n => selectedNodeIds.has(n.id) && modalFilters.includes(n.group));

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

                <button onClick={() => setIsModalOpen(true)} className="px-3 py-1.5 bg-[var(--vscode-button-secondaryBackground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] text-[var(--vscode-button-secondaryForeground)] transition-all duration-200 rounded-md text-xs flex items-center gap-1.5 shadow-sm">
                    <span className="codicon codicon-list-selection"></span> View Selection
                </button>

                <label className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white transition-all duration-200 rounded-md text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg">
                    <span className="codicon codicon-file-symlink-file"></span> Load graph.json
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                </label>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
                    <div className="bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden transform scale-100 transition-transform">
                        <div className="p-3 border-b border-[var(--vscode-panel-border)] flex justify-between items-center bg-[var(--vscode-sideBar-background)] shadow-sm z-10">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <span className="codicon codicon-list-selection text-blue-500"></span> Selected Entities
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="codicon codicon-close hover:bg-[var(--vscode-toolbar-hoverBackground)] p-1.5 rounded-md transition-colors"></button>
                        </div>

                        <div className="p-3 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)] flex gap-4 text-xs z-10 shadow-sm relative">
                            <span className="font-medium text-[var(--vscode-descriptionForeground)]">Filter by type:</span>
                            {['file', 'class', 'method', 'document'].map(type => (
                                <label key={type} className="flex items-center gap-1.5 capitalize cursor-pointer hover:text-blue-400 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={modalFilters.includes(type)}
                                        onChange={(e) => setModalFilters(prev => e.target.checked ? [...prev, type] : prev.filter(t => t !== type))}
                                        className="accent-blue-500 cursor-pointer"
                                    />
                                    {type}s
                                </label>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-[var(--vscode-input-background)]/30 inner-shadow">
                            <p className="text-xs font-semibold text-[var(--vscode-descriptionForeground)] mb-3 uppercase tracking-wider">
                                {selectedEntities.length} element(s) displayed out of {selectedNodeIds.size}
                            </p>
                            <ul className="space-y-2">
                                {selectedEntities.map(entity => (
                                    <li key={entity.id} className="flex items-center justify-between p-2 bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-md shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm">
                                                {entity.group === 'file' ? '📂' : entity.group === 'class' ? '📦' : entity.group === 'method' ? '⚡' : '📄'}
                                            </span>
                                            <span className="font-medium text-xs truncate">{entity.label}</span>
                                        </div>
                                        <span className="text-[10px] bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] px-2 py-0.5 rounded-md truncate max-w-[250px] shadow-inner">
                                            {entity.source_file || 'Undefined'}
                                        </span>
                                    </li>
                                ))}
                                {selectedEntities.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 opacity-60">
                                        <span className="codicon codicon-inbox text-4xl mb-3"></span>
                                        <span className="italic text-xs text-[var(--vscode-descriptionForeground)]">No elements to display.</span>
                                    </div>
                                )}
                            </ul>
                        </div>

                        <div className="p-3 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] text-right shadow-[0_-2px_10px_var(--vscode-widget-shadow)] z-10 relative">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-1.5 bg-[var(--vscode-button-secondaryBackground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] text-[var(--vscode-button-secondaryForeground)] text-xs font-semibold rounded-md shadow transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

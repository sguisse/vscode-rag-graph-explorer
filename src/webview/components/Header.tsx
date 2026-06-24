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
                alert('Fichier graph.json invalide.');
            }
        };
        reader.readAsText(file);
    };

    const selectedEntities = nodes.filter(n => selectedNodeIds.has(n.id) && modalFilters.includes(n.group));

    return (
        <header className="h-12 border-b border-[var(--vscode-panel-border)] flex items-center justify-between px-4 flex-shrink-0 bg-[var(--vscode-editor-background)]">
            <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm">G</div>
                <div>
                    <span className="font-bold text-sm block leading-tight">Graph RAG</span>
                    <span className="text-xs text-[var(--vscode-descriptionForeground)]">Expert Node Navigator</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--vscode-descriptionForeground)] hidden md:inline">Outil d'analyse structurelle</span>

                <button onClick={toggleTheme} className="p-1.5 hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded text-[var(--vscode-foreground)]">
                    <span className={`codicon ${theme === 'dark' ? 'codicon-sun' : 'codicon-moon'}`}></span>
                </button>

                <button onClick={() => setIsModalOpen(true)} className="px-3 py-1 bg-[var(--vscode-button-secondaryBackground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] text-[var(--vscode-button-secondaryForeground)] rounded text-xs flex items-center gap-1">
                    <span className="codicon codicon-list-selection"></span> Voir Sélection
                </button>

                <label className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer">
                    <span className="codicon codicon-file-symlink-file"></span> Charger graph.json
                    <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                </label>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-[var(--vscode-panel-border)] flex justify-between items-center bg-[var(--vscode-sideBar-background)]">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <span className="codicon codicon-list-selection text-blue-500"></span> Entités Sélectionnées
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="codicon codicon-close hover:bg-[var(--vscode-toolbar-hoverBackground)] p-1 rounded"></button>
                        </div>

                        <div className="p-3 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)] flex gap-4 text-xs">
                            <span className="font-medium">Filtrer par type :</span>
                            {['file', 'class', 'method', 'document'].map(type => (
                                <label key={type} className="flex items-center gap-1.5 capitalize cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={modalFilters.includes(type)}
                                        onChange={(e) => setModalFilters(prev => e.target.checked ? [...prev, type] : prev.filter(t => t !== type))}
                                    />
                                    {type}s
                                </label>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-[var(--vscode-input-background)]">
                            <p className="text-xs text-[var(--vscode-descriptionForeground)] mb-3">
                                {selectedEntities.length} élément(s) affiché(s) sur {selectedNodeIds.size}
                            </p>
                            <ul className="space-y-2">
                                {selectedEntities.map(entity => (
                                    <li key={entity.id} className="flex items-center justify-between p-2 bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded hover:border-blue-500 transition-colors">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm">
                                                {entity.group === 'file' ? '📂' : entity.group === 'class' ? '📦' : entity.group === 'method' ? '⚡' : '📄'}
                                            </span>
                                            <span className="font-medium text-xs truncate">{entity.label}</span>
                                        </div>
                                        <span className="text-[10px] bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] px-2 py-0.5 rounded truncate max-w-[250px]">
                                            {entity.source_file || 'Non défini'}
                                        </span>
                                    </li>
                                ))}
                                {selectedEntities.length === 0 && (
                                    <div className="text-center italic text-xs py-8 text-[var(--vscode-descriptionForeground)]">Aucun élément à afficher.</div>
                                )}
                            </ul>
                        </div>

                        <div className="p-3 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] text-right">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-1.5 bg-[var(--vscode-button-secondaryBackground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] text-[var(--vscode-button-secondaryForeground)] text-xs rounded">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

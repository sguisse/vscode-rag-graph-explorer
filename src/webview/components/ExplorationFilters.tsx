import React, { useState } from 'react';

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

    return (
        <div className="border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] flex-shrink-0">
            <div
                className="flex items-center justify-between px-4 py-2 cursor-pointer select-none font-semibold text-xs bg-[var(--vscode-editorGroupHeader-tabsBackground)]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="flex items-center gap-1.5">🔍 Filtres d'Exploration</span>
                <span className={`codicon ${isOpen ? 'codicon-chevron-up' : 'codicon-chevron-down'}`}></span>
            </div>

            {isOpen && (
                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--vscode-panel-border)]">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Types d'entités</label>
                        <select
                            multiple
                            value={selectedTypes}
                            onChange={(e) => setSelectedTypes(Array.from(e.target.selectedOptions, option => option.value))}
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-xs h-[65px] outline-none focus:border-[var(--vscode-focusBorder)]"
                        >
                            {typesList.map(type => (
                                <option key={type} value={type} className="px-1 capitalize">{type}</option>
                            ))}
                        </select>
                        <span className="text-[10px] text-[var(--vscode-descriptionForeground)] italic">Maintenez Ctrl/Cmd pour choix multiples</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Recherche Texte</label>
                        <select
                            value={searchMode}
                            onChange={(e) => setSearchMode(e.target.value)}
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-xs outline-none"
                        >
                            <option value="contains">Contient</option>
                            <option value="starts">Commence par</option>
                            <option value="exact">Exactement</option>
                        </select>
                        <div className="flex gap-1">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Filtrer..."
                                className="flex-1 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded px-2 py-0.5 text-xs outline-none focus:border-[var(--vscode-focusBorder)]"
                            />
                            {searchText && (
                                <button onClick={() => setSearchText('')} className="px-2 bg-[var(--vscode-button-secondaryBackground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] rounded text-xs">✕</button>
                            )}
                        </div>
                        <label className="flex items-center gap-1.5 text-xs mt-1 cursor-pointer">
                            <input type="checkbox" checked={isRegexEnabled} onChange={(e) => setIsRegexEnabled(e.target.checked)} />
                            <span>Activer Regex</span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Cibles d'application</label>
                        <div className="flex flex-col gap-2 mt-1">
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input type="checkbox" checked={applyOnTree} onChange={(e) => setApplyOnTree(e.target.checked)} />
                                <span>Appliquer sur l'Arbre</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input type="checkbox" checked={applyOnGraph} onChange={(e) => setApplyOnGraph(e.target.checked)} />
                                <span>Appliquer sur le Graphe</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

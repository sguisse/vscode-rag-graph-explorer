#!/bin/bash

# S'assurer que le répertoire cible existe
mkdir -p src/webview/components

# Réécriture complète de ExplorationFilters.tsx pour copier fidèlement le CSS et restaurer le résumé à droite
cat << 'EOF' > src/webview/components/ExplorationFilters.tsx
import React, { useState, useMemo } from 'react';

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

    const filterSummary = useMemo(() => {
        const typesStr = selectedTypes.length === 0 || selectedTypes.length === typesList.length ? 'All' : selectedTypes.join(', ');
        const queryStr = searchText ? `"${searchText}" (${searchMode}${isRegexEnabled ? '+Rx' : ''})` : 'None';
        const targetsStr = [applyOnTree && 'Tree', applyOnGraph && 'Graph'].filter(Boolean).join(' + ') || 'None';

        return { typesStr, queryStr, targetsStr };
    }, [selectedTypes, typesList, searchText, searchMode, isRegexEnabled, applyOnTree, applyOnGraph]);

    return (
        <div className="w-full bg-[var(--vscode-editor-background)] px-[10px] pt-2 flex-shrink-0 z-30 relative">

            {/* Injection des styles CSS partagés de l'extension Files Exporter pour garantir une uniformité parfaite */}
            <style dangerouslySetInnerHTML={{__html: `
                .collapsible-block-header {
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    user-select: none;
                    box-shadow: 0px 4px 5px -3px rgba(0, 0, 0, 0.25);
                }
                .collapsible-title-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .collapsible-summary-text {
                    font-size: 11px;
                    font-weight: normal;
                    color: var(--vscode-descriptionForeground, #858585);
                    font-style: italic;
                    padding-left: 10px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 65%;
                    text-align: right;
                }
                .collapsible-block-content {
                    margin-bottom: 15px;
                }
            `}} />

            <div className="collapsible-block" id="block-filters">

                {/* Header structurel strict aligné sur l'écosystème Files Exporter */}
                <div
                    className="collapsible-block-header"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="collapsible-title-group">
                        <span className={`codicon ${isOpen ? 'codicon-chevron-down' : 'codicon-chevron-right'}`}></span>
                        <span>🔍 Filters &amp; Scope Constraints</span>
                    </div>

                    {/* Restauration du résumé à droite en mode replié */}
                    {!isOpen && (
                        <span className="collapsible-summary-text">
                            Types: {filterSummary.typesStr} | Search: {filterSummary.queryStr} | Targets: {filterSummary.targetsStr}
                        </span>
                    )}
                </div>

                {isOpen && (
                    <div className="collapsible-block-content">
                        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--vscode-editor-background)]/30 rounded-md">

                            {/* Colonne 1 : Types de nœuds */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Entity Types</label>
                                <select
                                    multiple
                                    value={selectedTypes}
                                    onChange={(e) => setSelectedTypes(Array.from(e.target.selectedOptions, option => option.value))}
                                    className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-md p-1 text-xs min-h-[65px] h-[80px] resize-y outline-none focus:border-blue-500 transition-all shadow-inner"
                                >
                                    {typesList.map(type => (
                                        <option key={type} value={type} className="px-1.5 py-0.5 rounded-sm hover:bg-[var(--vscode-list-hoverBackground)] capitalize cursor-pointer">{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Colonne 2 : Moteur de recherche textuel (Combo en haut, Filter en dessous) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Text Search</label>

                                <select
                                    value={searchMode}
                                    onChange={(e) => setSearchMode(e.target.value)}
                                    className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-md px-2 text-xs outline-none h-7 focus:border-blue-500 transition-all shadow-sm"
                                >
                                    <option value="contains">Contains</option>
                                    <option value="starts">Starts with</option>
                                    <option value="exact">Exactly</option>
                                </select>

                                <div className="relative flex items-center w-full shadow-sm">
                                    <input
                                        type="text"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        placeholder="Filter..."
                                        className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-md pl-2 pr-7 h-7 text-xs outline-none focus:border-blue-500 transition-all"
                                    />
                                    {searchText && (
                                        <button
                                            onClick={() => setSearchText('')}
                                            className="absolute right-1.5 flex items-center justify-center p-1 rounded-sm text-[var(--vscode-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-all cursor-pointer text-[10px] codicon codicon-close"
                                            data-tooltip="Reset filter query"
                                        />
                                    )}
                                </div>

                                <label className="flex items-center gap-1.5 text-xs mt-0.5 cursor-pointer select-none hover:text-blue-400 w-max transition-colors">
                                    <input type="checkbox" checked={isRegexEnabled} onChange={(e) => setIsRegexEnabled(e.target.checked)} className="accent-blue-500 cursor-pointer w-3.5 h-3.5" />
                                    <span className="font-medium">Enable Regex</span>
                                </label>
                            </div>

                            {/* Colonne 3 : Cibles d'application */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Application Targets</label>
                                <div className="flex flex-col gap-2 mt-0.5 bg-[var(--vscode-input-background)]/20 p-2 rounded-md border border-[var(--vscode-panel-border)]/50">
                                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none hover:text-blue-400 transition-colors">
                                        <input type="checkbox" checked={applyOnTree} onChange={(e) => setApplyOnTree(e.target.checked)} className="accent-blue-500 cursor-pointer w-3.5 h-3.5" />
                                        <span className="font-medium">Apply on Tree</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none hover:text-blue-400 transition-colors">
                                        <input type="checkbox" checked={applyOnGraph} onChange={(e) => setApplyOnGraph(e.target.checked)} className="accent-blue-500 cursor-pointer w-3.5 h-3.5" />
                                        <span className="font-medium">Apply on Graph</span>
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
EOF

echo "✅ Style synchronisé et résumé restauré ! Les classes CSS .collapsible-* ont été injectées et configurées à l'identique avec affichage du résumé à droite lors du repli."

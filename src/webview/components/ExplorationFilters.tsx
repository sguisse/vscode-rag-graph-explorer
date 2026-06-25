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
        <div className="z-30 relative flex-shrink-0 bg-[var(--vscode-editor-background)] px-[10px] pt-2 w-full">

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
                        <div className="gap-4 grid grid-cols-1 md:grid-cols-3 bg-[var(--vscode-editor-background)]/30 p-1 rounded-md">

                            {/* Colonne 1 : Types de nœuds */}
                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wider">Entity Types</label>
                                <select
                                    multiple
                                    value={selectedTypes}
                                    onChange={(e) => setSelectedTypes(Array.from(e.target.selectedOptions, option => option.value))}
                                    className="bg-[var(--vscode-input-background)] shadow-inner p-1 border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-md outline-none h-[90px] min-h-[70px] text-[var(--vscode-input-foreground)] text-xs transition-all resize-y"
                                >
                                    {typesList.map(type => (
                                        <option key={type} value={type} className="px-1.5 py-0.5 rounded-sm capitalize cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)]">{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Colonne 2 : Moteur de recherche textuel (Combo en haut, Filter en dessous) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wider">Text Search</label>

                                <select
                                    value={searchMode}
                                    onChange={(e) => setSearchMode(e.target.value)}
                                    className="bg-[var(--vscode-input-background)] shadow-sm px-2 border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-md outline-none w-full h-7 text-[var(--vscode-input-foreground)] text-xs transition-all"
                                >
                                    <option value="contains">Contains</option>
                                    <option value="starts">Starts with</option>
                                    <option value="exact">Exactly</option>
                                </select>

                                <div className="relative flex items-center shadow-sm w-full">
                                    <input
                                        type="text"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        placeholder="Filter..."
                                        className="bg-[var(--vscode-input-background)] pr-7 pl-2 border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-md outline-none w-full h-7 text-[var(--vscode-input-foreground)] text-xs transition-all"
                                    />
                                    {searchText && (
                                        <button
                                            onClick={() => setSearchText('')}
                                            className="right-1.5 absolute flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] opacity-50 hover:opacity-100 p-1 rounded-sm text-[10px] text-[var(--vscode-foreground)] transition-all cursor-pointer codicon codicon-close"
                                            data-tooltip="Reset filter query"
                                        />
                                    )}
                                </div>

                                <label className="flex items-center gap-1.5 mt-0.5 w-max hover:text-blue-400 text-xs transition-colors cursor-pointer select-none">
                                    <input type="checkbox" checked={isRegexEnabled} onChange={(e) => setIsRegexEnabled(e.target.checked)} className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" />
                                    <span className="font-medium">Enable Regex</span>
                                </label>
                            </div>

                            {/* Colonne 3 : Cibles d'application */}
                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wider">Application Targets</label>
                                <div className="flex flex-col gap-2 bg-[var(--vscode-input-background)]/20 mt-0.5 p-2 border border-[var(--vscode-panel-border)]/50 rounded-md">
                                    <label className="flex items-center gap-2 hover:text-blue-400 text-xs transition-colors cursor-pointer select-none">
                                        <input type="checkbox" checked={applyOnTree} onChange={(e) => setApplyOnTree(e.target.checked)} className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" />
                                        <span className="font-medium">Apply on Tree</span>
                                    </label>
                                    <label className="flex items-center gap-2 hover:text-blue-400 text-xs transition-colors cursor-pointer select-none">
                                        <input type="checkbox" checked={applyOnGraph} onChange={(e) => setApplyOnGraph(e.target.checked)} className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" />
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

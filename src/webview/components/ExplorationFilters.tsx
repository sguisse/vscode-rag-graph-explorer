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
        /* Le panel prend désormais toute la largeur disponible mais applique un padding précis en x de 10px (px-[10px]) */
        <div className="w-full bg-[var(--vscode-editor-background)] px-[10px] pt-2 flex-shrink-0 z-30 relative">
            <div className={`w-full border border-[var(--vscode-panel-border)] rounded-md bg-[var(--vscode-editorWidget-background)] overflow-hidden transition-shadow duration-300 ${isOpen ? 'shadow-[0_4px_10px_var(--vscode-widget-shadow)]' : ''}`}>
                <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer select-none font-semibold text-xs bg-[var(--vscode-editorGroupHeader-tabsBackground)] hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                    data-tooltip="Regular Expression masks defining targeted directories and source formatting inclusions or exclusions lists."
                >
                    <div className="flex items-center gap-2 flex-shrink-0 text-[var(--vscode-foreground)]">
                        <span className={`codicon transition-transform duration-200 ${isOpen ? 'codicon-chevron-down' : 'codicon-chevron-right'}`}></span>
                        <span className="tracking-wide">🔍 Filters &amp; Scope Constraints</span>
                    </div>

                    {!isOpen && (
                        <span className="text-[10px] font-normal text-[var(--vscode-descriptionForeground)] truncate pl-4 text-right max-w-[70%] bg-[var(--vscode-badge-background)]/10 px-2 py-0.5 rounded-full">
                            <strong className="text-[var(--vscode-foreground)]">Types:</strong> {filterSummary.typesStr} <span className="text-[var(--vscode-panel-border)] mx-1">|</span>
                            <strong className="text-[var(--vscode-foreground)]">Search:</strong> {filterSummary.queryStr} <span className="text-[var(--vscode-panel-border)] mx-1">|</span>
                            <strong className="text-[var(--vscode-foreground)]">Targets:</strong> {filterSummary.targetsStr}
                        </span>
                    )}
                </div>

                {isOpen && (
                    <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--vscode-editor-background)]/30">
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
                                        className="absolute right-1 flex items-center justify-center p-1 rounded-sm text-[var(--vscode-foreground)] opacity-50 hover:opacity-100 hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-all cursor-pointer text-[10px] codicon codicon-close"
                                        data-tooltip="Reset filter query"
                                    />
                                )}
                            </div>

                            <label className="flex items-center gap-1.5 text-xs mt-0.5 cursor-pointer select-none hover:text-blue-400 w-max transition-colors">
                                <input type="checkbox" checked={isRegexEnabled} onChange={(e) => setIsRegexEnabled(e.target.checked)} className="accent-blue-500 cursor-pointer w-3.5 h-3.5" />
                                <span className="font-medium">Enable Regex</span>
                            </label>
                        </div>

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
                )}
            </div>
        </div>
    );
};

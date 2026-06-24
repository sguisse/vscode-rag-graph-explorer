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
        const typesStr = selectedTypes.length === 0 || selectedTypes.length === typesList.length ? 'All' : selectedTypes.join(',');
        const queryStr = searchText ? `"${searchText}" (${searchMode}${isRegexEnabled ? '+Rx' : ''})` : 'None';
        const targetsStr = [applyOnTree && 'Tree', applyOnGraph && 'Graph'].filter(Boolean).join(' + ') || 'None';

        return { typesStr, queryStr, targetsStr };
    }, [selectedTypes, typesList, searchText, searchMode, isRegexEnabled, applyOnTree, applyOnGraph]);

    return (
        <div className="border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] flex-shrink-0">
            <div
                className="flex items-center justify-between px-4 py-2 cursor-pointer select-none font-semibold text-xs bg-[var(--vscode-editorGroupHeader-tabsBackground)]"
                onClick={() => setIsOpen(!isOpen)}
                data-tooltip="Regular Expression masks defining targeted directories and source formatting inclusions or exclusions lists."
            >
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`codicon ${isOpen ? 'codicon-chevron-down' : 'codicon-chevron-right'}`}></span>
                    <span>🔍 Filters &amp; Scope Constraints</span>
                </div>

                {!isOpen && (
                    <span className="text-[10px] font-normal text-[var(--vscode-descriptionForeground)] truncate pl-4 text-right max-w-[70%]">
                        <strong>Types: </strong>{filterSummary.typesStr}&nbsp;&nbsp;&nbsp;
                        <strong>Search: </strong>{filterSummary.queryStr}&nbsp;&nbsp;&nbsp;
                        <strong>Targets: </strong>{filterSummary.targetsStr}
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--vscode-panel-border)]">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Entity Types</label>
                        <select
                            multiple
                            value={selectedTypes}
                            onChange={(e) => setSelectedTypes(Array.from(e.target.selectedOptions, option => option.value))}
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-xs min-h-[65px] h-[80px] resize-y outline-none focus:border-[var(--vscode-focusBorder)]"
                        >
                            {typesList.map(type => (
                                <option key={type} value={type} className="px-1 capitalize">{type}</option>
                            ))}
                        </select>
                        <span className="text-[10px] text-[var(--vscode-descriptionForeground)] italic">Hold Ctrl/Cmd for multiple choices</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Text Search</label>
                        <select
                            value={searchMode}
                            onChange={(e) => setSearchMode(e.target.value)}
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded p-1 text-xs outline-none h-7"
                        >
                            <option value="contains">Contains</option>
                            <option value="starts">Starts with</option>
                            <option value="exact">Exactly</option>
                        </select>

                        {/* Unified Text input relative wrapper block containing an absolute inner overlay clear capsule */}
                        <div className="relative flex items-center w-full">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Filter..."
                                className="w-full bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded pl-2 pr-7 h-7 text-xs outline-none focus:border-[var(--vscode-focusBorder)]"
                            />
                            {searchText && (
                                <button
                                    onClick={() => setSearchText('')}
                                    className="absolute right-1.5 flex items-center justify-center p-0.5 rounded text-[var(--vscode-foreground)] opacity-70 hover:opacity-100 hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-all cursor-pointer text-[10px] codicon codicon-close"
                                    data-tooltip="Reset filter query"
                                    aria-label="Clear filter text"
                                />
                            )}
                        </div>

                        <label className="flex items-center gap-1.5 text-xs mt-1 cursor-pointer select-none">
                            <input type="checkbox" checked={isRegexEnabled} onChange={(e) => setIsRegexEnabled(e.target.checked)} />
                            <span>Enable Regex</span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--vscode-descriptionForeground)]">Application Targets</label>
                        <div className="flex flex-col gap-2 mt-1">
                            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                <input type="checkbox" checked={applyOnTree} onChange={(e) => setApplyOnTree(e.target.checked)} />
                                <span>Apply on Tree</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                <input type="checkbox" checked={applyOnGraph} onChange={(e) => setApplyOnGraph(e.target.checked)} />
                                <span>Apply on Graph</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

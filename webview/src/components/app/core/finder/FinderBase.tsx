import React from 'react';

/**
 * Equivalent to the find/search functionality in VS Code with cmd+F in files
 */

interface FinderBaseProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    caseSensitive: boolean;
    setCaseSensitive: (val: boolean) => void;
    wholeWord: boolean;
    setWholeWord: (val: boolean) => void;
    useRegex: boolean;
    setUseRegex: (val: boolean) => void;
    currentMatchIndex: number;
    totalMatches: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
}

export const FinderBase: React.FC<FinderBaseProps> = ({
    searchQuery,
    setSearchQuery,
    caseSensitive,
    setCaseSensitive,
    wholeWord,
    setWholeWord,
    useRegex,
    setUseRegex,
    currentMatchIndex,
    totalMatches,
    onNext,
    onPrev,
    onClose
}) => {
    return (
        <div className="flex items-center gap-2 bg-[var(--vscode-editorWidget-background)] shadow-lg p-1.5 border border-[var(--vscode-widget-border,#454545)] rounded text-[var(--vscode-editorWidget-foreground)] animate-fadeIn select-none">
            {/* Zone de saisie */}
            <div className="relative flex items-center bg-[var(--vscode-input-background)] px-1.5 border border-[var(--vscode-input-border,#454545)] focus-within:border-blue-500 rounded w-64 h-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find"
                    className="bg-transparent pr-1 outline-none w-44 h-full font-sans text-[var(--vscode-input-foreground)] text-xs"
                    spellCheck={false}
                />

                {/* Modificateurs de recherche natifs VS Code */}
                <div className="flex items-center gap-0.5 text-[var(--vscode-inputOption-foreground,#858585)]">
                    <button
                        title="Match Case (Aa)"
                        onClick={() => setCaseSensitive(!caseSensitive)}
                        className={`w-4 h-4 text-[10px] font-bold rounded-sm flex items-center justify-center transition-colors cursor-pointer ${caseSensitive ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50 font-extrabold' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}
                    >
                        Aa
                    </button>
                    <button
                        title="Match Whole Word (W)"
                        onClick={() => setWholeWord(!wholeWord)}
                        className={`w-4 h-4 text-[10px] font-bold rounded-sm flex items-center justify-center transition-colors cursor-pointer ${wholeWord ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50 font-extrabold' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}
                    >
                        W
                    </button>
                    <button
                        title="Use Regular Expression (.*)"
                        onClick={() => setUseRegex(!useRegex)}
                        className={`w-4 h-4 text-[11px] font-mono rounded-sm flex items-center justify-center transition-colors cursor-pointer ${useRegex ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50 font-extrabold' : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'}`}
                    >
                        .*
                    </button>
                </div>
            </div>

            {/* Compteur d'occurrences */}
            <div className="px-1 min-w-[55px] font-sans font-medium text-[11px] text-[var(--vscode-descriptionForeground)] text-center">
                {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : 'No results'}
            </div>

            {/* Boutons de navigation */}
            <div className="flex items-center gap-0.5 pl-1 border-[var(--vscode-panel-border)] border-l text-[var(--vscode-foreground)]">
                <button
                    onClick={onPrev}
                    disabled={totalMatches === 0}
                    title="Previous Match"
                    className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] disabled:opacity-30 rounded w-5 h-5 text-xs cursor-pointer codicon codicon-arrow-up"
                />
                <button
                    onClick={onNext}
                    disabled={totalMatches === 0}
                    title="Next Match"
                    className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] disabled:opacity-30 rounded w-5 h-5 text-xs cursor-pointer codicon codicon-arrow-down"
                />
                <button
                    onClick={onClose}
                    title="Close Widget (Escape)"
                    className="flex justify-center items-center hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded w-5 h-5 text-xs cursor-pointer codicon codicon-close"
                />
            </div>
        </div>
    );
};

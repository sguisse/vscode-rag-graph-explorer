import React from 'react';

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
        <div className="bg-[var(--vscode-editorWidget-background)] text-[var(--vscode-editorWidget-foreground)] border border-[var(--vscode-widget-border,#454545)] rounded shadow-lg p-1.5 flex items-center gap-2 select-none animate-fadeIn">
            {/* Zone de saisie */}
            <div className="relative flex items-center bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border,#454545)] focus-within:border-blue-500 rounded px-1.5 h-6 w-64">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find"
                    className="bg-transparent text-[var(--vscode-input-foreground)] text-xs outline-none w-44 h-full pr-1 font-sans"
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
            <div className="text-[11px] font-sans px-1 text-[var(--vscode-descriptionForeground)] min-w-[55px] text-center font-medium">
                {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : 'No results'}
            </div>

            {/* Boutons de navigation */}
            <div className="flex items-center border-l border-[var(--vscode-panel-border)] pl-1 gap-0.5 text-[var(--vscode-foreground)]">
                <button
                    onClick={onPrev}
                    disabled={totalMatches === 0}
                    title="Previous Match"
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] disabled:opacity-30 cursor-pointer codicon codicon-arrow-up text-xs"
                />
                <button
                    onClick={onNext}
                    disabled={totalMatches === 0}
                    title="Next Match"
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] disabled:opacity-30 cursor-pointer codicon codicon-arrow-down text-xs"
                />
                <button
                    onClick={onClose}
                    title="Close Widget (Escape)"
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] cursor-pointer codicon codicon-close text-xs"
                />
            </div>
        </div>
    );
};

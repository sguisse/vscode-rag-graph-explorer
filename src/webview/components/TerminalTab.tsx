import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FinderBase } from './core/finder/FinderBase';
import { FinderHtml } from './core/finder/FinderHtml';

interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

interface TerminalTabProps {
    logs: LogEntry[];
    clearLogs: () => void;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({ logs, clearLogs }) => {
    const [selectedLevel, setSelectedLevel] = useState<string>('info');
    const [copied, setCopied] = useState<boolean>(false);

    // --- États de contrôle de la recherche ---
    const [showFind, setShowFind] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [wholeWord, setWholeWord] = useState<boolean>(false);
    const [useRegex, setUseRegex] = useState<boolean>(false);
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
    const [totalMatches, setTotalMatches] = useState<number>(0);

    const terminalEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const globalMatchCounterRef = useRef<number>(0);

    const severityMap: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

    const filteredLogs = useMemo(() => {
        const targetSeverity = severityMap[selectedLevel] ?? 1;
        return logs.filter(log => (severityMap[log.level] ?? 1) >= targetSeverity);
    }, [logs, selectedLevel]);

    // SOLID Calculation: Calcul isolé et rapide de la quantité totale d'occurrences
    useEffect(() => {
        if (!searchQuery) {
            setTotalMatches(0);
            return;
        }
        let pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord) pattern = `\\b${pattern}\\b`;

        try {
            const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
            let count = 0;
            filteredLogs.forEach(log => {
                const matches = log.message.match(regex);
                if (matches) count += matches.length;
            });
            setTotalMatches(count);
        } catch (e) {
            setTotalMatches(0);
        }
    }, [filteredLogs, searchQuery, caseSensitive, wholeWord, useRegex]);

    useEffect(() => {
        setCurrentMatchIndex(0);
    }, [searchQuery, caseSensitive, wholeWord, useRegex, selectedLevel]);

    // Gestion du défilement automatique vers l'élément sélectionné
    useEffect(() => {
        if (totalMatches === 0 || !showFind) return;
        const targetActiveElement = logsContainerRef.current?.querySelector(`[data-match-index="${currentMatchIndex}"]`);
        if (targetActiveElement) {
            targetActiveElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentMatchIndex, totalMatches, showFind]);

    useEffect(() => {
        if (!searchQuery) {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredLogs, searchQuery]);

    const handleCopy = () => {
        const textToCopy = filteredLogs.map(log => log.message).join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getLogColor = (level: string) => {
        switch (level) {
            case 'debug': return 'text-gray-400';
            case 'info': return 'text-blue-400';
            case 'warn': return 'text-yellow-500 font-semibold';
            case 'error': return 'text-red-500 font-bold';
            default: return 'text-white';
        }
    };

    // Réinitialisation de la référence de comptage avant le rendu de la boucle
    globalMatchCounterRef.current = 0;

    return (
        <div className="w-full h-full p-0 flex flex-col overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-4 relative">

                {/* Tableau de bord de contrôle supérieur */}
                <div className="bg-[var(--vscode-editorWidget-background)] p-4 rounded-xl border border-[var(--vscode-panel-border)] shadow-md flex items-center justify-between flex-shrink-0 gap-4">
                    <div className="flex items-center gap-3">
                        <span className="codicon codicon-terminal text-blue-500 text-lg"></span>
                        <h2 className="text-xs font-bold tracking-wide uppercase text-[var(--vscode-foreground)]">Backend Script Runtime Monitor</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">Filter Level:</label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] shadow-sm px-2 py-1 border border-[var(--vscode-input-border)] rounded-md outline-none text-xs font-semibold"
                        >
                            <option value="debug">🪲 Debug</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="warn">⚠️ Warn</option>
                            <option value="error">❌ Error</option>
                        </select>
                        <button
                            onClick={() => setShowFind(!showFind)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${showFind ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-600/10 text-blue-500'}`}
                        >
                            <span className="codicon codicon-search"></span> Find
                        </button>
                        <button onClick={handleCopy} className="px-3 py-1 bg-blue-600/10 text-blue-500 rounded-md text-xs font-semibold flex items-center gap-1.5">
                            <span className={"codicon " + (copied ? "codicon-check" : "codicon-copy")}></span> {copied ? "Copied!" : "Copy Logs"}
                        </button>
                        <button onClick={clearLogs} className="px-3 py-1 bg-red-600/10 text-red-500 rounded-md text-xs font-semibold flex items-center gap-1.5">
                            <span className="codicon codicon-trash"></span> Clear Output
                        </button>
                    </div>
                </div>

                {/* Injection du Toolbar de recherche abstrait */}
                {showFind && (
                    <div className="absolute top-16 right-4 z-50">
                        <FinderBase
                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                            caseSensitive={caseSensitive} setCaseSensitive={setCaseSensitive}
                            wholeWord={wholeWord} setWholeWord={setWholeWord}
                            useRegex={useRegex} setUseRegex={setUseRegex}
                            currentMatchIndex={currentMatchIndex} totalMatches={totalMatches}
                            onNext={() => setCurrentMatchIndex((p) => (p + 1 >= totalMatches ? 0 : p + 1))}
                            onPrev={() => setCurrentMatchIndex((p) => (p - 1 < 0 ? totalMatches - 1 : p - 1))}
                            onClose={() => { setSearchQuery(''); setShowFind(false); }}
                        />
                    </div>
                )}

                {/* Zone d'affichage des lignes de log */}
                <div
                    ref={logsContainerRef}
                    className="flex-1 bg-black rounded-lg border border-[var(--vscode-panel-border)] p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1 relative"
                >
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-2 leading-relaxed whitespace-pre-wrap break-all">
                                <span className={getLogColor(log.level)}>
                                    {/* Délégation complète de la surveillance lexicale à FinderHtml */}
                                    <FinderHtml
                                        text={log.message}
                                        searchQuery={searchQuery}
                                        caseSensitive={caseSensitive}
                                        wholeWord={wholeWord}
                                        useRegex={useRegex}
                                        currentMatchIndex={currentMatchIndex}
                                        globalMatchCounterRef={globalMatchCounterRef}
                                    />
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 italic">
                            No log traces captured matching current severity filter level constraint.
                        </div>
                    )}
                    <div ref={terminalEndRef} />
                </div>
            </div>
        </div>
    );
};

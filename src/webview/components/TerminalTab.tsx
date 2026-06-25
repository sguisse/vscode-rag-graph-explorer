import React, { useState, useMemo, useEffect, useRef } from 'react';

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
    // FIX : La combo de l'écran terminal est désormais positionnée sur Info ('info') par défaut
    const [selectedLevel, setSelectedLevel] = useState<string>('info');
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = () => {
        const textToCopy = filteredLogs.map(log => `[${log.timestamp}] ${log.message}`).join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const severityMap: Record<string, number> = {
        'debug': 0,
        'info': 1,
        'warn': 2,
        'error': 3
    };

    const filteredLogs = useMemo(() => {
        const targetSeverity = severityMap[selectedLevel] ?? 1;
        return logs.filter(log => (severityMap[log.level] ?? 1) >= targetSeverity);
    }, [logs, selectedLevel]);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [filteredLogs]);

    const getLogColor = (level: string) => {
        switch (level) {
            case 'debug': return 'text-gray-400';
            case 'info': return 'text-blue-400';
            case 'warn': return 'text-yellow-500 font-semibold';
            case 'error': return 'text-red-500 font-bold';
            default: return 'text-white';
        }
    };

    return (
        <div className="w-full h-full p-6 flex flex-col overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-4">
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
                            className="bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] shadow-sm px-2 py-1 border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-md outline-none text-xs font-semibold cursor-pointer"
                        >
                            <option value="debug">🪲 Debug</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="warn">⚠️ Warn</option>
                            <option value="error">❌ Error</option>
                        </select>
                        <button
                            onClick={handleCopy}
                            className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 hover:text-blue-400 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                            <span className={"codicon " + (copied ? "codicon-check" : "codicon-copy")}></span> {copied ? "Copied!" : "Copy Logs"}
                        </button>
                        <button onClick={clearLogs} className="px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5">
                            <span className="codicon codicon-trash"></span> Clear Output
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-black rounded-lg border border-[var(--vscode-panel-border)] p-4 font-mono text-xs overflow-y-auto shadow-inner flex flex-col gap-1 selection:bg-blue-500/30 select-text">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log, idx) => (
                          <div key={idx} className="flex items-start gap-2 leading-relaxed whitespace-pre-wrap break-all">
                              <span className="text-gray-500 select-none flex-shrink-0">[{log.timestamp}]</span>
                              <span className={getLogColor(log.level)}>{log.message}</span>
                          </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 italic select-none">
                            <span className="codicon codicon-blank text-3xl mb-2 opacity-40"></span>
                            No log traces captured matching current severity filter level constraint.
                        </div>
                    )}
                    <div ref={terminalEndRef} />
                </div>
            </div>
        </div>
    );
};

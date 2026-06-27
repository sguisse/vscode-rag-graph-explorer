import React from 'react';

interface FooterProps {
    status: 'ready' | 'building' | 'error';
    progress: { current: number; total: number };
    onKill: () => void;
}

export const Footer: React.FC<FooterProps> = ({ status, progress, onKill }) => {
    const percentage = progress.total > 0 ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

    return (
        <footer className="z-40 relative flex flex-shrink-0 justify-between items-center bg-[var(--vscode-editorGroupHeader-tabsBackground)] shadow-[0_-3px_8px_rgba(0,0,0,0.24)] px-4 border-[var(--vscode-panel-border)] border-t h-8 text-[var(--vscode-descriptionForeground)] text-xs select-none" >

            {/* left data quadrant */}
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-blue-400 codicon codicon-info"></span>
                <span>Graph RAG Analysis Pipeline Status Context</span>
            </div>

            {/* right loading and control action state quadrant */}
            <div className="flex items-center gap-4">

                {/* Visible immediately when status is building, regardless of the numerical total progress metrics */}
                {status === 'building' && (
                    <div className="flex items-center gap-2 animate-fadeIn">
                        {progress.total > 0 ? (
                            <>
                                <span className="opacity-80 font-bold text-[10px] uppercase tracking-wider">Orchestrator Progress:</span>
                                <div className="relative flex justify-center items-center bg-[var(--vscode-input-background)] shadow-inner border border-[var(--vscode-input-border)] rounded w-44 h-4.5 overflow-hidden font-mono font-bold text-[10px] text-[var(--vscode-input-foreground)]">
                                    <div
                                        className="top-0 left-0 absolute bg-orange-500/30 border-orange-500/50 border-r h-full transition-all duration-300 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    />
                                    <span className="z-10 relative">{progress.current}/{progress.total} ({percentage}%)</span>
                                </div>
                            </>
                        ) : (
                            <span className="opacity-80 font-semibold text-[10px] uppercase tracking-wider animate-pulse flex items-center gap-1 text-orange-400">
                                🔄 Initializing Scan Engine Tasks...
                            </span>
                        )}

                        {/* The KILL button capsule is now decoupled and always available while the background process runs */}
                        <span
                            id="btn-kill-analysis"
                            title="Kill active analysis process immediately"
                            onClick={onKill}
                            style={{
                                marginLeft: "12px",
                                background: "#b71c1c",
                                color: "#ffffff",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                fontSize: "11px",
                                display: "inline-flex",
                                alignItems: "center",
                                fontWeight: "bold",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                                cursor: "pointer"
                            }}
                        >
                            🛑 KILL
                        </span>
                    </div>
                )}

                {/* Universal core platform sync indicators */}
                <div className="flex items-center gap-1.5 bg-[var(--vscode-editor-background)]/50 py-0.5 font-semibold text-[11px]">
                    <span className="opacity-70">Engine:</span>
                    <span
                        className="text-sm cursor-help select-none"
                        title={status === 'building' ? 'Building graph via Python Backend...' : status === 'error' ? 'Python Engine Error' : 'Engine Ready'}
                    >
                        {status === 'building' ? '🟠' : status === 'error' ? '🔴' : '🟢'}
                    </span>
                </div>

            </div>
        </footer>
    );
};

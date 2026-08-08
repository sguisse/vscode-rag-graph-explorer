import React from 'react';

interface LegendProps {
    showLegend: boolean;
    onClose: () => void;
}

export const Legend: React.FC<LegendProps> = ({ showLegend, onClose }) => {
    if (!showLegend) return null;

    return (
        <div className="bottom-6 left-6 z-10 absolute space-y-2 bg-[var(--vscode-editorWidget-background)]/95 shadow-2xl backdrop-blur-md p-4 border border-[var(--vscode-panel-border)] rounded-lg w-52 text-[11px] transition-all duration-300 transform">
            <div className="flex justify-between items-center mb-2 pb-2 border-[var(--vscode-panel-border)]/50 border-b">
                <span className="block font-bold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide">Topological Legend</span>
                <button
                    onClick={onClose}
                    className="hover:bg-[var(--vscode-toolbar-hoverBackground)] p-1 rounded-md text-[10px] transition-colors cursor-pointer codicon codicon-close"
                    data-tooltip="Close legend"
                />
            </div>
            <div className="flex items-center gap-3 font-medium"><span className="flex justify-center items-center bg-[#3b82f6]/20 shadow-sm border border-[#3b82f6] rounded-md w-6 h-6 text-sm">📂</span> File Node</div>
            <div className="flex items-center gap-3 font-medium"><span className="flex justify-center items-center bg-[#22c55e]/20 shadow-sm border border-[#22c55e] rounded-md w-6 h-6 text-sm">📦</span> Class Node</div>
            <div className="flex items-center gap-3 font-medium"><span className="flex justify-center items-center bg-[#a855f7]/20 shadow-sm border border-[#a855f7] rounded-md w-6 h-6 text-sm">⚡</span> Method Node</div>
            <div className="flex items-center gap-3 font-medium"><span className="flex justify-center items-center bg-[#eab308]/20 shadow-sm border border-[#eab308] rounded-md w-6 h-6 text-sm">📄</span> Doc / Note Node</div>
        </div>
    );
};

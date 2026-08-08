import React from 'react';

interface ViewsProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

export const ViewsNavigation: React.FC<ViewsProps> = ({ activeView, setActiveView }) => {
    const views = [
        { id: 'explorer', label: 'Explorer View', icon: 'codicon-type-hierarchy-sub' },
        { id: 'ai', label: 'AI Assistant', icon: 'codicon-sparkle' },
        { id: 'terminal', label: 'Terminal', icon: 'codicon-terminal' },
        { id: 'config', label: 'Configuration', icon: 'codicon-settings-gear' }
    ];

    return (
        <div className="z-20 relative flex flex-shrink-0 bg-[var(--vscode-editorGroupHeader-viewsBackground)] shadow-[0_2px_4px_rgba(0,0,0,0.05)] overflow-x-auto" style={{ padding: '0px 10px 0px 10px' }}>
            <div className="flex gap-1">
                {views.map(view => (
                    <button
                        key={view.id}
                        id={`nav-btn-${view.id}`}
                        onClick={() => setActiveView(view.id)}
                        className={`px-4 py-1.5 text-xs font-semibold border-b-2 transition-all duration-150 outline-none whitespace-nowrap flex items-center gap-2 ${
                            activeView === view.id
                                ? 'border-blue-500 text-[var(--vscode-foreground)] bg-[var(--vscode-editor-background)]/40 shadow-[inset_0_-4px_6px_-4px_rgba(59,130,246,0.3)]'
                                : 'border-transparent text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)] hover:bg-[var(--toolbar-hoverBackground)]/50'
                        }`}
                    >
                        <span className={`codicon ${view.icon} ${activeView === view.id ? 'text-blue-500' : ''}`}></span>
                        {view.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

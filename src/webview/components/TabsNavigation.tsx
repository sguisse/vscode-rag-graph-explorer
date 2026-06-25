import React from 'react';

interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const TabsNavigation: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'explorer', label: 'Explorer View', icon: 'codicon-type-hierarchy-sub' },
        { id: 'ai', label: 'AI Assistant', icon: 'codicon-sparkle' },
        { id: 'config', label: 'Configuration', icon: 'codicon-settings-gear' }
    ];

    return (
        <div className="z-20 relative flex flex-shrink-0 bg-[var(--vscode-editorGroupHeader-tabsBackground)] shadow-[0_2px_4px_rgba(0,0,0,0.05)] overflow-x-auto" style={{ padding: '0px 10px 0px 10px' }}>
            <div className="flex gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-1.5 text-xs font-semibold border-b-2 transition-all duration-150 outline-none whitespace-nowrap flex items-center gap-2 ${
                            activeTab === tab.id
                                ? 'border-blue-500 text-[var(--vscode-foreground)] bg-[var(--vscode-editor-background)]/40 shadow-[inset_0_-4px_6px_-4px_rgba(59,130,246,0.3)]'
                                : 'border-transparent text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)]/50'
                        }`}
                    >
                        <span className={`codicon ${tab.icon} ${activeTab === tab.id ? 'text-blue-500' : ''}`}></span>
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

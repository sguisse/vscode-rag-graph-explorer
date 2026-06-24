import React from 'react';

interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const TabsNavigation: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'explorer', label: '🕸️ Explorer View' },
        { id: 'ai', label: '✨ AI Assistant' },
        { id: 'config', label: '⚙️ Configuration' }
    ];

    return (
        <div className="flex border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] overflow-x-auto flex-shrink-0">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all outline-none whitespace-nowrap ${
                        activeTab === tab.id
                            ? 'border-blue-500 text-[var(--vscode-foreground)] bg-[var(--vscode-editor-background)]'
                            : 'border-transparent text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)]'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

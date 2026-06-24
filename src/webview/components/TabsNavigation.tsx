import React from 'react';

interface TabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const TabsNavigation: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'explorer', label: '🕸️ Explorer' },
        { id: 'ai', label: '✨ AI Assistant' },
        { id: 'config', label: '⚙️ Configuration' }
    ];

    return (
        <div className="flex flex-shrink-0 bg-[var(--vscode-editorGroupHeader-tabsBackground)] border-[var(--vscode-panel-border)] border-b overflow-x-auto">
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

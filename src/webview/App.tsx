import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExplorationFilters } from './components/ExplorationFilters';
import { TabsNavigation } from './components/TabsNavigation';
import { ExplorerTab } from './components/ExplorerTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { ConfigurationTab } from './components/ConfigurationTab';
import { GraphNode, GraphEdge, ExtensionConfig } from './types';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

export const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [activeTab, setActiveTab] = useState<string>('explorer');
    const [config, setConfig] = useState<ExtensionConfig>({
        EntitiesTypesList: ['file', 'class', 'method', 'document'],
        regexFilterEnabled: false,
        TreeFilterEnabled: true,
        geminiApiKey: ''
    });

    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [searchMode, setSearchMode] = useState<string>('contains');
    const [searchText, setSearchText] = useState<string>('');
    const [isRegexEnabled, setIsRegexEnabled] = useState<boolean>(false);
    const [applyOnTree, setApplyOnTree] = useState<boolean>(true);
    const [applyOnGraph, setApplyOnGraph] = useState<boolean>(false);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'setConfig') {
                setConfig(message.config);
                setIsRegexEnabled(message.config.regexFilterEnabled);
                setApplyOnTree(message.config.TreeFilterEnabled);
                setSelectedTypes(message.config.EntitiesTypesList);
            }
        });
        vscode.postMessage({ command: 'ready' });
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
    }, [theme]);

    const handleGraphLoad = (data: { nodes: any[]; links: any[] }) => {
        const parsedNodes: GraphNode[] = (data.nodes || []).map(n => {
            let group = 'class';
            const label = n.label || n.id || '';
            if (label.includes('()')) group = 'method';
            else if (label.match(/\.(ts|js|py|json|md|sh|mjs|html|css)$/i)) group = 'file';
            if (n.file_type === 'document' || n.file_type === 'rationale') group = 'document';
            return { id: String(n.id), label, group, source_file: n.source_file, source_location: n.source_location };
        });

        const parsedEdges: GraphEdge[] = (data.links || []).map(l => ({
            from: String(l.source),
            to: String(l.target),
            type: l.relation || 'relation'
        }));

        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setSelectedNodeIds(new Set());
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden text-[var(--vscode-foreground)] bg-[var(--vscode-editor-background)]">
            <Header
                theme={theme}
                toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                onGraphLoaded={handleGraphLoad}
                nodes={nodes}
                selectedNodeIds={selectedNodeIds}
            />

            <main className="flex-1 flex flex-col min-h-0">
                <ExplorationFilters
                    typesList={config.EntitiesTypesList}
                    selectedTypes={selectedTypes}
                    setSelectedTypes={setSelectedTypes}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    isRegexEnabled={isRegexEnabled}
                    setIsRegexEnabled={setIsRegexEnabled}
                    applyOnTree={applyOnTree}
                    setApplyOnTree={setApplyOnTree}
                    applyOnGraph={applyOnGraph}
                    setApplyOnGraph={setApplyOnGraph}
                />

                <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="flex-1 relative min-h-0">
                    <div className={activeTab === 'explorer' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ExplorerTab
                            nodes={nodes}
                            edges={edges}
                            selectedNodeIds={selectedNodeIds}
                            setSelectedNodeIds={setSelectedNodeIds}
                            filters={{ selectedTypes, searchMode, searchText, isRegexEnabled, applyOnTree, applyOnGraph }}
                        />
                    </div>
                    <div className={activeTab === 'ai' ? 'absolute inset-0 flex' : 'hidden'}>
                        <AIAssistantTab
                            nodes={nodes}
                            edges={edges}
                            selectedNodeIds={selectedNodeIds}
                            apiKey={config.geminiApiKey}
                        />
                    </div>
                    <div className={activeTab === 'config' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ConfigurationTab config={config} />
                    </div>
                </div>
            </main>
        </div>
    );
};

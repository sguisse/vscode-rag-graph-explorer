import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExplorationFilters } from './components/ExplorationFilters';
import { TabsNavigation } from './components/TabsNavigation';
import { ExplorerTab } from './components/ExplorerTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { ConfigurationTab } from './components/ConfigurationTab';
import { GraphNode, GraphEdge } from './types';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
(window as any).vscodeApi = vscode;

export const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [activeTab, setActiveTab] = useState<string>('explorer');
    const [config, setConfig] = useState<any>({
        EntitiesTypesList: ['file', 'class', 'method', 'document'],
        regexFilterEnabled: false,
        TreeFilterEnabled: true,
        geminiApiKey: '',
        tooltipDelay: 2000
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
            }
        });
        vscode.postMessage({ command: 'ready' });
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
    }, [theme]);

    // Custom Tooltip Tracker Hook synchronized with workspace tooltipDelay configurations
    useEffect(() => {
        const tooltipEl = document.getElementById('global-cursor-tooltip');
        let tooltipTimeout: NodeJS.Timeout | null = null;
        let activeTarget: Element | null = null;

        const positionTooltipAtCursor = (e: MouseEvent, el: HTMLElement) => {
            const mouseX = e.clientX, mouseY = e.clientY, offset = 15;
            const rect = el.getBoundingClientRect();
            let targetTop = mouseY - (rect.height / 2);
            if (targetTop < 5) targetTop = 5;
            if (targetTop + rect.height > window.innerHeight - 5) targetTop = window.innerHeight - rect.height - 5;
            el.style.top = `${targetTop}px`;
            if (mouseX + offset + rect.width > window.innerWidth) el.style.left = `${mouseX - rect.width - offset}px`;
            else el.style.left = `${mouseX + offset}px`;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const target = (e.target as Element).closest('[data-tooltip]');
            if (target) {
                if (activeTarget !== target) {
                    activeTarget = target;
                    if (tooltipTimeout) clearTimeout(tooltipTimeout);
                    if (tooltipEl) tooltipEl.style.display = 'none';
                    tooltipTimeout = setTimeout(() => {
                        if (tooltipEl && activeTarget) {
                            tooltipEl.innerHTML = activeTarget.getAttribute('data-tooltip') || '';
                            tooltipEl.style.display = 'block';
                            positionTooltipAtCursor(e, tooltipEl);
                        }
                    }, config.tooltipDelay ?? 2000);
                } else {
                    if (tooltipEl && tooltipEl.style.display === 'block') positionTooltipAtCursor(e, tooltipEl);
                }
            } else {
                if (activeTarget) {
                    activeTarget = null;
                    if (tooltipTimeout) clearTimeout(tooltipTimeout);
                    if (tooltipEl) tooltipEl.style.display = 'none';
                }
            }
        };

        document.body.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.body.removeEventListener('mousemove', handleMouseMove);
            if (tooltipTimeout) clearTimeout(tooltipTimeout);
        };
    }, [config.tooltipDelay]);

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
                    typesList={config.EntitiesTypesList || ['file', 'class', 'method', 'document']}
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

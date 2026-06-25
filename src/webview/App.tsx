import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExplorationFilters } from './components/ExplorationFilters';
import { TabsNavigation } from './components/TabsNavigation';
import { ExplorerTab } from './components/ExplorerTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { ConfigurationTab } from './components/ConfigurationTab';
import { TerminalTab } from './components/TerminalTab';
import { GraphNode, GraphEdge } from './types';
import { GraphService } from './services/GraphService';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
(window as any).vscodeApi = vscode;

export const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [status, setStatus] = React.useState<'ready' | 'building' | 'error'>('ready');
    const [activeTab, setActiveTab] = useState<string>('explorer');
    const [config, setConfig] = useState<any>({
        EntitiesTypesList: ['file', 'class', 'method', 'document'],
        regexFilterEnabled: false,
        TreeFilterEnabled: true,
        geminiApiKey: '',
        tooltipDelay: 2000,
        graphLegendEnabled: true,
        callersDepth: 1,
        calleesDepth: 1
    });

    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [logs, setLogs] = useState<Array<{ level: 'debug' | 'info' | 'warn' | 'error'; message: string; timestamp: string }>>([]);

    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [searchMode, setSearchMode] = useState<string>('contains');
    const [searchText, setSearchText] = useState<string>('');
    const [isRegexEnabled, setIsRegexEnabled] = useState<boolean>(false);
    const [applyOnTree, setApplyOnTree] = useState<boolean>(true);
    const [applyOnGraph, setApplyOnGraph] = useState<boolean>(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.command === 'setConfig') {
                setConfig(message.config);
                setIsRegexEnabled(message.config.regexFilterEnabled);
                setApplyOnTree(message.config.TreeFilterEnabled);
            } else if (message.command === 'updateGraphData') {
                handleGraphLoad(message.payload);
            } else if (message.command === 'blastRadiusReport') {
                window.dispatchEvent(new CustomEvent('blastRadiusReport', { detail: message.payload }));
            } else if (message.command === 'logTrace') {
                setLogs(prev => [...prev, message.payload]);
            } else if (message.command === 'updateStatus') {
                setStatus(message.payload);
            }
        };

        // 1. On attache l'écouteur unique
        window.addEventListener('message', handleMessage);

        // 2. On signale qu'on est prêt
        vscode.postMessage({ command: 'ready' });

        // 3. FIX CRITIQUE : Nettoyage automatique au démontage (anti-Strict Mode & anti-doublons)
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
    }, [theme]);

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
        const { nodes: parsedNodes, edges: parsedEdges } = GraphService.buildGraph(data);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setSelectedNodeIds(new Set());
    };

    return (
        <div className="flex flex-col bg-[var(--vscode-editor-background)] w-screen h-screen overflow-hidden text-[var(--vscode-foreground)]">
            <Header
                theme={theme}
                toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                onGraphLoaded={handleGraphLoad}
                nodes={nodes}
                selectedNodeIds={selectedNodeIds}
                status={status}
            />

            <main className="flex flex-col flex-1 min-h-0">
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

                <div className="relative flex-1 min-h-0">
                    <div className={activeTab === 'explorer' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ExplorerTab
                            nodes={nodes}
                            edges={edges}
                            selectedNodeIds={selectedNodeIds}
                            setSelectedNodeIds={setSelectedNodeIds}
                            filters={{ selectedTypes, searchMode, searchText, isRegexEnabled, applyOnTree, applyOnGraph }}
                            config={config}
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
                    <div className={activeTab === 'terminal' ? 'absolute inset-0 flex' : 'hidden'}>
                        <TerminalTab logs={logs} clearLogs={() => setLogs([])} />
                    </div>
                    <div className={activeTab === 'config' ? 'absolute inset-0 flex' : 'hidden'}>
                        <ConfigurationTab config={config} />
                    </div>
                </div>
            </main>
        </div>
    );
};

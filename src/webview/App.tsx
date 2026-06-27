import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
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
    const [progress, setProgress] = React.useState<{ current: number; total: number }>({ current: 0, total: 0 });
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

                const logMessage = message.payload.message || '';
                const progressMatch = logMessage.match(/Progression de l'analyse parallèle\s*:\s*(\d+)\/(\d+)/);
                if (progressMatch) {
                    setProgress({
                        current: parseInt(progressMatch[1], 10),
                        total: parseInt(progressMatch[2], 10)
                    });
                }
            } else if (message.command === 'updateStatus') {
                setStatus(message.payload);
                if (message.payload === 'building') {
                    setProgress({ current: 0, total: 0 });
                }
            }
        };

        window.addEventListener('message', handleMessage);
        vscode.postMessage({ command: 'ready' });

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
                            let targetTop = e.clientY - 20;
                            tooltipEl.style.top = `${targetTop}px`;
                            tooltipEl.style.left = `${e.clientX + 15}px`;
                        }
                    }, config.tooltipDelay ?? 2000);
                } else if (tooltipEl && tooltipEl.style.display === 'block') {
                    tooltipEl.style.top = `${e.clientY - 20}px`;
                    tooltipEl.style.left = `${e.clientX + 15}px`;
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

            <Footer
                status={status}
                progress={progress}
                onKill={() => vscode.postMessage({ command: 'killAnalysis' })}
            />
        </div>
    );
};

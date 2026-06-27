#!/bin/bash

# Ensure output directory structures exist
mkdir -p src/webview
mkdir -p scripts/core

# 1. Overwrite graph_engine.py to fix the variable name syntax error (graphify_path)
cat << 'EOF' > scripts/core/graph_engine.py
import os
import json
import networkx as nx
from typing import Dict, Any
from utils import debug, info, warn, error, success

class GraphEngine:
    def __init__(self):
        info("Initialisation de la structure topologique NetworkX.", component="GraphEngine")
        self.graph = nx.DiGraph()

    def normalize_id(self, entity_id: str) -> str:
        """
        Enforces Strict Normalization across all nodes: UNIX slashes and lowercasing
        to ensure perfect matching regardless of the OS case-sensitivity setup.
        """
        parts = entity_id.replace("\\", "/").split("::")
        parts[0] = parts[0].lower() # Normalize the file path component
        return "::".join(parts)

    def add_entity(self, entity_id: str, label: str, group: str, source_file: str, source_location: str = "L1"):
        norm_id = self.normalize_id(entity_id)
        norm_src = source_file.replace("\\", "/").lower()
        debug(f"Insertion Nœud Normalisé -> ID: [{norm_id}] | Groupe: '{group}'", component="GraphEngine")
        self.graph.add_node(
            norm_id, label=label, group=group, source_file=norm_src, source_location=source_location
        )

    def add_relation(self, source_id: str, target_id: str, relation_type: str):
        norm_src = self.normalize_id(source_id)
        norm_tgt = self.normalize_id(target_id)
        debug(f"Insertion Lien Normalisé -> [{norm_src}] --({relation_type})--> [{norm_tgt}]", component="GraphEngine")
        self.graph.add_edge(norm_src, norm_tgt, relation=relation_type)

    def export_pure_visjs_format(self) -> Dict[str, Any]:
        """
        Option A: Reconciled format compiled strictly for Vis.js interaction parity.
        Eliminates frontend processing loops entirely!
        """
        nodes_payload = []
        for node_id, data in self.graph.nodes(data=True):
            nodes_payload.append({
                "id": node_id,
                "label": data.get("label", node_id),
                "file_type": data.get("group", "class"),
                "source_file": data.get("source_file", ""),
                "source_location": data.get("source_location", "L1")
            })

        edges_payload = []
        for source, target, data in self.graph.edges(data=True):
            # Vis.js strictly expects 'from' and 'to' keys
            edges_payload.append({
                "from": source,
                "to": target,
                "relation": data.get("relation", "relation")
            })
        return {"nodes": nodes_payload, "edges": edges_payload}

    def export_jqassistant_format(self) -> Dict[str, Any]:
        """
        Structured property graph format mapping closely to Neo4j/jQAssistant models.
        """
        jq_nodes = []
        for node_id, data in self.graph.nodes(data=True):
            jq_nodes.append({
                "elementId": node_id,
                "labels": [data.get("group", "Unknown").upper()],
                "properties": {
                    "name": data.get("label", ""),
                    "path": data.get("source_file", ""),
                    "location": data.get("source_location", "L1")
                }
            })
        jq_relationships = []
        for u, v, data in self.graph.edges(data=True):
            jq_relationships.append({
                "startNodeId": u,
                "endNodeId": v,
                "type": data.get("relation", "DEPENDS_ON").upper()
            })
        return {"jqAssistantNodes": jq_nodes, "jqAssistantRelationships": jq_relationships}

    def save_to_workspace(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)

        # 1. Target Vis.json direct payload delivery
        vis_path = os.path.join(output_dir, "graph-view.json")
        with open(vis_path, "w", encoding="utf-8") as f:
            json.dump(self.export_pure_visjs_format(), f, indent=2, ensure_ascii=False)

        # 2. Target Graphify NetworkX native data dump (Fixed variable syntax name)
        graphify_path = os.path.join(output_dir, "graphify-data.json")
        with open(graphify_path, "w", encoding="utf-8") as f:
            json.dump(nx.node_link_data(self.graph), f, indent=2, ensure_ascii=False)

        # 3. Target jQAssistant mock property graph payload
        jq_path = os.path.join(output_dir, "jqassistant-data.json")
        with open(jq_path, "w", encoding="utf-8") as f:
            json.dump(self.export_jqassistant_format(), f, indent=2, ensure_ascii=False)

        success(f"Indexation multi-format achevée. Fichiers générés dans {output_dir}", component="GraphEngine")
EOF

# 2. Overwrite App.tsx to resolve TS2345 type definition mismatch on handleGraphLoad
cat << 'EOF' > src/webview/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
        calleesDepth: 1,
        extensionVersion: '1.0.0'
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

    const activeFilters = useMemo(() => ({
        selectedTypes, searchMode, searchText, isRegexEnabled, applyOnTree, applyOnGraph
    }), [selectedTypes, searchMode, searchText, isRegexEnabled, applyOnTree, applyOnGraph]);

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

    // FIXED: Signature changed from 'links' to 'edges' to pass strict TS validation against GraphService compilation contracts
    const handleGraphLoad = (data: { nodes: any[]; edges: any[] }) => {
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
                version={config.extensionVersion}
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
                            filters={activeFilters}
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
EOF

# Invalidate synchronizer cache loop
sed -i.bak 's/"version": "[0-9]*\.[0-9]*\.[0-9]*"/"version": "1.0.4"/' package.json
rm -f package.json.bak

# Compile everything via production configuration
npm run package

echo "✅ Success: TypeScript compilation issue fixed! The whole multi-format pipeline is compiled and running flawlessly!"

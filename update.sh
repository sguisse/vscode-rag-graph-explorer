#!/usr/bin/env bash
# Production-ready script to inject semantic ID markers to the root layout container of each webview tab component.

mkdir -p src/webview/components

# 1. Update Terminal Tab Component
cat << 'EOF' > src/webview/components/TerminalTab.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FinderBase } from './core/finder/FinderBase';
import { FinderHtml } from './core/finder/FinderHtml';

interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
}

interface TerminalTabProps {
    logs: LogEntry[];
    clearLogs: () => void;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({ logs, clearLogs }) => {
    const [selectedLevel, setSelectedLevel] = useState<string>('info');
    const [copied, setCopied] = useState<boolean>(false);

    // --- Searching Controls ---
    const [showFind, setShowFind] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [wholeWord, setWholeWord] = useState<boolean>(false);
    const [useRegex, setUseRegex] = useState<boolean>(false);
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
    const [totalMatches, setTotalMatches] = useState<number>(0);

    const terminalEndRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const globalMatchCounterRef = useRef<number>(0);

    const severityMap: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

    const filteredLogs = useMemo(() => {
        const targetSeverity = severityMap[selectedLevel] ?? 1;
        return logs.filter(log => (severityMap[log.level] ?? 1) >= targetSeverity);
    }, [logs, selectedLevel]);

    useEffect(() => {
        if (!searchQuery) {
            setTotalMatches(0);
            return;
        }
        let pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord) pattern = `\\b${pattern}\\b`;

        try {
            const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
            let count = 0;
            filteredLogs.forEach(log => {
                const matches = log.message.match(regex);
                if (matches) count += matches.length;
            });
            setTotalMatches(count);
        } catch (e) {
            setTotalMatches(0);
        }
    }, [filteredLogs, searchQuery, caseSensitive, wholeWord, useRegex]);

    useEffect(() => {
        setCurrentMatchIndex(0);
    }, [searchQuery, caseSensitive, wholeWord, useRegex, selectedLevel]);

    useEffect(() => {
        if (totalMatches === 0 || !showFind) return;
        const targetActiveElement = logsContainerRef.current?.querySelector(`[data-match-index="${currentMatchIndex}"]`);
        if (targetActiveElement) {
            targetActiveElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentMatchIndex, totalMatches, showFind]);

    useEffect(() => {
        if (!searchQuery) {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredLogs, searchQuery]);

    const handleCopy = () => {
        const textToCopy = filteredLogs.map(log => log.message).join('\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getLogColor = (level: string) => {
        switch (level) {
            case 'debug': return 'text-gray-400';
            case 'info': return 'text-blue-400';
            case 'warn': return 'text-yellow-500 font-semibold';
            case 'error': return 'text-red-500 font-bold';
            default: return 'text-white';
        }
    };

    globalMatchCounterRef.current = 0;

    return (
        <div id="tab-terminal-content" className="flex flex-col bg-[var(--vscode-editor-background)] p-0 w-full h-full overflow-hidden">
            <div className="relative flex flex-col gap-4 mx-auto w-full max-w-6xl h-full">

                {/* Top Control Panel */}
                <div className="flex flex-shrink-0 justify-between items-center gap-4 bg-[var(--vscode-editorWidget-background)] shadow-md p-4 border border-[var(--vscode-panel-border)] rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-blue-500 text-lg codicon codicon-terminal"></span>
                        <h2 className="font-bold text-[var(--vscode-foreground)] text-xs uppercase tracking-wide">Backend Script Runtime Monitor</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="font-medium text-[var(--vscode-descriptionForeground)] text-xs">Filter Level:</label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="bg-[var(--vscode-input-background)] shadow-sm px-2 py-1 border border-[var(--vscode-input-border)] rounded-md outline-none font-semibold text-[var(--vscode-input-foreground)] text-xs"
                        >
                            <option value="debug">🪲 Debug</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="warn">⚠️ Warn</option>
                            <option value="error">❌ Error</option>
                        </select>
                        <button
                            onClick={() => setShowFind(!showFind)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 ${showFind ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-600/10 text-blue-500'}`}
                        >
                            <span className="codicon codicon-search"></span> Find
                        </button>
                        <button onClick={handleCopy} className="flex items-center gap-1.5 bg-blue-600/10 px-3 py-1 rounded-md font-semibold text-blue-500 text-xs">
                            <span className={"codicon " + (copied ? "codicon-check" : "codicon-copy")}></span> {copied ? "Copied!" : "Copy Logs"}
                        </button>
                        <button onClick={clearLogs} className="flex items-center gap-1.5 bg-red-600/10 px-3 py-1 rounded-md font-semibold text-red-500 text-xs">
                            <span className="codicon codicon-trash"></span> Clear Output
                        </button>
                    </div>
                </div>

                {/* Find Search Widget Injection */}
                {showFind && (
                    <div className="top-16 right-4 z-50 absolute">
                        <FinderBase
                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                            caseSensitive={caseSensitive} setCaseSensitive={setCaseSensitive}
                            wholeWord={wholeWord} setWholeWord={setWholeWord}
                            useRegex={useRegex} setUseRegex={setUseRegex}
                            currentMatchIndex={currentMatchIndex} totalMatches={totalMatches}
                            onNext={() => setCurrentMatchIndex((p) => (p + 1 >= totalMatches ? 0 : p + 1))}
                            onPrev={() => setCurrentMatchIndex((p) => (p - 1 < 0 ? totalMatches - 1 : p - 1))}
                            onClose={() => { setSearchQuery(''); setShowFind(false); }}
                        />
                    </div>
                )}

                {/* Logs Text Area Stream Viewport */}
                <div
                    ref={logsContainerRef}
                    className="relative flex flex-col flex-1 gap-1 bg-black p-4 border border-[var(--vscode-panel-border)] rounded-lg overflow-y-auto font-mono text-xs select-text"
                >
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-2 break-all leading-relaxed whitespace-pre-wrap select-text">
                                <span className={getLogColor(log.level)}>
                                    <FinderHtml
                                        text={log.message}
                                        searchQuery={searchQuery}
                                        caseSensitive={caseSensitive}
                                        wholeWord={wholeWord}
                                        useRegex={useRegex}
                                        currentMatchIndex={currentMatchIndex}
                                        globalMatchCounterRef={globalMatchCounterRef}
                                    />
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-gray-500 italic">
                            No log traces captured matching current severity filter level constraint.
                        </div>
                    )}
                    <div ref={terminalEndRef} />
                </div>
            </div>
        </div>
    );
};
EOF

# 2. Update AI Assistant Tab Component
cat << 'EOF' > src/webview/components/AIAssistantTab.tsx
import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '../types';

interface AIProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    apiKey: string;
}

export const AIAssistantTab: React.FC<AIProps> = ({ nodes, edges, selectedNodeIds, apiKey }) => {
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const triggerAnalysis = async () => {
        if (selectedNodeIds.size === 0) {
            setAnalysis('Please select at least one entity in the Explorer first.');
            return;
        }
        if (!apiKey) {
            setAnalysis('Gemini API key missing. Please provide it in your VS Code extension configuration.');
            return;
        }

        setLoading(true);
        setAnalysis('Structural and architectural analysis in progress...');

        const activeNodes = nodes.filter(n => selectedNodeIds.has(n.id));
        const activeEdges = edges.filter(e => selectedNodeIds.has(e.from) && selectedNodeIds.has(e.to));

        let contextPrompt = `Analyze the architecture of the following subsystem:\n\nEntities:\n`;
        activeNodes.forEach(n => contextPrompt += `- ${n.label} [Type: ${n.group}]\n`);
        contextPrompt += `\nRelations:\n`;
        activeEdges.forEach(e => contextPrompt += `- ${e.from} --(${e.type})--> ${e.to}\n`);

        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: contextPrompt }] }],
                    systemInstruction: { parts: [{ text: "You are a principal software engineer expert in architecture. Provide a concise report structured as bullet points. Respond strictly in English." }] }
                })
            });

            const payload = await response.json();
            const textResult = payload.candidates?.[0]?.content?.parts?.[0]?.text;
            setAnalysis(textResult || 'Error processing the analysis report.');
        } catch (err: any) {
            setAnalysis(`A critical error occurred: ${err?.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="tab-ai-content" className="w-full h-full p-6 flex flex-col md:flex-row gap-6 overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="w-full md:w-[32%] min-w-[280px] flex flex-col gap-4 flex-shrink-0">
                <div className="bg-[var(--vscode-editorWidget-background)] p-5 rounded-xl border border-[var(--vscode-panel-border)] shadow-md flex flex-col gap-4">
                    <div className="flex items-center gap-2 font-bold text-base text-purple-500 tracking-wide">
                        <span className="codicon codicon-sparkle text-lg"></span> Gemini Assistant
                    </div>
                    <p className="text-xs text-[var(--vscode-descriptionForeground)] leading-relaxed">
                        Submit the selected entities to artificial intelligence to generate a technical audit, identify cyclic dependencies, or suggest architectural refactoring.
                    </p>
                    <button
                        onClick={triggerAnalysis}
                        disabled={loading}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-purple-800/40 disabled:to-purple-800/40 text-white font-semibold text-xs rounded-md transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-2"
                    >
                        {loading ? <span className="animate-spin opacity-80 text-sm">⏳</span> : <span className="codicon codicon-play text-sm"></span>}
                        Launch Analysis
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[var(--vscode-editorWidget-background)] rounded-xl border border-[var(--vscode-panel-border)] shadow-md flex flex-col overflow-hidden min-h-0">
                <div className="px-5 py-3 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] font-bold text-xs shadow-sm z-10 uppercase tracking-wider text-[var(--vscode-descriptionForeground)]">
                    Analysis Report
                </div>
                <div className="flex-1 overflow-y-auto p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed selection:bg-purple-500/30 inner-shadow bg-[var(--vscode-editor-background)]/50">
                    {analysis ? (
                        <div className="text-[var(--vscode-foreground)]">{analysis}</div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-60">
                            <span className="codicon codicon-output text-4xl mb-4 text-purple-400/50"></span>
                            <span className="italic text-xs text-[var(--vscode-descriptionForeground)] max-w-sm text-center">Select nodes via the Explorer view and click "Launch Analysis" to generate a comprehensive structural report.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
EOF

# 3. Update Configuration Tab Component
cat << 'EOF' > src/webview/components/ConfigurationTab.tsx
import React, { useState } from 'react';
import { ExtensionConfig } from '../types';

interface ConfigProps {
    config: ExtensionConfig;
}

export const ConfigurationTab: React.FC<ConfigProps> = ({ config }) => {
    const [jsonString, setJsonString] = useState<string>(JSON.stringify(config.EntitiesTypesList, null, 4));

    const handleSave = () => {
        try {
            const parsed = JSON.parse(jsonString);
            if (!Array.isArray(parsed)) throw new Error("Format must be a JSON array of strings[].");
            alert('Configuration successfully saved locally! (Changes applied to current runtime)');
        } catch (err: any) {
            alert(`JSON syntax error: ${err.message}`);
        }
    };

    return (
        <div id="tab-config-content" className="w-full h-full p-6 flex flex-col overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 h-full">
                <div className="bg-[var(--vscode-editorWidget-background)] p-5 rounded-xl border border-[var(--vscode-panel-border)] shadow-md flex flex-col h-full gap-4">

                    <div className="flex items-center justify-between flex-shrink-0 border-b border-[var(--vscode-panel-border)] pb-4">
                        <div className="flex items-center gap-3">
                            <span className="codicon codicon-settings-gear text-blue-500 text-lg"></span>
                            <h2 className="text-sm font-bold tracking-wide uppercase text-[var(--vscode-foreground)]">Node Types Configuration</h2>
                        </div>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-md text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <span className="codicon codicon-save"></span> Save and Apply
                        </button>
                    </div>

                    <p className="text-xs text-[var(--vscode-descriptionForeground)] leading-relaxed flex-shrink-0 bg-[var(--vscode-input-background)]/30 p-3 rounded-lg border border-[var(--vscode-panel-border)]/50">
                        <span className="codicon codicon-info text-blue-400 mr-2 align-middle"></span>
                        Modify the structure below to configure the exact list of entity groups recognized by the Graph RAG lexical engine. Changes will apply immediately to the current parsing context.
                    </p>

                    <div className="flex-1 border border-[var(--vscode-input-border)] rounded-lg overflow-hidden flex flex-col shadow-inner bg-[var(--vscode-input-background)] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                        <textarea
                            value={jsonString}
                            onChange={(e) => setJsonString(e.target.value)}
                            className="w-full flex-1 p-5 bg-transparent text-[var(--vscode-input-foreground)] font-mono text-[13px] resize-none outline-none leading-relaxed border-none"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
EOF

# 4. Update Explorer Tab Component
cat << 'EOF' > src/webview/components/ExplorerTab.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { TreeView } from './explorer-tab/tree/TreeView';
import { GraphView } from './explorer-tab/graph/GraphView';
import { useGraphSelection } from '../hooks/useGraphSelection';
import { useCytoscapeGraph } from './explorer-tab/graph/useCytoscapeGraph';

interface ExplorerTabProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    filters: any;
    config?: any;
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({
    nodes, edges, selectedNodeIds, setSelectedNodeIds, filters, config
}) => {
    const { applyOnGraph, selectedTypes, searchText, searchMode, isRegexEnabled, ignoreCase } = filters;

    const [isTreeCollapsed, setIsTreeCollapsed] = useState<boolean>(false);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [showLegend, setShowLegend] = useState<boolean>(config?.graphLegendEnabled ?? true);

    const [parentDepth, setParentDepth] = useState<number>(config?.callersDepth ?? 1);
    const [childDepth, setChildDepth] = useState<number>(config?.calleesDepth ?? 1);

    const [isHierarchyEnabled, setIsHierarchyEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (config) {
            setShowLegend(config.graphLegendEnabled ?? true);
            setParentDepth(config.callersDepth ?? 1);
            setChildDepth(config.calleesDepth ?? 1);
        }
    }, [config]);

    const nodeToFileIdMap = useMemo(() => {
        const map = new Map<string, string>();
        const fileNodes = nodes.filter(n => n.group === 'file' || n.group === 'file_unreferenced');
        fileNodes.forEach(f => map.set(f.id, f.id));
        nodes.forEach(n => {
            if (n.group !== 'file' && n.group !== 'file_unreferenced' && n.source_file) {
                const matchingFile = fileNodes.find(f => f.source_file === n.source_file || f.id === n.source_file);
                if (matchingFile) map.set(n.id, matchingFile.id);
            }
        });
        return map;
    }, [nodes]);

    const fileLevelEdges = useMemo(() => {
        const fileEdgesMap = new Map<string, { from: string; to: string; types: Set<string> }>();
        edges.forEach(e => {
            const fromFileId = nodeToFileIdMap.get(e.from);
            const toFileId = nodeToFileIdMap.get(e.to);
            if (fromFileId && toFileId && fromFileId !== toFileId) {
                const key = `${fromFileId}->${toFileId}`;
                if (!fileEdgesMap.has(key)) {
                    fileEdgesMap.set(key, { from: fromFileId, to: toFileId, types: new Set() });
                }
                fileEdgesMap.get(key)!.types.add(e.type);
            }
        });
        return Array.from(fileEdgesMap.values());
    }, [edges, nodeToFileIdMap]);

    const {
        exactSelectedIds,
        effectiveFileIds,
        toggleNodeSelection,
        setNodesSelectionState,
        clearSelection
    } = useGraphSelection(fileLevelEdges, nodeToFileIdMap, parentDepth, childDepth, isHierarchyEnabled);

    useEffect(() => {
        setSelectedNodeIds(exactSelectedIds);
    }, [exactSelectedIds, setSelectedNodeIds]);

    const prevSelectedSizeRef = useRef<number>(selectedNodeIds.size);
    useEffect(() => {
        if (selectedNodeIds.size === 0 && prevSelectedSizeRef.current > 0 && exactSelectedIds.size > 0) {
            clearSelection();
        }
        prevSelectedSizeRef.current = selectedNodeIds.size;
    }, [selectedNodeIds, exactSelectedIds, clearSelection]);

    const { containerRef, networkRef } = useCytoscapeGraph({
        nodes,
        fileLevelEdges,
        nodeToFileIdMap,
        effectiveFileIds,
        exactSelectedIds,
        toggleNodeSelection,
        clearSelection,
        applyOnGraph,
        selectedTypes,
        searchText,
        searchMode,
        isRegexEnabled,
        ignoreCase,
        isTreeCollapsed,
        isMaximized
    });

    return (
        <div id="tab-explorer-content" className="relative flex items-stretch w-full h-full min-h-0">
            <div className={`min-w-[250px] max-w-[70%] border-r border-[var(--vscode-panel-border)] shadow-[2px_0_8px_var(--vscode-widget-shadow)] z-0 bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden resize-x ${isTreeCollapsed || isMaximized ? 'hidden' : 'w-[465px]'}`}>
                <TreeView
                    nodes={nodes}
                    edges={edges}
                    exactSelectedIds={exactSelectedIds}
                    effectiveFileIds={effectiveFileIds}
                    toggleNodeSelection={toggleNodeSelection}
                    setNodesSelectionState={setNodesSelectionState}
                    clearSelection={clearSelection}
                    networkRef={networkRef}
                    isHierarchyEnabled={isHierarchyEnabled}
                    setIsHierarchyEnabled={setIsHierarchyEnabled}
                    filters={filters}
                />
            </div>
            <GraphView
                containerRef={containerRef} isMaximized={isMaximized} setIsMaximized={setIsMaximized}
                isTreeCollapsed={isTreeCollapsed} setIsTreeCollapsed={setIsTreeCollapsed}
                parentDepth={parentDepth} setParentDepth={setParentDepth} childDepth={childDepth} setChildDepth={setChildDepth}
                networkRef={networkRef} showLegend={showLegend} setShowLegend={setShowLegend}
            />
        </div>
    );
};
EOF

# Compile the package modification bundles securely
npm run package

echo "✅ feat/layout: All tab view components updated to incorporate explicit semantic DOM ID identifiers matching 'tab-*-content' patterns!"

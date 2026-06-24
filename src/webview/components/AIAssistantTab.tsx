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
        <div className="w-full h-full p-4 flex flex-col md:flex-row gap-4 overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="w-full md:w-[30%] min-w-[250px] flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 font-semibold text-sm text-purple-400">
                    <span className="codicon codicon-sparkle"></span> Gemini Assistant
                </div>
                <p className="text-xs text-[var(--vscode-descriptionForeground)] leading-relaxed">
                    Submit the selected entities to artificial intelligence to generate a technical audit, identify cyclic dependencies, or suggest architectural refactoring.
                </p>
                <button
                    onClick={triggerAnalysis}
                    disabled={loading}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/40 text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 shadow"
                >
                    {loading ? <span className="animate-spin opacity-70">⏳</span> : <span className="codicon codicon-play"></span>}
                    Launch Analysis
                </button>
            </div>

            <div className="flex-1 border border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] rounded flex flex-col overflow-hidden min-h-0 shadow-inner">
                <div className="px-3 py-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] font-bold text-xs">
                    Analysis Report
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed selection:bg-purple-500/30">
                    {analysis || (
                        <div className="text-center italic text-[var(--vscode-descriptionForeground)] py-12">
                            Select nodes via the Explorer view and click "Launch Analysis" to generate the report.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

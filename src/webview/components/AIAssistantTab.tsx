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
        <div className="w-full h-full p-6 flex flex-col md:flex-row gap-6 overflow-hidden bg-[var(--vscode-editor-background)]">
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

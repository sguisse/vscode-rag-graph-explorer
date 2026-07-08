import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '../types';

interface AIProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedNodeIds: Set<string>;
    apiKey: string;
}

export const AIAssistantView: React.FC<AIProps> = ({ nodes, edges, selectedNodeIds, apiKey }) => {
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
        <div id="view-ai-content" className="flex md:flex-row flex-col gap-6 bg-[var(--vscode-editor-background)] p-6 w-full h-full overflow-hidden">
            <div className="flex flex-col flex-shrink-0 gap-4 w-full md:w-[32%] min-w-[280px]">
                <div className="flex flex-col gap-4 bg-[var(--vscode-editorWidget-background)] shadow-md p-5 border border-[var(--vscode-panel-border)] rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-purple-500 text-base tracking-wide">
                        <span className="text-lg codicon codicon-sparkle"></span> Gemini Assistant
                    </div>
                    <p className="text-[var(--vscode-descriptionForeground)] text-xs leading-relaxed">
                        Submit the selected entities to artificial intelligence to generate a technical audit, identify cyclic dependencies, or suggest architectural refactoring.
                    </p>
                    <button
                        id="ai-btn-launch-analysis"
                        onClick={triggerAnalysis}
                        disabled={loading}
                        className="flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 hover:from-purple-500 disabled:from-purple-800/40 to-purple-500 hover:to-purple-400 disabled:to-purple-800/40 shadow-md hover:shadow-lg mt-2 py-2.5 rounded-md w-full font-semibold text-white text-xs transition-all"
                    >
                        {loading ? <span className="opacity-80 text-sm animate-spin">⏳</span> : <span className="text-sm codicon codicon-play"></span>}
                        Launch Analysis
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1 bg-[var(--vscode-editorWidget-background)] shadow-md border border-[var(--vscode-panel-border)] rounded-xl min-h-0 overflow-hidden">
                <div className="z-10 bg-[var(--vscode-editorGroupHeader-viewsBackground)] shadow-sm px-5 py-3 border-[var(--vscode-panel-border)] border-b font-bold text-[var(--vscode-descriptionForeground)] text-xs uppercase tracking-wider">
                    Analysis Report
                </div>
                <div id="ai-report-output-container" className="flex-1 bg-[var(--vscode-editor-background)]/50 selection:bg-purple-500/30 inner-shadow p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis ? (
                        <div className="text-[var(--vscode-foreground)]">{analysis}</div>
                    ) : (
                        <div id="ai-empty-state-container" className="flex flex-col justify-center items-center opacity-60 h-full">
                            <span className="mb-4 text-purple-400/50 text-4xl codicon codicon-output"></span>
                            <span className="max-w-sm text-[var(--vscode-descriptionForeground)] text-xs text-center italic">Select nodes via the Explorer view and click "Launch Analysis" to generate a comprehensive structural report.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

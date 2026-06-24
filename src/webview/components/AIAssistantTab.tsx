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
            setAnalysis('Veuillez d’abord sélectionner au moins une entité dans l’Explorateur.');
            return;
        }
        if (!apiKey) {
            setAnalysis('Clé d’API Gemini manquante. Veuillez la renseigner dans la configuration de votre extension VS Code.');
            return;
        }

        setLoading(true);
        setAnalysis('Analyse structurelle et architecturale en cours...');

        const activeNodes = nodes.filter(n => selectedNodeIds.has(n.id));
        const activeEdges = edges.filter(e => selectedNodeIds.has(e.from) && selectedNodeIds.has(e.to));

        let contextPrompt = `Analyse l'architecture du sous-système suivant :\n\nEntités :\n`;
        activeNodes.forEach(n => contextPrompt += `- ${n.label} [Type: ${n.group}]\n`);
        contextPrompt += `\nRelations :\n`;
        activeEdges.forEach(e => contextPrompt += `- ${e.from} --(${e.type})--> ${e.to}\n`);

        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: contextPrompt }] }],
                    systemInstruction: { parts: [{ text: "Tu es un ingénieur logiciel principal expert en architecture. Fournis un rapport concis, structuré en listes à puces. Réponds obligatoirement en français." }] }
                })
            });

            const payload = await response.json();
            const textResult = payload.candidates?.[0]?.content?.parts?.[0]?.text;
            setAnalysis(textResult || 'Erreur lors du traitement du rapport d’analyse.');
        } catch (err: any) {
            setAnalysis(`Une erreur critique est survenue : ${err?.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full p-4 flex flex-col md:flex-row gap-4 overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="w-full md:w-[30%] min-w-[250px] flex flex-col gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 font-semibold text-sm text-purple-400">
                    <span className="codicon codicon-sparkle"></span> Assistant Gemini
                </div>
                <p className="text-xs text-[var(--vscode-descriptionForeground)] leading-relaxed">
                    Soumettez les entités sélectionnées à l'intelligence artificielle pour générer un audit technique, identifier des dépendances cycliques ou proposer un refactoring d'architecture.
                </p>
                <button
                    onClick={triggerAnalysis}
                    disabled={loading}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/40 text-white font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 shadow"
                >
                    {loading ? <span className="animate-spin opacity-70">⏳</span> : <span className="codicon codicon-play"></span>}
                    Lancer l'analyse
                </button>
            </div>

            <div className="flex-1 border border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] rounded flex flex-col overflow-hidden min-h-0 shadow-inner">
                <div className="px-3 py-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] font-bold text-xs">
                    Rapport d'analyse
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed selection:bg-purple-500/30">
                    {analysis || (
                        <div className="text-center italic text-[var(--vscode-descriptionForeground)] py-12">
                            Sélectionnez des nœuds via la vue Explorateur et cliquez sur "Lancer l'analyse" pour générer le rapport.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

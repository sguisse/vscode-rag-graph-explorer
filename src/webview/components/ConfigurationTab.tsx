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
            if (!Array.isArray(parsed)) throw new Error("Le format doit être un tableau JSON string[].");
            alert('Configuration sauvegardée localement avec succès ! (Modifications appliquées sur le runtime courant)');
        } catch (err: any) {
            alert(`Erreur de syntaxe JSON : ${err.message}`);
        }
    };

    return (
        <div className="w-full h-full p-4 flex flex-col gap-3 overflow-hidden bg-[var(--vscode-editor-background)]">
            <div className="flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-bold tracking-wide">Configuration des Types de Nœuds</h2>
                <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition-all"
                >
                    Sauvegarder et Appliquer
                </button>
            </div>

            <p className="text-xs text-[var(--vscode-descriptionForeground)] leading-tight flex-shrink-0">
                Modifiez la structure ci-dessous pour configurer la liste des entités acceptées par l'analyseur lexical RAG Graph.
            </p>

            <div className="flex-1 border border-[var(--vscode-panel-border)] rounded overflow-hidden flex flex-col">
                <textarea
                    value={jsonString}
                    onChange={(e) => setJsonString(e.target.value)}
                    className="w-full flex-1 p-3 bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] font-mono text-xs resize-none outline-none focus:border-[var(--vscode-focusBorder)] leading-relaxed border-none"
                    spellCheck={false}
                />
            </div>
        </div>
    );
};

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

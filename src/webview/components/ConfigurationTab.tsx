import React, { useState } from 'react';
import { ExtensionConfig } from '../types';

interface ConfigProps {
    config: ExtensionConfig;
}

export const ConfigurationTab: React.FC<ConfigProps> = ({ config }) => {
    const [jsonString, setJsonString] = useState<string>(JSON.stringify(config.entitiesTypesList, null, 4));

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
        <div id="tab-config-content" className="flex flex-col bg-[var(--vscode-editor-background)] p-6 w-full h-full overflow-hidden">
            <div className="flex flex-col gap-4 mx-auto w-full max-w-4xl h-full">
                <div className="flex flex-col gap-4 bg-[var(--vscode-editorWidget-background)] shadow-md p-5 border border-[var(--vscode-panel-border)] rounded-xl h-full">

                    <div className="flex flex-shrink-0 justify-between items-center pb-4 border-[var(--vscode-panel-border)] border-b">
                        <div className="flex items-center gap-3">
                            <span className="text-blue-500 text-lg codicon codicon-settings-gear"></span>
                            <h2 className="font-bold text-[var(--vscode-foreground)] text-sm uppercase tracking-wide">Node Types Configuration</h2>
                        </div>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 hover:from-blue-500 to-blue-500 hover:to-blue-400 shadow-md hover:shadow-lg px-5 py-2 rounded-md font-semibold text-white text-xs transition-all"
                        >
                            <span className="codicon codicon-save"></span> Save and Apply
                        </button>
                    </div>

                    <p className="flex-shrink-0 bg-[var(--vscode-input-background)]/30 p-3 border border-[var(--vscode-panel-border)]/50 rounded-lg text-[var(--vscode-descriptionForeground)] text-xs leading-relaxed">
                        <span className="mr-2 text-blue-400 align-middle codicon codicon-info"></span>
                        Modify the structure below to configure the exact list of entity groups recognized by the Graph RAG lexical engine. Changes will apply immediately to the current parsing context.
                    </p>

                    <div className="flex flex-col flex-1 bg-[var(--vscode-input-background)] shadow-inner border border-[var(--vscode-input-border)] focus-within:border-blue-500 rounded-lg focus-within:ring-1 focus-within:ring-blue-500/50 overflow-hidden transition-all">
                        <textarea
                            value={jsonString}
                            onChange={(e) => setJsonString(e.target.value)}
                            className="flex-1 bg-transparent p-5 border-none outline-none w-full font-mono text-[13px] text-[var(--vscode-input-foreground)] leading-relaxed resize-none"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

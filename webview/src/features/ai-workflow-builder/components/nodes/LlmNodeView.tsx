import React from 'react';
import { Cpu, Plus, Trash2 } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode, WorkflowPort } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

const PROVIDER_MODELS: Record<string, string[]> = {
  Ollama: ['llama3:latest', 'mistral:latest', 'phi3:latest', 'codellama:latest'],
  Copilot: ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet'],
  Gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  Claude: ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus'],
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview'],
};

export function LlmNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  const provider = node.data.llmProvider || 'Ollama';
  const availableModels = PROVIDER_MODELS[provider] || PROVIDER_MODELS.Ollama;
  const selectedModel = node.data.model || availableModels[0];

  const fileContextPorts = node.data.ports.filter(
    (p) => p.direction === 'input' && p.id !== 'prompt_in'
  );

  const addFileContextPort = () => {
    const ctxCount = fileContextPorts.length + 1;
    const newPort: WorkflowPort = {
      id: `file_ctx_${Date.now()}`,
      name: `fileCtx ${ctxCount}`,
      type: 'text',
      direction: 'input',
      color: 'bg-purple-400',
    };
    updateNodeData(node.id, {
      ports: [...node.data.ports, newPort],
    });
  };

  const removeFileContextPort = (portId: string) => {
    if (fileContextPorts.length <= 1) return;
    updateNodeData(node.id, {
      ports: node.data.ports.filter((p) => p.id !== portId),
    });
  };

  return (
    <BaseNodeContainer node={node} icon={Cpu} headerBg="bg-amber-500/15">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">LLM Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              const newProv = e.target.value as any;
              const newModel = PROVIDER_MODELS[newProv]?.[0] || 'default';
              updateNodeData(node.id, { llmProvider: newProv, model: newModel });
            }}
            className="mt-0.5 p-1 bg-background border border-border rounded w-full text-[11px] font-mono cursor-pointer"
          >
            <option value="Ollama">Ollama</option>
            <option value="Copilot">Copilot</option>
            <option value="Gemini">Gemini</option>
            <option value="Claude">Claude</option>
            <option value="OpenAI">OpenAI</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Model Selection</label>
          <select
            value={selectedModel}
            onChange={(e) => updateNodeData(node.id, { model: e.target.value })}
            className="mt-0.5 p-1 bg-background border border-border rounded w-full text-[11px] font-mono cursor-pointer"
          >
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">
              File Contexts ({fileContextPorts.length})
            </label>
            <button
              type="button"
              onClick={addFileContextPort}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded font-semibold text-[9px] cursor-pointer transition-colors"
            >
              <Plus size={10} /> Add Ctx
            </button>
          </div>

          <div className="space-y-1 max-h-16 overflow-y-auto pr-0.5">
            {fileContextPorts.map((port) => (
              <div
                key={port.id}
                className="flex items-center justify-between bg-muted/40 px-1.5 py-0.5 border border-border/60 rounded text-[10px]"
              >
                <span className="font-semibold text-purple-400 truncate">{port.name}</span>
                {fileContextPorts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFileContextPort(port.id)}
                    className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer"
                    title="Remove context port"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseNodeContainer>
  );
}

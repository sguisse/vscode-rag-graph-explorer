import React from 'react';
import { Terminal, Plus, Trash2 } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode, WorkflowPort } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function ScriptNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  const scriptType = node.data.scriptType || 'python';
  const scriptLocation = node.data.scriptLocation || '';
  const inputPorts = node.data.ports.filter((p) => p.direction === 'input');

  const addArgumentPort = () => {
    const argCount = inputPorts.length + 1;
    const newPort: WorkflowPort = {
      id: `arg_${Date.now()}`,
      name: `arg_${argCount}`,
      type: 'text',
      direction: 'input',
      color: 'bg-purple-400',
    };
    updateNodeData(node.id, {
      ports: [...node.data.ports, newPort],
    });
  };

  const removeArgumentPort = (portId: string) => {
    if (inputPorts.length <= 1) return;
    updateNodeData(node.id, {
      ports: node.data.ports.filter((p) => p.id !== portId),
    });
  };

  return (
    <BaseNodeContainer node={node} icon={Terminal} headerBg="bg-purple-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Script Type</label>
          <select
            value={scriptType}
            onChange={(e) => updateNodeData(node.id, { scriptType: e.target.value as 'python' | 'bash' })}
            className="mt-0.5 p-1 bg-background border border-border rounded w-full text-[11px] font-mono cursor-pointer"
          >
            <option value="python">python</option>
            <option value="bash">bash</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Script Location</label>
          <input
            type="text"
            value={scriptLocation}
            onChange={(e) => updateNodeData(node.id, { scriptLocation: e.target.value })}
            placeholder="scripts/run.py"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">
              Arguments ({inputPorts.length})
            </label>
            <button
              type="button"
              onClick={addArgumentPort}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded font-semibold text-[9px] cursor-pointer transition-colors"
            >
              <Plus size={10} /> Add Arg
            </button>
          </div>

          <div className="space-y-1 max-h-20 overflow-y-auto pr-0.5">
            {inputPorts.map((port) => (
              <div
                key={port.id}
                className="flex items-center justify-between bg-muted/40 px-1.5 py-0.5 border border-border/60 rounded text-[10px]"
              >
                <span className="font-semibold text-purple-400 truncate">{port.name}</span>
                {inputPorts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArgumentPort(port.id)}
                    className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer"
                    title="Remove argument port"
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

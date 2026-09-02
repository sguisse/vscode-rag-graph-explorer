#!/usr/bin/env bash
set -e

echo "🚀 Integrating ScriptNodeView, ArgumentNodeView, and OutputAnalyzerNodeView..."

# 1. Ensure target directories exist
mkdir -p webview/src/features/ai-workflow-builder
mkdir -p webview/src/features/ai-workflow-builder/constants
mkdir -p webview/src/features/ai-workflow-builder/shapes
mkdir -p webview/src/features/ai-workflow-builder/components/nodes
mkdir -p webview/src/features/ai-workflow-builder/components/palette
mkdir -p webview/src/features/ai-workflow-builder/components/canvas
mkdir -p webview/src/features/ai-workflow-builder/components/inspector
mkdir -p webview/src/features/ai-workflow-builder/hooks

# 2. Update Model Definitions (model-ui.ts)
cat << 'EOF' > webview/src/features/ai-workflow-builder/model-ui.ts
export type NodeType =
  | 'textInput'
  | 'markdownFile'
  | 'aiAgent'
  | 'searchTool'
  | 'formattedOutput'
  | 'instructionBox'
  | 'annotation'
  | 'script'
  | 'argument'
  | 'outputAnalyzer';

export type PortType = 'prompt' | 'skill' | 'tool' | 'text' | 'result' | 'note';
export type PortDirection = 'input' | 'output';

export type EdgeStyle = 'solid' | 'dashed' | 'dotted';
export type NodeFontFamily = 'Sans' | 'Mono' | 'Serif';

export interface WorkflowPort {
  id: string;
  name: string;
  type: PortType;
  direction: PortDirection;
  color?: string;
}

export interface BaseNodeData {
  label: string;
  type: NodeType;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  executionTimeMs?: number;
  ports: WorkflowPort[];
  promptText?: string;
  markdownFile?: string;
  instructionText?: string;
  model?: string;
  tokenBudget?: number;
  subreddit?: string;
  topicLimit?: number;
  outputText?: string;
  annotationTitle?: string;
  annotationSteps?: string[];
  annotationTip?: string;

  // Script & Logic Node Properties
  scriptType?: 'python' | 'bash';
  scriptLocation?: string;
  argumentName?: string;
  argumentValue?: string;
  analyzerCondition?: string;
  analyzerStatus?: 'OK' | 'KO' | 'idle';

  // Appearance Customization
  fillColor?: string;
  textColor?: string;
  borderColor?: string;
  fontFamily?: NodeFontFamily;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: BaseNodeData;
  parentId?: string;
  width?: number;
  height?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  label?: string;
  style?: EdgeStyle;
  color?: string;
  labelColor?: string;
  labelTextColor?: string;
}

export interface WorkflowSchema {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface PaletteItemDefinition {
  type: NodeType;
  label: string;
  category: 'Inputs' | 'Agent' | 'Tools' | 'Output' | 'Annotations' | 'Scripts' | 'Logic';
  description: string;
  iconName: string;
  badge?: string;
}
EOF

# 3. Update Palette Item Definitions (node-registry.constants.ts)
cat << 'EOF' > webview/src/features/ai-workflow-builder/constants/node-registry.constants.ts
import { PaletteItemDefinition } from '../model-ui';

export const PALETTE_ITEMS: PaletteItemDefinition[] = [
  {
    type: 'textInput',
    label: 'Text Input',
    category: 'Inputs',
    description: 'The starting prompt for the flow',
    iconName: 'Type',
  },
  {
    type: 'markdownFile',
    label: 'Markdown File',
    category: 'Inputs',
    description: 'A Markdown instruction file for the flow',
    iconName: 'FileText',
  },
  {
    type: 'aiAgent',
    label: 'AI Agent',
    category: 'Agent',
    description: 'Runs an LLM with tool calling',
    iconName: 'Bot',
    badge: 'Core',
  },
  {
    type: 'searchTool',
    label: 'Search Reddit',
    category: 'Tools',
    description: 'Finds trending posts in a subreddit',
    iconName: 'Search',
  },
  {
    type: 'script',
    label: 'Script Execution',
    category: 'Scripts',
    description: 'Execute Python or Bash scripts with argument inputs',
    iconName: 'Terminal',
  },
  {
    type: 'argument',
    label: 'Script Argument',
    category: 'Scripts',
    description: 'Key/Value input argument for script execution',
    iconName: 'Variable',
  },
  {
    type: 'outputAnalyzer',
    label: 'Output Analyzer',
    category: 'Logic',
    description: 'Evaluates workflow output with OK / KO branch endpoints',
    iconName: 'GitFork',
  },
  {
    type: 'formattedOutput',
    label: 'Formatted Output',
    category: 'Output',
    description: 'Renders the result as Markdown',
    iconName: 'LayoutTemplate',
  },
  {
    type: 'annotation',
    label: 'Annotation Note',
    category: 'Annotations',
    description: 'Movable setup notes box with dashed link',
    iconName: 'Info',
  },
];
EOF

# 4. Update Node Factory (workflow-shapes.ts)
cat << 'EOF' > webview/src/features/ai-workflow-builder/shapes/workflow-shapes.ts
import { NodeType, WorkflowNode } from '../model-ui';

export function createDefaultNode(type: NodeType, position: { x: number; y: number }): WorkflowNode {
  const id = `node-${type}-${Date.now()}`;

  switch (type) {
    case 'textInput':
      return {
        id,
        type,
        position,
        width: 240,
        height: 180,
        data: {
          label: 'Text Input',
          type,
          description: 'The starting prompt for the flow',
          promptText: 'Enter your custom AI prompt here...',
          ports: [{ id: 'text', name: 'text', type: 'text', direction: 'output', color: 'bg-rose-400' }],
        },
      };
    case 'markdownFile':
      return {
        id,
        type,
        position,
        width: 240,
        height: 220,
        data: {
          label: 'Markdown File',
          type,
          description: 'Instruction markdown prompt file',
          markdownFile: 'skill-definition.md',
          instructionText: 'You are an AI system assistant.',
          ports: [{ id: 'skill', name: 'skill', type: 'skill', direction: 'output', color: 'bg-amber-500' }],
        },
      };
    case 'aiAgent':
      return {
        id,
        type,
        position,
        width: 260,
        height: 240,
        data: {
          label: 'AI Agent',
          type,
          description: 'Runs an LLM with tool calling',
          model: 'Mock - Offline',
          tokenBudget: 1000,
          ports: [
            { id: 'prompt', name: 'prompt', type: 'prompt', direction: 'input', color: 'bg-amber-400' },
            { id: 'skill', name: 'skill', type: 'skill', direction: 'input', color: 'bg-amber-500' },
            { id: 'agent_tools', name: 'agent tools', type: 'tool', direction: 'input', color: 'bg-rose-400' },
            { id: 'result', name: 'result', type: 'result', direction: 'output', color: 'bg-emerald-400' },
          ],
        },
      };
    case 'searchTool':
      return {
        id,
        type,
        position,
        width: 240,
        height: 190,
        data: {
          label: 'Search Reddit',
          type,
          description: 'Finds trending posts in a subreddit',
          subreddit: 'reactjs',
          topicLimit: 10,
          ports: [{ id: 'tool', name: 'tool', type: 'tool', direction: 'output', color: 'bg-rose-500' }],
        },
      };
    case 'script':
      return {
        id,
        type,
        position,
        width: 260,
        height: 220,
        data: {
          label: 'Script Execution',
          type,
          description: 'Executes Python or Bash script',
          scriptType: 'python',
          scriptLocation: 'scripts/process_data.py',
          ports: [
            { id: 'arg_1', name: 'arg_1', type: 'text', direction: 'input', color: 'bg-purple-400' },
            { id: 'result', name: 'result', type: 'result', direction: 'output', color: 'bg-emerald-400' },
          ],
        },
      };
    case 'argument':
      return {
        id,
        type,
        position,
        width: 230,
        height: 170,
        data: {
          label: 'Script Argument',
          type,
          description: 'Key/Value script argument',
          argumentName: 'env',
          argumentValue: 'production',
          ports: [
            { id: 'arg_out', name: 'arg', type: 'text', direction: 'output', color: 'bg-purple-400' },
          ],
        },
      };
    case 'outputAnalyzer':
      return {
        id,
        type,
        position,
        width: 250,
        height: 190,
        data: {
          label: 'Output Analyzer',
          type,
          description: 'Evaluates output status (OK / KO)',
          analyzerCondition: 'exit_code == 0',
          analyzerStatus: 'idle',
          ports: [
            { id: 'input', name: 'input', type: 'result', direction: 'input', color: 'bg-amber-400' },
            { id: 'ok', name: 'OK', type: 'result', direction: 'output', color: 'bg-emerald-500' },
            { id: 'ko', name: 'KO', type: 'result', direction: 'output', color: 'bg-rose-500' },
          ],
        },
      };
    case 'formattedOutput':
      return {
        id,
        type,
        position,
        width: 260,
        height: 200,
        data: {
          label: 'Formatted Output',
          type,
          description: 'Renders the result as Markdown',
          outputText: 'Waiting for workflow execution...',
          ports: [{ id: 'result', name: 'result', type: 'result', direction: 'input', color: 'bg-emerald-400' }],
        },
      };
    case 'annotation':
      return {
        id,
        type,
        position,
        width: 280,
        height: 240,
        data: {
          label: 'AI Agent Setup',
          type,
          description: 'Movable instruction & annotation box',
          annotationTitle: 'AI agent setup',
          annotationSteps: [
            'Choose a model',
            'Set token budget',
            'Connect prompt & skill',
            'Add agent tools',
            'Run & view result',
          ],
          annotationTip: 'Tip: Runs with mock data by default — add your Anthropic or OpenAI API key to use a real LLM.',
          ports: [
            { id: 'note', name: 'annotation link', type: 'note', direction: 'output', color: 'bg-sky-400' },
          ],
        },
      };
    default:
      return {
        id,
        type: 'textInput',
        position,
        width: 200,
        height: 150,
        data: {
          label: 'Custom Node',
          type: 'textInput',
          ports: [],
        },
      };
  }
}
EOF

# 5. Create ScriptNodeView component
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/nodes/ScriptNodeView.tsx
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
EOF

# 6. Create ArgumentNodeView component
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/nodes/ArgumentNodeView.tsx
import React from 'react';
import { Variable } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function ArgumentNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <BaseNodeContainer node={node} icon={Variable} headerBg="bg-sky-500/10">
      <div className="space-y-2 font-mono text-xs">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Argument Name</label>
          <input
            type="text"
            value={node.data.argumentName || ''}
            onChange={(e) => updateNodeData(node.id, { argumentName: e.target.value })}
            placeholder="e.g. env"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Value</label>
          <input
            type="text"
            value={node.data.argumentValue || ''}
            onChange={(e) => updateNodeData(node.id, { argumentValue: e.target.value })}
            placeholder="e.g. production"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>
      </div>
    </BaseNodeContainer>
  );
}
EOF

# 7. Create OutputAnalyzerNodeView component
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/nodes/OutputAnalyzerNodeView.tsx
import React from 'react';
import { GitFork, CheckCircle2, XCircle } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

export function OutputAnalyzerNodeView({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();

  const condition = node.data.analyzerCondition || 'exit_code == 0';
  const status = node.data.analyzerStatus || 'idle';

  return (
    <BaseNodeContainer node={node} icon={GitFork} headerBg="bg-amber-500/10">
      <div className="flex flex-col justify-between h-full font-mono text-xs space-y-2">
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Condition Rule</label>
          <input
            type="text"
            value={condition}
            onChange={(e) => updateNodeData(node.id, { analyzerCondition: e.target.value })}
            placeholder="e.g. exit_code == 0"
            className="mt-0.5 px-1.5 py-0.5 bg-background border border-border rounded w-full text-[11px] font-mono"
          />
        </div>

        {/* Live Evaluation Status */}
        <div className="flex items-center justify-between bg-muted/30 p-1.5 border border-border rounded text-[10px]">
          <span className="font-semibold text-muted-foreground uppercase">Status:</span>
          {status === 'OK' && (
            <span className="flex items-center gap-1 font-bold text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
              <CheckCircle2 size={11} /> OK
            </span>
          )}
          {status === 'KO' && (
            <span className="flex items-center gap-1 font-bold text-rose-500 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
              <XCircle size={11} /> KO
            </span>
          )}
          {status !== 'OK' && status !== 'KO' && (
            <span className="text-muted-foreground italic">Pending</span>
          )}
        </div>

        {/* Visual Endpoint Indicators for OK / KO */}
        <div className="flex justify-end gap-2 pt-1 border-t border-border/50 text-[10px]">
          <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
            <span>OK</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-center gap-1 bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
            <span>KO</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          </div>
        </div>
      </div>
    </BaseNodeContainer>
  );
}
EOF

# 8. Update Node Palette Component (NodePalettePanel.tsx)
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/palette/NodePalettePanel.tsx
import React, { useState } from 'react';
import { Search, Type, FileText, Bot, LayoutTemplate, Layers, GripVertical, Info, Terminal, Variable, GitFork } from 'lucide-react';
import { PALETTE_ITEMS } from '../../constants/node-registry.constants';
import { PaletteItemDefinition } from '../../model-ui';

const ICON_MAP: Record<string, any> = {
  Type,
  FileText,
  Bot,
  Search,
  LayoutTemplate,
  Info,
  Terminal,
  Variable,
  GitFork,
};

export function NodePalettePanel() {
  const [query, setQuery] = useState('');

  const filteredItems = PALETTE_ITEMS.filter(
    (item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = Array.from(new Set(filteredItems.map((i) => i.category)));

  const handleDragStart = (e: React.DragEvent, item: PaletteItemDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: item.type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 font-mono text-xs border-border border-r select-none">
      <div className="p-2 border-border border-b shrink-0">
        <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 border border-border rounded-md">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent font-mono text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 p-2.5 overflow-y-auto">
        {categories.map((category) => (
          <div key={category} className="space-y-1.5">
            <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              {category}
            </span>

            <div className="space-y-1.5">
              {filteredItems
                .filter((i) => i.category === category)
                .map((item) => {
                  const IconComp = ICON_MAP[item.iconName] || Layers;
                  return (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className="group flex items-center gap-2 bg-background hover:bg-muted/60 p-2 border border-border hover:border-primary/50 rounded-lg transition-all cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical size={13} className="text-muted-foreground/50 group-hover:text-foreground shrink-0" />
                      <div className="p-1.5 bg-primary/10 rounded text-primary shrink-0">
                        <IconComp size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-semibold text-foreground text-xs truncate">{item.label}</span>
                          {item.badge && (
                            <span className="bg-primary/15 px-1 py-0.2 rounded font-bold text-[9px] text-primary uppercase shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# 9. Update Canvas Context Menu (CanvasContextMenu.tsx)
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/canvas/CanvasContextMenu.tsx
import React, { useEffect, useState } from 'react';
import { Type, FileText, Bot, Search, LayoutTemplate, Info, Terminal, Variable, GitFork } from 'lucide-react';
import { createDefaultNode } from '../../shapes/workflow-shapes';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { NodeType } from '../../model-ui';

interface ContextMenuPos {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
}

export function CanvasContextMenu() {
  const [pos, setPos] = useState<ContextMenuPos | null>(null);
  const { addNode, panOffset, zoomLevel } = useWorkflowStore();

  useEffect(() => {
    const container = document.getElementById('workflow-canvas-container');
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const scale = zoomLevel / 100;
      const canvasX = Math.round((e.clientX - rect.left - panOffset.x) / scale);
      const canvasY = Math.round((e.clientY - rect.top - panOffset.y) / scale);

      setPos({
        x: e.clientX,
        y: e.clientY,
        canvasX,
        canvasY,
      });
    };

    const handleClick = () => setPos(null);

    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
    };
  }, [panOffset, zoomLevel]);

  if (!pos) return null;

  const spawnNode = (type: NodeType) => {
    const node = createDefaultNode(type, { x: pos.canvasX - 100, y: pos.canvasY - 50 });
    addNode(node);
    setPos(null);
  };

  const nodeTypes: { type: NodeType; label: string; icon: any }[] = [
    { type: 'textInput', label: 'Text Input', icon: Type },
    { type: 'markdownFile', label: 'Markdown File', icon: FileText },
    { type: 'aiAgent', label: 'AI Agent', icon: Bot },
    { type: 'searchTool', label: 'Search Reddit', icon: Search },
    { type: 'script', label: 'Script Execution', icon: Terminal },
    { type: 'argument', label: 'Script Argument', icon: Variable },
    { type: 'outputAnalyzer', label: 'Output Analyzer', icon: GitFork },
    { type: 'formattedOutput', label: 'Formatted Output', icon: LayoutTemplate },
    { type: 'annotation', label: 'Annotation Note', icon: Info },
  ];

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed bg-card shadow-xl p-1 border border-border rounded-lg w-48 font-mono text-xs z-50 select-none animate-in fade-in duration-150"
    >
      <div className="px-2 py-1 font-bold text-[10px] text-muted-foreground uppercase border-b border-border mb-1">
        Add Node to Canvas
      </div>
      {nodeTypes.map((item) => {
        const IconComp = item.icon;
        return (
          <button
            key={item.type}
            onClick={() => spawnNode(item.type)}
            className="flex items-center gap-2 hover:bg-muted p-1.5 rounded w-full text-foreground text-xs text-left cursor-pointer transition-colors"
          >
            <IconComp size={14} className="text-primary shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
EOF

# 10. Update Cytoscape Canvas Renderer (CytoscapeCanvas.tsx)
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/canvas/CytoscapeCanvas.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { useWorkflowPersistence } from '../../hooks/use-workflow-persistence';
import { createDefaultNode } from '../../shapes/workflow-shapes';
import { copyNodeToClipboard, getClipboardNode, duplicateNode } from '../../utils/clipboard.utils';
import { TextInputNodeView } from '../nodes/TextInputNodeView';
import { MarkdownFileNodeView } from '../nodes/MarkdownFileNodeView';
import { AiAgentNodeView } from '../nodes/AiAgentNodeView';
import { SearchToolNodeView } from '../nodes/SearchToolNodeView';
import { FormattedOutputNodeView } from '../nodes/FormattedOutputNodeView';
import { AnnotationNodeView } from '../nodes/AnnotationNodeView';
import { ScriptNodeView } from '../nodes/ScriptNodeView';
import { ArgumentNodeView } from '../nodes/ArgumentNodeView';
import { OutputAnalyzerNodeView } from '../nodes/OutputAnalyzerNodeView';
import { CanvasControls } from './CanvasControls';
import { Minimap } from './Minimap';
import { PortRubberbandLine } from './PortRubberbandLine';
import { AccessibilityValidator } from './AccessibilityValidator';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { CanvasContextMenu } from './CanvasContextMenu';

export function CytoscapeCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  useWorkflowPersistence();

  const {
    nodes,
    edges,
    addNode,
    updateNodePosition,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    selectedNodeId,
    selectedEdgeId,
    removeNode,
    removeEdge,
    setSelectedEdgeId,
    setSelectedNodeId,
    addLog,
  } = useWorkflowStore();

  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; initialPan: { x: number; y: number } } | null>(null);

  // Native non-passive mouse wheel listener for smooth scrolling and zoom
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input' || activeTag === 'select') return;

      e.preventDefault();
      e.stopPropagation();

      const currentZoom = useWorkflowStore.getState().zoomLevel;
      const currentPan = useWorkflowStore.getState().panOffset;

      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY < 0 ? 5 : -5;
        useWorkflowStore.getState().setZoomLevel(Math.min(150, Math.max(40, currentZoom + delta)));
      } else {
        useWorkflowStore.getState().setPanOffset({
          x: currentPan.x - e.deltaX,
          y: currentPan.y - e.deltaY,
        });
      }
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  // Keyboard shortcut listeners (Delete, Copy, Paste, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      const selectedNode = nodes.find((n) => n.id === selectedNodeId);

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        if (selectedNode) {
          copyNodeToClipboard(selectedNode);
          addLog(`📋 Copied node [${selectedNode.data.label}] to clipboard.`);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        const pasted = getClipboardNode();
        if (pasted) {
          const dup = duplicateNode(pasted);
          addNode(dup);
          addLog(`📋 Pasted node [${dup.data.label}].`);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        if (selectedNode) {
          e.preventDefault();
          const dup = duplicateNode(selectedNode);
          addNode(dup);
          addLog(`👯 Duplicated node [${dup.data.label}].`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, nodes, removeNode, removeEdge, addNode, addLog]);

  // Check if click target is an interactive node control
  const isInteractiveTarget = (target: HTMLElement): boolean => {
    return Boolean(
      target.closest('input, textarea, select, button, [data-port-id], [draggable="true"]')
    );
  };

  // Background drag panning (Left Click or Middle Click)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (isInteractiveTarget(target)) return;

    if (e.button === 0 || e.button === 1) {
      // Clear selection if clicking empty canvas
      if (!target.closest('[data-node-wrapper]')) {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }

      setIsCanvasPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        initialPan: { ...panOffset },
      });
    }
  };

  useEffect(() => {
    if (!isCanvasPanning || !panStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset({
        x: panStart.initialPan.x + dx,
        y: panStart.initialPan.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsCanvasPanning(false);
      setPanStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isCanvasPanning, panStart, setPanOffset]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr || !canvasRef.current) return;

    try {
      const { type } = JSON.parse(dataStr);
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoomLevel / 100;
      const x = Math.round((e.clientX - rect.left - panOffset.x) / scale - 100);
      const y = Math.round((e.clientY - rect.top - panOffset.y) / scale - 50);

      const newNode = createDefaultNode(type, { x, y });
      addNode(newNode);
    } catch (err) {
      // invalid payload
    }
  };

  return (
    <div
      id="workflow-canvas-container"
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex-1 bg-muted/10 w-full h-full min-h-0 overflow-hidden select-none ${
        isCanvasPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
      }}
    >
      <PortRubberbandLine />
      <CanvasContextMenu />

      <div
        className="w-full h-full transition-transform origin-top-left"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
        }}
      >
        {/* Connection Edges SVG Overlay */}
        <svg className="top-0 left-0 absolute pointer-events-none w-full h-full z-0">
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isSelected = selectedEdgeId === edge.id;
            const isAnnotationEdge = sourceNode.type === 'annotation' || targetNode.type === 'annotation';

            const x1 = sourceNode.position.x + (sourceNode.width || 240);
            const y1 = sourceNode.position.y + (sourceNode.height || 200) / 2;
            const x2 = targetNode.position.x;
            const y2 = targetNode.position.y + (targetNode.height || 200) / 2;

            const dx = Math.abs(x2 - x1) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const dashStyle = edge.style === 'dashed' ? '6 4' : edge.style === 'dotted' ? '2 3' : isAnnotationEdge ? '6 4' : undefined;
            const lineColor = isSelected ? '#10b981' : edge.color || (isAnnotationEdge ? '#0284c7' : '#6366f1');
            const badgeBg = edge.labelColor || 'var(--card)';
            const labelTextCol = edge.labelTextColor || 'var(--foreground)';

            return (
              <g
                key={edge.id}
                className="group pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdgeId(edge.id);
                }}
              >
                <path
                  d={pathData}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={isSelected ? '4' : '3'}
                  strokeDasharray={dashStyle}
                  className="transition-colors"
                />
                {edge.label && (
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                    <rect x="-45" y="-10" width="90" height="20" rx="4" fill={badgeBg} stroke={lineColor} strokeWidth="1.5" />
                    <text x="0" y="3" textAnchor="middle" fill={labelTextCol} fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic React Graph Nodes */}
        {nodes.map((node) => {
          return (
            <div
              key={node.id}
              data-node-wrapper="true"
              style={{
                position: 'absolute',
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: `${node.width || 240}px`,
                height: `${node.height || 200}px`,
              }}
              draggable
              onDragEnd={(e) => {
                if (!canvasRef.current) return;
                const rect = canvasRef.current.getBoundingClientRect();
                const scale = zoomLevel / 100;
                updateNodePosition(node.id, {
                  x: Math.round((e.clientX - rect.left - panOffset.x) / scale - 100),
                  y: Math.round((e.clientY - rect.top - panOffset.y) / scale - 20),
                });
              }}
            >
              {node.type === 'textInput' && <TextInputNodeView node={node} />}
              {node.type === 'markdownFile' && <MarkdownFileNodeView node={node} />}
              {node.type === 'aiAgent' && <AiAgentNodeView node={node} />}
              {node.type === 'searchTool' && <SearchToolNodeView node={node} />}
              {node.type === 'script' && <ScriptNodeView node={node} />}
              {node.type === 'argument' && <ArgumentNodeView node={node} />}
              {node.type === 'outputAnalyzer' && <OutputAnalyzerNodeView node={node} />}
              {node.type === 'formattedOutput' && <FormattedOutputNodeView node={node} />}
              {node.type === 'annotation' && <AnnotationNodeView node={node} />}
            </div>
          );
        })}
      </div>

      <AccessibilityValidator />
      <KeyboardShortcutsDialog />
      <Minimap />
      <CanvasControls />
    </div>
  );
}
EOF

# 11. Update Inspector Config Form (NodeConfigForm.tsx)
cat << 'EOF' > webview/src/features/ai-workflow-builder/components/inspector/NodeConfigForm.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Palette, Type, Sliders } from 'lucide-react';
import { WorkflowNode, NodeFontFamily } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

const COLOR_SWATCHES = [
  { label: 'Default', value: '' },
  { label: 'Soft Blue', value: '#e0f2fe' },
  { label: 'Soft Purple', value: '#f3e8ff' },
  { label: 'Soft Teal', value: '#ccfbf1' },
  { label: 'Soft Yellow', value: '#fef9c3' },
  { label: 'Soft Pink', value: '#ffe4e6' },
  { label: 'Soft Gray', value: '#f1f5f9' },
];

const STROKE_TEXT_SWATCHES = [
  { label: 'Default', value: '' },
  { label: 'Primary Dark', value: '#0f172a' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Sky Blue', value: '#0284c7' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#eab308' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Slate', value: '#64748b' },
];

export function NodeConfigForm({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(true);

  return (
    <div className="space-y-3 font-mono text-xs select-none">
      {/* Node Info & Fields */}
      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Title</label>
        <input
          type="text"
          value={node.data.label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
          className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Description</label>
        <input
          type="text"
          value={node.data.description || ''}
          onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
          placeholder="Short description..."
          className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {node.type === 'textInput' && (
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Prompt</label>
          <textarea
            value={node.data.promptText || ''}
            onChange={(e) => updateNodeData(node.id, { promptText: e.target.value })}
            className="mt-1 p-2 bg-background border border-border rounded-lg w-full h-24 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {node.type === 'markdownFile' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Markdown File</label>
            <input
              type="text"
              value={node.data.markdownFile || ''}
              onChange={(e) => updateNodeData(node.id, { markdownFile: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Instruction</label>
            <textarea
              value={node.data.instructionText || ''}
              onChange={(e) => updateNodeData(node.id, { instructionText: e.target.value })}
              className="mt-1 p-2 bg-background border border-border rounded-lg w-full h-20 text-xs resize-none"
            />
          </div>
        </>
      )}

      {node.type === 'aiAgent' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Model</label>
            <select
              value={node.data.model || 'Mock - Offline'}
              onChange={(e) => updateNodeData(node.id, { model: e.target.value })}
              className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs"
            >
              <option value="Mock - Offline">Mock - Offline</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-muted-foreground uppercase">Token Budget</span>
              <span className="font-bold text-primary">{node.data.tokenBudget || 1000}</span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={node.data.tokenBudget || 1000}
              onChange={(e) => updateNodeData(node.id, { tokenBudget: Number(e.target.value) })}
              className="mt-1 w-full accent-primary cursor-pointer"
            />
          </div>
        </>
      )}

      {node.type === 'searchTool' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Subreddit</label>
            <input
              type="text"
              value={node.data.subreddit || ''}
              onChange={(e) => updateNodeData(node.id, { subreddit: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs"
            />
          </div>
          <div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-muted-foreground uppercase">Topic Limit</span>
              <span className="font-bold text-primary">{node.data.topicLimit || 10}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={node.data.topicLimit || 10}
              onChange={(e) => updateNodeData(node.id, { topicLimit: Number(e.target.value) })}
              className="mt-1 w-full accent-primary cursor-pointer"
            />
          </div>
        </>
      )}

      {node.type === 'script' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Script Type</label>
            <select
              value={node.data.scriptType || 'python'}
              onChange={(e) => updateNodeData(node.id, { scriptType: e.target.value as 'python' | 'bash' })}
              className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs cursor-pointer font-mono"
            >
              <option value="python">python</option>
              <option value="bash">bash</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Script Location</label>
            <input
              type="text"
              value={node.data.scriptLocation || ''}
              onChange={(e) => updateNodeData(node.id, { scriptLocation: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
            />
          </div>
        </>
      )}

      {node.type === 'argument' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Argument Name</label>
            <input
              type="text"
              value={node.data.argumentName || ''}
              onChange={(e) => updateNodeData(node.id, { argumentName: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Argument Value</label>
            <input
              type="text"
              value={node.data.argumentValue || ''}
              onChange={(e) => updateNodeData(node.id, { argumentValue: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
            />
          </div>
        </>
      )}

      {node.type === 'outputAnalyzer' && (
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Condition Rule</label>
          <input
            type="text"
            value={node.data.analyzerCondition || ''}
            onChange={(e) => updateNodeData(node.id, { analyzerCondition: e.target.value })}
            placeholder="e.g. exit_code == 0"
            className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
          />
        </div>
      )}

      {/* Collapsible Appearance Block */}
      <div className="pt-2 border-border/80 border-t">
        <button
          type="button"
          onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
          className="flex justify-between items-center w-full font-bold text-[10px] text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Palette size={12} className="text-primary" /> Appearance
          </span>
          {isAppearanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isAppearanceOpen && (
          <div className="space-y-3 mt-2.5 pl-1">
            {/* Fill Color */}
            <div>
              <label className="block font-bold text-[9px] text-muted-foreground uppercase">Fill Color</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={node.data.fillColor || '#ffffff'}
                  onChange={(e) => updateNodeData(node.id, { fillColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {COLOR_SWATCHES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => updateNodeData(node.id, { fillColor: s.value })}
                      style={{ backgroundColor: s.value || 'var(--card)' }}
                      className={`w-4 h-4 rounded-full border shadow-2xs hover:scale-125 transition-transform cursor-pointer ${
                        node.data.fillColor === s.value ? 'ring-2 ring-primary' : 'border-border'
                      }`}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block font-bold text-[9px] text-muted-foreground uppercase">Text Color</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={node.data.textColor || '#000000'}
                  onChange={(e) => updateNodeData(node.id, { textColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {STROKE_TEXT_SWATCHES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => updateNodeData(node.id, { textColor: s.value })}
                      style={{ backgroundColor: s.value || 'var(--foreground)' }}
                      className={`w-4 h-4 rounded-full border shadow-2xs hover:scale-125 transition-transform cursor-pointer ${
                        node.data.textColor === s.value ? 'ring-2 ring-primary' : 'border-border'
                      }`}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Border Color */}
            <div>
              <label className="block font-bold text-[9px] text-muted-foreground uppercase">Border Color</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={node.data.borderColor || '#000000'}
                  onChange={(e) => updateNodeData(node.id, { borderColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {STROKE_TEXT_SWATCHES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => updateNodeData(node.id, { borderColor: s.value })}
                      style={{ backgroundColor: s.value || 'var(--border)' }}
                      className={`w-4 h-4 rounded-full border shadow-2xs hover:scale-125 transition-transform cursor-pointer ${
                        node.data.borderColor === s.value ? 'ring-2 ring-primary' : 'border-border'
                      }`}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Font Selector */}
            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                <Type size={11} /> Font
              </label>
              <select
                value={node.data.fontFamily || 'Sans'}
                onChange={(e) => updateNodeData(node.id, { fontFamily: e.target.value as NodeFontFamily })}
                className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs cursor-pointer"
              >
                <option value="Sans">Sans-Serif</option>
                <option value="Mono">Monospace</option>
                <option value="Serif">Serif</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

# 12. Update Workflow Execution Engine (use-workflow-execution.ts)
cat << 'EOF' > webview/src/features/ai-workflow-builder/hooks/use-workflow-execution.ts
import { useCallback } from 'react';
import { useWorkflowStore } from './use-workflow-store';
import { getTopologicalSortOrder } from '../utils/dag-engine.utils';

export function useWorkflowExecution() {
  const { nodes, edges, updateNodeData, updateEdgeLabel, setIsRunning, addLog } = useWorkflowStore();

  const runWorkflow = useCallback(async () => {
    setIsRunning(true);
    addLog('🚀 Starting AI Workflow Execution Engine...');

    const sortedNodes = getTopologicalSortOrder(nodes, edges);

    // Reset status
    sortedNodes.forEach((node) => {
      updateNodeData(node.id, { status: 'idle' });
    });

    let contextData: Record<string, any> = {};

    for (const node of sortedNodes) {
      addLog(`▶ Running node [${node.data.label}] (${node.id})...`);
      updateNodeData(node.id, { status: 'running' });

      // Find incoming edges to update live labels
      const incomingEdges = edges.filter((e) => e.target === node.id);
      incomingEdges.forEach((e) => {
        updateEdgeLabel(e.id, 'Data Flow Active');
      });

      const startTime = performance.now();
      await new Promise((res) => setTimeout(res, 700));

      if (node.type === 'textInput') {
        contextData['prompt'] = node.data.promptText || '';
      } else if (node.type === 'markdownFile') {
        contextData['instruction'] = node.data.instructionText || '';
      } else if (node.type === 'searchTool') {
        contextData['redditData'] = [
          '• React 19 Server Actions deep dive discussion',
          '• Best state management libraries in 2026',
          '• Vite vs Next.js performance benchmarks',
        ].join('\n');
      } else if (node.type === 'script') {
        const scriptType = node.data.scriptType || 'python';
        const location = node.data.scriptLocation || 'scripts/run.py';
        contextData['scriptOutput'] = `[${scriptType.toUpperCase()}] Executed successfully: ${location}`;
        contextData['lastExitCode'] = 0;
      } else if (node.type === 'argument') {
        const name = node.data.argumentName || 'arg';
        const val = node.data.argumentValue || '';
        contextData[`arg_${node.id}`] = `${name}=${val}`;
      } else if (node.type === 'outputAnalyzer') {
        const exitCode = contextData['lastExitCode'] ?? 0;
        const analyzerStatus = exitCode === 0 ? 'OK' : 'KO';
        updateNodeData(node.id, { analyzerStatus });
        contextData['analyzerResult'] = analyzerStatus;
      } else if (node.type === 'aiAgent') {
        const prompt = contextData['prompt'] || 'Analyze React trends';
        const reddit = contextData['redditData'] || '';
        const scriptRes = contextData['scriptOutput'] || '';
        const tokenEstimate = Math.min(node.data.tokenBudget || 1000, 320);

        contextData['agentOutput'] = `### 🤖 AI Agent Synthesis Report\n\n**Input Prompt:** ${prompt}\n\n**Retrieved Context:**\n${reddit}\n\n**Script Execution:**\n${scriptRes}\n\n**Token Usage:** ${tokenEstimate} tokens\n**Recommendation:** Focus on React Server Components, TypeScript type-safety, and automated architecture validation.`;

        // Update outgoing edge labels with token usage badge
        const outgoingEdges = edges.filter((e) => e.source === node.id);
        outgoingEdges.forEach((e) => {
          updateEdgeLabel(e.id, `Tokens used: ${tokenEstimate}`);
        });
      } else if (node.type === 'formattedOutput') {
        const resultText = contextData['agentOutput'] || contextData['scriptOutput'] || 'Flow completed with no output.';
        updateNodeData(node.id, { outputText: resultText });
      }

      const executionTimeMs = Math.round(performance.now() - startTime);
      updateNodeData(node.id, { status: 'success', executionTimeMs });
      addLog(`✅ Completed [${node.data.label}] in ${executionTimeMs}ms.`);
    }

    setIsRunning(false);
    addLog('✨ Workflow execution finished successfully!');
  }, [nodes, edges, updateNodeData, updateEdgeLabel, setIsRunning, addLog]);

  return { runWorkflow };
}
EOF

echo "✅ feat: Successfully added ScriptNodeView, ArgumentNodeView, and OutputAnalyzerNodeView to palette, canvas, and inspector!"

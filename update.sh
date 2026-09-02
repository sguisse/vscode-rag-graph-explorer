#!/usr/bin/env bash
set -e

echo "🚀 Updating AI Workflow Builder for dynamic automatic note target ports..."

# 1. Ensure target directories exist
mkdir -p webview/src/features/ai-workflow-builder/constants
mkdir -p webview/src/features/ai-workflow-builder/hooks

# 2. Update Workflow Constants (workflow.constants.ts)
cat << 'EOF' > webview/src/features/ai-workflow-builder/constants/workflow.constants.ts
import { WorkflowSchema } from '../model-ui';

export const DEFAULT_WORKFLOW_SCHEMA: WorkflowSchema = {
  nodes: [
    {
      id: 'node-annotation-1',
      type: 'annotation',
      position: { x: 380, y: -20 },
      data: {
        label: 'AI Agent Setup',
        type: 'annotation',
        description: 'Annotation setup notes with dashed connection link',
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
      width: 280,
      height: 240,
    },
    {
      id: 'node-markdown-1',
      type: 'markdownFile',
      position: { x: 80, y: 60 },
      data: {
        label: 'Markdown File',
        type: 'markdownFile',
        description: 'A Markdown instruction file for the flow',
        markdownFile: 'agent-skill.md',
        instructionText: 'You are a senior React analyst. Summarise the findings as a clean Markdown table.',
        ports: [
          { id: 'skill', name: 'skill', type: 'skill', direction: 'output', color: 'bg-amber-500' },
        ],
      },
      width: 240,
      height: 220,
    },
    {
      id: 'node-text-1',
      type: 'textInput',
      position: { x: 80, y: 310 },
      data: {
        label: 'Text Input',
        type: 'textInput',
        description: 'The starting prompt for the flow',
        promptText: 'Give me the most trending topics in the React community on Reddit.',
        ports: [
          { id: 'text', name: 'text', type: 'text', direction: 'output', color: 'bg-rose-400' },
        ],
      },
      width: 240,
      height: 180,
    },
    {
      id: 'node-agent-1',
      type: 'aiAgent',
      position: { x: 420, y: 260 },
      data: {
        label: 'AI Agent',
        type: 'aiAgent',
        description: 'Runs an LLM with tool calling',
        model: 'Mock - Offline',
        tokenBudget: 1000,
        ports: [
          { id: 'note-01', name: 'note 01', type: 'note', direction: 'input', color: 'bg-sky-400' },
          { id: 'prompt', name: 'prompt', type: 'prompt', direction: 'input', color: 'bg-amber-400' },
          { id: 'skill', name: 'skill', type: 'skill', direction: 'input', color: 'bg-amber-500' },
          { id: 'agent_tools', name: 'agent tools', type: 'tool', direction: 'input', color: 'bg-rose-400' },
          { id: 'result', name: 'result', type: 'result', direction: 'output', color: 'bg-emerald-400' },
        ],
      },
      width: 260,
      height: 240,
    },
    {
      id: 'node-search-1',
      type: 'searchTool',
      position: { x: 400, y: 540 },
      data: {
        label: 'Search Reddit',
        type: 'searchTool',
        description: 'Finds trending posts in a subreddit',
        subreddit: 'reactjs',
        topicLimit: 10,
        ports: [
          { id: 'tool', name: 'tool', type: 'tool', direction: 'output', color: 'bg-rose-500' },
        ],
      },
      width: 240,
      height: 190,
    },
    {
      id: 'node-output-1',
      type: 'formattedOutput',
      position: { x: 780, y: 200 },
      data: {
        label: 'Formatted Output',
        type: 'formattedOutput',
        description: 'Renders the result as Markdown',
        outputText: 'Run the flow to see the output...',
        ports: [
          { id: 'result', name: 'result', type: 'result', direction: 'input', color: 'bg-emerald-400' },
        ],
      },
      width: 260,
      height: 200,
    },
  ],
  edges: [
    {
      id: 'edge-annotation-link',
      source: 'node-annotation-1',
      sourcePort: 'note',
      target: 'node-agent-1',
      targetPort: 'note-01',
      label: 'Setup Guide',
    },
    {
      id: 'edge-1',
      source: 'node-markdown-1',
      sourcePort: 'skill',
      target: 'node-agent-1',
      targetPort: 'skill',
    },
    {
      id: 'edge-2',
      source: 'node-text-1',
      sourcePort: 'text',
      target: 'node-agent-1',
      targetPort: 'prompt',
    },
    {
      id: 'edge-3',
      source: 'node-search-1',
      sourcePort: 'tool',
      target: 'node-agent-1',
      targetPort: 'agent_tools',
    },
    {
      id: 'edge-4',
      source: 'node-agent-1',
      sourcePort: 'result',
      target: 'node-output-1',
      targetPort: 'result',
      label: 'Tokens used: 3',
    },
  ],
};
EOF

# 3. Update Workflow Store Engine (use-workflow-store.ts)
cat << 'EOF' > webview/src/features/ai-workflow-builder/hooks/use-workflow-store.ts
import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, WorkflowSchema, WorkflowPort } from '../model-ui';
import { DEFAULT_WORKFLOW_SCHEMA } from '../constants/workflow.constants';

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isRunning: boolean;
  apiKey: string;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  logs: string[];
  connectingPort: { nodeId: string; portId: string; direction: 'input' | 'output' } | null;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeData: (id: string, partialData: Record<string, any>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  updateEdge: (id: string, partialEdge: Partial<WorkflowEdge>) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  removeEdge: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setIsRunning: (running: boolean) => void;
  setApiKey: (key: string) => void;
  setZoomLevel: (zoom: number) => void;
  setPanOffset: (pan: { x: number; y: number }) => void;
  centerOnNode: (nodeId: string, containerWidth?: number, containerHeight?: number) => void;
  setConnectingPort: (port: { nodeId: string; portId: string; direction: 'input' | 'output' } | null) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  resetWorkflow: () => void;
  loadWorkflow: (schema: WorkflowSchema) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: DEFAULT_WORKFLOW_SCHEMA.nodes,
  edges: DEFAULT_WORKFLOW_SCHEMA.edges,
  selectedNodeId: null,
  selectedEdgeId: null,
  isRunning: false,
  apiKey: '',
  zoomLevel: 100,
  panOffset: { x: 0, y: 0 },
  logs: ['Workflow initialised with AI Agent setup schema.'],
  connectingPort: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: node.id, selectedEdgeId: null })),
  updateNodeData: (id, partialData) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...partialData } } : n)),
    })),
  updateNodePosition: (id, position) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    })),

  removeNode: (id) =>
    set((s) => {
      const edgesToRemove = s.edges.filter((e) => e.source === id || e.target === id);
      let updatedNodes = s.nodes.filter((n) => n.id !== id);

      // Clean up dynamic note ports created on target nodes when connected note source node is removed
      edgesToRemove.forEach((edge) => {
        if (edge.source === id) {
          const targetNode = updatedNodes.find((n) => n.id === edge.target);
          if (targetNode) {
            const targetPort = targetNode.data.ports.find((p) => p.id === edge.targetPort);
            if (targetPort && (targetPort.type === 'note' || targetPort.name.toLowerCase().startsWith('note'))) {
              updatedNodes = updatedNodes.map((n) => {
                if (n.id === targetNode.id) {
                  const remainingPorts = n.data.ports.filter((p) => p.id !== edge.targetPort);
                  let noteCounter = 1;
                  const reindexedPorts = remainingPorts.map((p) => {
                    if (p.direction === 'input' && (p.type === 'note' || p.name.toLowerCase().startsWith('note'))) {
                      const idxStr = noteCounter < 10 ? `0${noteCounter}` : `${noteCounter}`;
                      noteCounter++;
                      return { ...p, name: `note ${idxStr}` };
                    }
                    return p;
                  });
                  return {
                    ...n,
                    data: { ...n.data, ports: reindexedPorts },
                  };
                }
                return n;
              });
            }
          }
        }
      });

      return {
        nodes: updatedNodes,
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      };
    }),

  addEdge: (edge) =>
    set((s) => {
      const sourceNode = s.nodes.find((n) => n.id === edge.source);
      const targetNode = s.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return s;

      let updatedNodes = s.nodes;
      let finalEdge = { ...edge };

      // Determine if edge originates from an annotation node or note output port
      const sourcePortObj = sourceNode.data.ports.find((p) => p.id === edge.sourcePort);
      const isNoteRelationship =
        sourceNode.type === 'annotation' ||
        edge.sourcePort === 'note' ||
        sourcePortObj?.type === 'note' ||
        sourcePortObj?.name.toLowerCase().includes('note');

      if (isNoteRelationship) {
        // Count existing note input ports on target node
        const existingNotePorts = targetNode.data.ports.filter(
          (p) => p.direction === 'input' && (p.type === 'note' || p.name.toLowerCase().startsWith('note'))
        );
        const nextIndex = existingNotePorts.length + 1;
        const formattedIndex = nextIndex < 10 ? `0${nextIndex}` : `${nextIndex}`;
        const newPortId = `note-port-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newPortName = `note ${formattedIndex}`;

        const newPort: WorkflowPort = {
          id: newPortId,
          name: newPortName,
          type: 'note',
          direction: 'input',
          color: 'bg-sky-400',
        };

        finalEdge.targetPort = newPortId;

        updatedNodes = s.nodes.map((n) => {
          if (n.id === targetNode.id) {
            return {
              ...n,
              data: {
                ...n.data,
                ports: [...n.data.ports, newPort],
              },
            };
          }
          return n;
        });
      }

      const exists = s.edges.some(
        (e) => e.source === finalEdge.source && e.target === finalEdge.target && e.targetPort === finalEdge.targetPort
      );
      if (exists) return s;

      return {
        nodes: updatedNodes,
        edges: [...s.edges, finalEdge],
      };
    }),

  updateEdge: (id, partialEdge) =>
    set((s) => ({
      edges: s.edges.map((e) => (e.id === id ? { ...e, ...partialEdge } : e)),
    })),

  updateEdgeLabel: (id, label) =>
    set((s) => ({
      edges: s.edges.map((e) => (e.id === id ? { ...e, label } : e)),
    })),

  removeEdge: (id) =>
    set((s) => {
      const edgeToRemove = s.edges.find((e) => e.id === id);
      if (!edgeToRemove) return s;

      const targetNode = s.nodes.find((n) => n.id === edgeToRemove.target);
      let updatedNodes = s.nodes;

      if (targetNode) {
        const targetPort = targetNode.data.ports.find((p) => p.id === edgeToRemove.targetPort);
        if (targetPort && (targetPort.type === 'note' || targetPort.name.toLowerCase().startsWith('note'))) {
          updatedNodes = s.nodes.map((n) => {
            if (n.id === targetNode.id) {
              const remainingPorts = n.data.ports.filter((p) => p.id !== edgeToRemove.targetPort);
              let noteCounter = 1;
              const reindexedPorts = remainingPorts.map((p) => {
                if (p.direction === 'input' && (p.type === 'note' || p.name.toLowerCase().startsWith('note'))) {
                  const idxStr = noteCounter < 10 ? `0${noteCounter}` : `${noteCounter}`;
                  noteCounter++;
                  return { ...p, name: `note ${idxStr}` };
                }
                return p;
              });
              return {
                ...n,
                data: { ...n.data, ports: reindexedPorts },
              };
            }
            return n;
          });
        }
      }

      return {
        nodes: updatedNodes,
        edges: s.edges.filter((e) => e.id !== id),
        selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
      };
    }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: id ? null : null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: id ? null : null }),
  setIsRunning: (running) => set({ isRunning: running }),
  setApiKey: (key) => set({ apiKey: key }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setPanOffset: (pan) => set({ panOffset: pan }),

  centerOnNode: (nodeId, containerWidth = 800, containerHeight = 600) => {
    const state = get();
    const targetNode = state.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const scale = state.zoomLevel / 100;
    const nodeCenterX = targetNode.position.x + (targetNode.width || 240) / 2;
    const nodeCenterY = targetNode.position.y + (targetNode.height || 200) / 2;

    const targetPanX = containerWidth / 2 - nodeCenterX * scale;
    const targetPanY = containerHeight / 2 - nodeCenterY * scale;

    set({
      selectedNodeId: nodeId,
      selectedEdgeId: null,
      panOffset: { x: targetPanX, y: targetPanY },
    });
  },

  setConnectingPort: (port) => set({ connectingPort: port }),
  addLog: (log) => set((s) => ({ logs: [...s.logs, `[${new Date().toLocaleTimeString()}] ${log}`] })),
  clearLogs: () => set({ logs: [] }),

  resetWorkflow: () =>
    set({
      nodes: DEFAULT_WORKFLOW_SCHEMA.nodes,
      edges: DEFAULT_WORKFLOW_SCHEMA.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      panOffset: { x: 0, y: 0 },
      logs: ['Workflow reset to default preset.'],
    }),

  loadWorkflow: (schema) =>
    set({
      nodes: schema.nodes,
      edges: schema.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      panOffset: { x: 0, y: 0 },
      logs: ['Workflow loaded successfully from template schema.'],
    }),
}));
EOF

echo "✅ feat: Note relationships now automatically add target ports named 'note 01', 'note 02' and clean them up upon deletion!"

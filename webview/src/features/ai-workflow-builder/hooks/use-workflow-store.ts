import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, WorkflowSchema } from '../model-ui';
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
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),
  addEdge: (edge) =>
    set((s) => {
      const exists = s.edges.some(
        (e) => e.source === edge.source && e.target === edge.target && e.targetPort === edge.targetPort
      );
      if (exists) return s;
      return { edges: [...s.edges, edge] };
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
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== id),
      selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
    })),
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

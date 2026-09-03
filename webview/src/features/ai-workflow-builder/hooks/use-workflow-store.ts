import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge, WorkflowSchema, WorkflowPort, PortSide } from '../model-ui';
import { DEFAULT_WORKFLOW_SCHEMA } from '../constants/workflow.constants';

interface CandidateNotePort {
  targetNodeId: string;
  side: PortSide;
  portName: string;
}

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isRunning: boolean;
  apiKey: string;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  showGrid: boolean;
  logs: string[];
  connectingPort: { nodeId: string; portId: string; direction: 'input' | 'output' } | null;
  candidateNotePort: CandidateNotePort | null;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeData: (id: string, partialData: Record<string, any>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeSizeAndPosition: (id: string, size: { width: number; height: number }, position?: { x: number; y: number }) => void;
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
  toggleGrid: () => void;
  collapseAllNodes: () => void;
  expandAllNodes: () => void;
  centerOnNode: (nodeId: string, containerWidth?: number, containerHeight?: number) => void;
  setConnectingPort: (port: { nodeId: string; portId: string; direction: 'input' | 'output' } | null) => void;
  setCandidateNotePort: (candidate: CandidateNotePort | null) => void;
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
  showGrid: true,
  logs: ['Workflow initialised with AI Agent setup schema.'],
  connectingPort: null,
  candidateNotePort: null,

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
  updateNodeSizeAndPosition: (id, size, position) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              width: Math.max(160, size.width),
              height: Math.max(100, size.height),
              position: position ? position : n.position,
            }
          : n
      ),
    })),

  collapseAllNodes: () =>
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, isCollapsed: true } })),
    })),

  expandAllNodes: () =>
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, isCollapsed: false } })),
    })),

  removeNode: (id) =>
    set((s) => {
      const edgesToRemove = s.edges.filter((e) => e.source === id || e.target === id);
      let updatedNodes = s.nodes.filter((n) => n.id !== id);

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

      const sourcePortObj = sourceNode.data.ports.find((p) => p.id === edge.sourcePort);
      const isNoteRelationship =
        sourceNode.type === 'annotation' ||
        edge.sourcePort === 'note' ||
        sourcePortObj?.type === 'note' ||
        sourcePortObj?.name.toLowerCase().includes('note');

      if (isNoteRelationship) {
        let side: PortSide = s.candidateNotePort?.targetNodeId === targetNode.id ? s.candidateNotePort.side : 'left';
        let portName = s.candidateNotePort?.targetNodeId === targetNode.id ? s.candidateNotePort.portName : '';

        if (!portName) {
          const existingNotePorts = targetNode.data.ports.filter(
            (p) => p.direction === 'input' && (p.type === 'note' || p.name.toLowerCase().startsWith('note'))
          );
          const nextIdx = existingNotePorts.length + 1;
          portName = `note ${nextIdx < 10 ? '0' + nextIdx : nextIdx}`;
        }

        const newPortId = `note-port-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newPort: WorkflowPort = {
          id: newPortId,
          name: portName,
          type: 'note',
          direction: 'input',
          side,
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

      return {
        nodes: updatedNodes,
        edges: exists ? s.edges : [...s.edges, finalEdge],
        candidateNotePort: null,
        connectingPort: null,
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
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

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

  setConnectingPort: (port) => set({ connectingPort: port, candidateNotePort: port === null ? null : get().candidateNotePort }),
  setCandidateNotePort: (candidate) => set({ candidateNotePort: candidate }),
  addLog: (log) => set((s) => ({ logs: [...s.logs, `[${new Date().toLocaleTimeString()}] ${log}`] })),
  clearLogs: () => set({ logs: [] }),

  resetWorkflow: () =>
    set({
      nodes: DEFAULT_WORKFLOW_SCHEMA.nodes,
      edges: DEFAULT_WORKFLOW_SCHEMA.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      candidateNotePort: null,
      panOffset: { x: 0, y: 0 },
      logs: ['Workflow reset to default preset.'],
    }),

  loadWorkflow: (schema) =>
    set({
      nodes: schema.nodes,
      edges: schema.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      candidateNotePort: null,
      panOffset: { x: 0, y: 0 },
      logs: ['Workflow loaded successfully from template schema.'],
    }),
}));

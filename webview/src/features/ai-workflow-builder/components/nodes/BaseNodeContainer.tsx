import React from 'react';
import { MoreVertical, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import { WorkflowNode, WorkflowPort } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

interface BaseNodeContainerProps {
  node: WorkflowNode;
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  headerBg?: string;
}

export function BaseNodeContainer({ node, children, icon: IconComp, headerBg = 'bg-primary/10' }: BaseNodeContainerProps) {
  const { selectedNodeId, setSelectedNodeId, removeNode, connectingPort, setConnectingPort, addEdge } = useWorkflowStore();
  const isSelected = selectedNodeId === node.id;
  const status = node.data.status || 'idle';

  const inputPorts = node.data.ports.filter((p) => p.direction === 'input');
  const outputPorts = node.data.ports.filter((p) => p.direction === 'output');

  // Custom Appearance styles from node payload
  const customFill = node.data.fillColor || undefined;
  const customText = node.data.textColor || undefined;
  const customBorder = node.data.borderColor || undefined;
  const fontStyle =
    node.data.fontFamily === 'Mono'
      ? 'font-mono'
      : node.data.fontFamily === 'Serif'
      ? 'font-serif'
      : 'font-sans';

  const handlePortClick = (port: WorkflowPort) => {
    if (!connectingPort) {
      setConnectingPort({ nodeId: node.id, portId: port.id, direction: port.direction });
    } else {
      if (connectingPort.nodeId !== node.id && connectingPort.direction !== port.direction) {
        const source = connectingPort.direction === 'output' ? connectingPort.nodeId : node.id;
        const sourcePort = connectingPort.direction === 'output' ? connectingPort.portId : port.id;
        const target = connectingPort.direction === 'input' ? connectingPort.nodeId : node.id;
        const targetPort = connectingPort.direction === 'input' ? connectingPort.portId : port.id;

        addEdge({
          id: `edge-${Date.now()}`,
          source,
          sourcePort,
          target,
          targetPort,
          style: 'solid',
        });
      }
      setConnectingPort(null);
    }
  };

  return (
    <div
      onClick={() => setSelectedNodeId(node.id)}
      style={{
        backgroundColor: customFill,
        color: customText,
        borderColor: customBorder,
      }}
      className={`relative flex flex-col shadow-sm border rounded-2xl w-full h-full transition-all select-none overflow-hidden ${fontStyle} ${
        !customFill ? 'bg-card' : ''
      } ${!customBorder ? 'border-border' : ''} ${
        isSelected ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:border-primary/50'
      }`}
    >
      {/* Node Header */}
      <div
        className={`flex justify-between items-center px-3 py-2 border-border/60 border-b shrink-0 ${headerBg}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <IconComp size={14} className="text-primary shrink-0" />
          <span className="font-bold text-xs truncate">{node.data.label}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {status === 'running' && <Loader2 size={13} className="text-amber-500 animate-spin" />}
          {status === 'success' && <CheckCircle2 size={13} className="text-emerald-500" />}
          {status === 'error' && <AlertCircle size={13} className="text-red-500" />}

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNode(node.id);
            }}
            className="hover:bg-muted/80 p-0.5 rounded text-muted-foreground hover:text-destructive cursor-pointer"
            title="Delete Node"
          >
            <MoreVertical size={13} />
          </button>
        </div>
      </div>

      {/* Node Body Content */}
      <div className="flex-1 p-3 overflow-hidden text-xs">{children}</div>

      {/* Entry Ports (Left Edge Input Points) */}
      <div className="top-1/2 left-0 absolute -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center gap-3 z-20">
        {inputPorts.map((port) => (
          <div
            key={port.id}
            onClick={(e) => {
              e.stopPropagation();
              handlePortClick(port);
            }}
            className="group relative flex items-center cursor-pointer"
            title={`Entry Point: ${port.name}`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 border-background shadow-md hover:scale-125 transition-transform ${
                port.color || 'bg-amber-400'
              }`}
            />
            <span className="left-5 absolute bg-card shadow-xs px-1.5 py-0.5 border border-border rounded font-mono text-[9px] text-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
              {port.name}
            </span>
          </div>
        ))}
      </div>

      {/* Output Ports & Plus Handle Connectors (Right Edge Output Points) */}
      <div className="top-1/2 right-0 absolute flex flex-col justify-center gap-3 translate-x-1/2 -translate-y-1/2 z-20">
        {outputPorts.map((port) => (
          <div
            key={port.id}
            onClick={(e) => {
              e.stopPropagation();
              handlePortClick(port);
            }}
            className="group relative flex items-center justify-end cursor-pointer"
            title={`Output Point: ${port.name}`}
          >
            <div
              className={`flex items-center justify-center w-4 h-4 rounded-full border-2 border-background shadow-md hover:scale-125 transition-transform text-white ${
                port.color || 'bg-emerald-500'
              }`}
            >
              <Plus size={10} strokeWidth={3} />
            </div>
            <span className="right-5 absolute bg-card shadow-xs px-1.5 py-0.5 border border-border rounded font-mono text-[9px] text-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
              {port.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

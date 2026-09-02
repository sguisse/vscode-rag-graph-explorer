import React from 'react';
import { MoreVertical, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import { WorkflowNode, WorkflowPort } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { getDynamicPortSide } from '../../utils/port-layout.utils';

interface BaseNodeContainerProps {
  node: WorkflowNode;
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  headerBg?: string;
}

export function BaseNodeContainer({ node, children, icon: IconComp, headerBg = 'bg-primary/10' }: BaseNodeContainerProps) {
  const { selectedNodeId, setSelectedNodeId, removeNode, connectingPort, setConnectingPort, addEdge, edges, nodes } = useWorkflowStore();
  const isSelected = selectedNodeId === node.id;
  const status = node.data.status || 'idle';

  // Group ports dynamically on borders based on relative relationship direction
  const topPorts = node.data.ports.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'top');
  const bottomPorts = node.data.ports.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'bottom');
  const leftPorts = node.data.ports.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'left');
  const rightPorts = node.data.ports.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'right');

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
      className={`relative flex flex-col shadow-xs border rounded-md w-full h-full transition-all select-none overflow-hidden ${fontStyle} ${
        !customFill ? 'bg-card' : ''
      } ${!customBorder ? 'border-border' : ''} ${
        isSelected ? 'ring-2 ring-primary border-primary shadow-sm' : 'hover:border-primary/50'
      }`}
    >
      {/* Node Header */}
      <div className={`flex justify-between items-center px-3 py-1.5 border-border/60 border-b shrink-0 ${headerBg}`}>
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
      <div className="flex-1 p-2.5 overflow-hidden text-xs">{children}</div>

      {/* TOP Border Ports */}
      {topPorts.length > 0 && (
        <div className="top-0 left-0 right-0 absolute flex justify-around items-center -translate-y-1/2 z-20 pointer-events-none">
          {topPorts.map((port) => (
            <div
              key={port.id}
              onClick={(e) => {
                e.stopPropagation();
                handlePortClick(port);
              }}
              className="group relative flex items-center justify-center cursor-pointer pointer-events-auto"
              title={`Port: ${port.name}`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 border-background shadow-md hover:scale-125 transition-transform ${
                  port.color || (port.direction === 'input' ? 'bg-amber-400' : 'bg-emerald-500')
                }`}
              />
              <span className="bottom-5 absolute bg-card shadow-xs px-1.5 py-0.5 border border-border rounded font-mono text-[9px] text-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                {port.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* BOTTOM Border Ports */}
      {bottomPorts.length > 0 && (
        <div className="bottom-0 left-0 right-0 absolute flex justify-around items-center translate-y-1/2 z-20 pointer-events-none">
          {bottomPorts.map((port) => (
            <div
              key={port.id}
              onClick={(e) => {
                e.stopPropagation();
                handlePortClick(port);
              }}
              className="group relative flex items-center justify-center cursor-pointer pointer-events-auto"
              title={`Port: ${port.name}`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 border-background shadow-md hover:scale-125 transition-transform ${
                  port.color || (port.direction === 'input' ? 'bg-amber-400' : 'bg-emerald-500')
                }`}
              />
              <span className="top-5 absolute bg-card shadow-xs px-1.5 py-0.5 border border-border rounded font-mono text-[9px] text-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                {port.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* LEFT Border Ports */}
      {leftPorts.length > 0 && (
        <div className="top-0 bottom-0 left-0 absolute flex flex-col justify-around items-center -translate-x-1/2 z-20 pointer-events-none">
          {leftPorts.map((port) => (
            <div
              key={port.id}
              onClick={(e) => {
                e.stopPropagation();
                handlePortClick(port);
              }}
              className="group relative flex items-center justify-center cursor-pointer pointer-events-auto"
              title={`Port: ${port.name}`}
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
      )}

      {/* RIGHT Border Ports */}
      {rightPorts.length > 0 && (
        <div className="top-0 bottom-0 right-0 absolute flex flex-col justify-around items-center translate-x-1/2 z-20 pointer-events-none">
          {rightPorts.map((port) => (
            <div
              key={port.id}
              onClick={(e) => {
                e.stopPropagation();
                handlePortClick(port);
              }}
              className="group relative flex items-center justify-center cursor-pointer pointer-events-auto"
              title={`Port: ${port.name}`}
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
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Plus, Minimize2, Maximize2 } from 'lucide-react';
import { WorkflowNode, WorkflowPort, PortSide } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { getDynamicPortSide } from '../../utils/port-layout.utils';

const DISTINCT_PORT_COLORS = [
  'bg-amber-400',
  'bg-emerald-400',
  'bg-rose-400',
  'bg-sky-400',
  'bg-purple-400',
  'bg-indigo-400',
  'bg-teal-400',
  'bg-orange-400',
  'bg-fuchsia-400',
  'bg-cyan-400',
  'bg-lime-400',
  'bg-pink-400',
];

interface BaseNodeContainerProps {
  node: WorkflowNode;
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  headerBg?: string;
}

export function BaseNodeContainer({ node, children, icon: IconComp, headerBg = 'bg-primary/10' }: BaseNodeContainerProps) {
  const {
    selectedNodeId,
    setSelectedNodeId,
    removeNode,
    updateNodeData,
    connectingPort,
    setConnectingPort,
    candidateNotePort,
    setCandidateNotePort,
    addEdge,
    updateNodeSizeAndPosition,
    zoomLevel,
    edges,
    nodes,
  } = useWorkflowStore();

  const isSelected = selectedNodeId === node.id;
  const isCollapsed = Boolean(node.data.isCollapsed);
  const status = node.data.status || 'idle';

  // Ensure each port on the node gets a distinct color
  const usedColors = new Set<string>();
  const portsWithDistinctColors: WorkflowPort[] = node.data.ports.map((port, idx) => {
    let color = port.color;
    if (!color || usedColors.has(color)) {
      const fallback = DISTINCT_PORT_COLORS.find((c) => !usedColors.has(c)) || DISTINCT_PORT_COLORS[idx % DISTINCT_PORT_COLORS.length];
      color = fallback;
    }
    usedColors.add(color);
    return { ...port, color };
  });

  // State for Cmd key detection & Hover detection
  const [isCmdPressed, setIsCmdPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.key === 'Meta' || e.key === 'Control') {
        setIsCmdPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        setIsCmdPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Hover detection logic for note linking
  const handleMouseEnterOrMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);

    if (!connectingPort || connectingPort.nodeId === node.id) return;

    const sourceNode = nodes.find((n) => n.id === connectingPort.nodeId);
    const sourcePort = sourceNode?.data.ports.find((p) => p.id === connectingPort.portId);
    const isNoteSource =
      sourceNode?.type === 'annotation' ||
      connectingPort.portId === 'note' ||
      sourcePort?.type === 'note' ||
      sourcePort?.name.toLowerCase().includes('note');

    if (!isNoteSource) return;

    if (candidateNotePort && candidateNotePort.targetNodeId === node.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const distLeft = relX;
    const distRight = rect.width - relX;
    const distTop = relY;
    const distBottom = rect.height - relY;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    let side: PortSide = 'left';
    if (minDist === distTop) side = 'top';
    else if (minDist === distBottom) side = 'bottom';
    else if (minDist === distRight) side = 'right';

    const existingNotePorts = node.data.ports.filter(
      (p) => p.direction === 'input' && (p.type === 'note' || p.name.toLowerCase().startsWith('note'))
    );
    const nextIdx = existingNotePorts.length + 1;
    const portName = `note ${nextIdx < 10 ? '0' + nextIdx : nextIdx}`;

    setCandidateNotePort({
      targetNodeId: node.id,
      side,
      portName,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (candidateNotePort && candidateNotePort.targetNodeId === node.id) {
      setCandidateNotePort(null);
    }
  };

  // Node Resize Dragging Logic for 8 directions
  const handleResizeStart = (direction: string, e: React.MouseEvent) => {
    if (isCollapsed) return; // Prevent resizing when collapsed
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = node.width || 240;
    const startHeight = node.height || 200;
    const startPosX = node.position.x;
    const startPosY = node.position.y;
    const scale = zoomLevel / 100;

    const handleMouseMove = (moveEv: MouseEvent) => {
      const dx = (moveEv.clientX - startX) / scale;
      const dy = (moveEv.clientY - startY) / scale;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newPosX = startPosX;
      let newPosY = startPosY;

      if (direction.includes('e')) newWidth = Math.max(160, startWidth + dx);
      if (direction.includes('s')) newHeight = Math.max(100, startHeight + dy);
      if (direction.includes('w')) {
        const possibleWidth = startWidth - dx;
        if (possibleWidth >= 160) {
          newWidth = possibleWidth;
          newPosX = startPosX + dx;
        }
      }
      if (direction.includes('n')) {
        const possibleHeight = startHeight - dy;
        if (possibleHeight >= 100) {
          newHeight = possibleHeight;
          newPosY = startPosY + dy;
        }
      }

      updateNodeSizeAndPosition(node.id, { width: newWidth, height: newHeight }, { x: newPosX, y: newPosY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Border ports allocation
  const topPorts = portsWithDistinctColors.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'top');
  const bottomPorts = portsWithDistinctColors.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'bottom');
  const leftPorts = portsWithDistinctColors.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'left');
  const rightPorts = portsWithDistinctColors.filter((p) => getDynamicPortSide(node, p, edges, nodes) === 'right');

  const inputLegendPorts = portsWithDistinctColors.filter((p) => p.direction === 'input');
  const outputLegendPorts = portsWithDistinctColors.filter((p) => p.direction === 'output');

  const isCandidate = candidateNotePort?.targetNodeId === node.id;
  const candidateSide = candidateNotePort?.side;

  const showGrips = isHovered && isCmdPressed && !isCollapsed;

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

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingPort && connectingPort.nodeId !== node.id) {
      const sourceNode = nodes.find((n) => n.id === connectingPort.nodeId);
      const sourcePort = sourceNode?.data.ports.find((p) => p.id === connectingPort.portId);
      const isNoteSource =
        sourceNode?.type === 'annotation' ||
        connectingPort.portId === 'note' ||
        sourcePort?.type === 'note' ||
        sourcePort?.name.toLowerCase().includes('note');

      if (isNoteSource) {
        addEdge({
          id: `edge-${Date.now()}`,
          source: connectingPort.nodeId,
          sourcePort: connectingPort.portId,
          target: node.id,
          targetPort: '',
          style: 'dashed',
        });
        return;
      }
    }
    setSelectedNodeId(node.id);
  };

  return (
    <div
      onClick={handleContainerClick}
      onMouseEnter={handleMouseEnterOrMove}
      onMouseMove={handleMouseEnterOrMove}
      onMouseLeave={handleMouseLeave}
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

          {/* Collapse/Expand Icon Button before Cross Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateNodeData(node.id, { isCollapsed: !isCollapsed });
            }}
            className="hover:bg-muted/80 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
            title={isCollapsed ? 'Expand Node' : 'Collapse Node (150x150)'}
          >
            {isCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>

          {/* Delete Node Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNode(node.id);
            }}
            className="hover:bg-muted/80 p-0.5 rounded text-muted-foreground hover:text-destructive cursor-pointer"
            title="Delete Node"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Node Body Content */}
      {isCollapsed ? (
        <div className="flex-1 p-2 overflow-hidden text-[10px] text-muted-foreground break-words whitespace-normal leading-tight h-full select-text">
          {node.data.description || node.data.promptText || node.data.label || 'No description available.'}
        </div>
      ) : (
        <div className="flex-1 p-2.5 overflow-hidden text-xs">{children}</div>
      )}

      {/* Port Legend Bar at Bottom */}
      {!isCollapsed && portsWithDistinctColors.length > 0 && (
        <div className="flex items-center justify-between gap-1 px-2 py-1 border-t border-border/50 bg-muted/20 text-[9px] font-mono shrink-0 select-none overflow-x-auto">
          {/* Input Ports Legend */}
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {inputLegendPorts.map((port) => (
              <div
                key={port.id}
                className="flex items-center gap-1 bg-background/80 px-1.5 py-0.5 border border-border/60 rounded text-foreground/90 font-semibold"
                title={`Input Port: ${port.name}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${port.color}`} />
                <span className="truncate max-w-[55px]">{port.name}</span>
              </div>
            ))}
          </div>

          {/* Output Ports Legend */}
          <div className="flex items-center justify-end gap-1 flex-wrap min-w-0 ml-auto">
            {outputLegendPorts.map((port) => (
              <div
                key={port.id}
                className="flex items-center gap-1 bg-background/80 px-1.5 py-0.5 border border-border/60 rounded text-foreground/90 font-semibold"
                title={`Output Port: ${port.name}`}
              >
                <span className="truncate max-w-[55px]">{port.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${port.color}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8-Axis Resize Handles Displayed on Hover + Cmd key */}
      {showGrips && (
        <>
          <div
            onMouseDown={(e) => handleResizeStart('nw', e)}
            className="top-0 left-0 absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-nwse-resize z-30"
            title="Resize (Cmd + Drag Top-Left)"
          />
          <div
            onMouseDown={(e) => handleResizeStart('n', e)}
            className="top-0 left-1/2 absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-ns-resize z-30"
            title="Resize (Cmd + Drag Top)"
          />
          <div
            onMouseDown={(e) => handleResizeStart('ne', e)}
            className="top-0 right-0 absolute translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-nesw-resize z-30"
            title="Resize (Cmd + Drag Top-Right)"
          />
          <div
            onMouseDown={(e) => handleResizeStart('e', e)}
            className="top-1/2 right-0 absolute translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-ew-resize z-30"
            title="Resize (Cmd + Drag Right)"
          />
          <div
            onMouseDown={(e) => handleResizeStart('se', e)}
            className="bottom-0 right-0 absolute translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-nwse-resize z-30"
            title="Resize (Cmd + Drag Bottom-Right)"
          />
          <div
            onMouseDown={(e) => handleResizeStart('s', e)}
            className="bottom-0 left-1/2 absolute -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-ns-resize z-30"
            title="Resize (Cmd + Drag Bottom)"
          />
          <div
            onMouseDown={(e) => handleResizeStart('sw', e)}
            className="bottom-0 left-0 absolute -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-nesw-resize z-30"
            title="Resize (Cmd + Drag Bottom-Left)"
          />
          <div
            onMouseDown={(e) => handleResizeStart('w', e)}
            className="top-1/2 left-0 absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary border-2 border-background rounded-full shadow-md hover:scale-150 transition-transform cursor-ew-resize z-30"
            title="Resize (Cmd + Drag Left)"
          />
        </>
      )}

      {/* TOP Border Ports */}
      {(topPorts.length > 0 || (isCandidate && candidateSide === 'top')) && (
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
                  port.color || 'bg-amber-400'
                }`}
              />
              <span className="bottom-5 absolute bg-card shadow-xs px-1.5 py-0.5 border border-border rounded font-mono text-[9px] text-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                {port.name}
              </span>
            </div>
          ))}
          {isCandidate && candidateSide === 'top' && (
            <div className="relative flex items-center justify-center cursor-pointer pointer-events-auto animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-sky-400 bg-sky-500/80 shadow-md scale-110" />
              <span className="bottom-5 absolute bg-sky-950 text-sky-200 px-1.5 py-0.5 border border-sky-400 rounded font-mono text-[9px] whitespace-nowrap shadow-md">
                {candidateNotePort.portName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM Border Ports */}
      {(bottomPorts.length > 0 || (isCandidate && candidateSide === 'bottom')) && (
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
                  port.color || 'bg-emerald-500'
                }`}
              />
              <span className="top-5 absolute bg-card shadow-xs px-1.5 py-0.5 border border-border rounded font-mono text-[9px] text-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                {port.name}
              </span>
            </div>
          ))}
          {isCandidate && candidateSide === 'bottom' && (
            <div className="relative flex items-center justify-center cursor-pointer pointer-events-auto animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-sky-400 bg-sky-500/80 shadow-md scale-110" />
              <span className="top-5 absolute bg-sky-950 text-sky-200 px-1.5 py-0.5 border border-sky-400 rounded font-mono text-[9px] whitespace-nowrap shadow-md">
                {candidateNotePort.portName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* LEFT Border Ports */}
      {(leftPorts.length > 0 || (isCandidate && candidateSide === 'left')) && (
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
          {isCandidate && candidateSide === 'left' && (
            <div className="relative flex items-center justify-center cursor-pointer pointer-events-auto animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-sky-400 bg-sky-500/80 shadow-md scale-110" />
              <span className="left-5 absolute bg-sky-950 text-sky-200 px-1.5 py-0.5 border border-sky-400 rounded font-mono text-[9px] whitespace-nowrap shadow-md">
                {candidateNotePort.portName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* RIGHT Border Ports */}
      {(rightPorts.length > 0 || (isCandidate && candidateSide === 'right')) && (
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
          {isCandidate && candidateSide === 'right' && (
            <div className="relative flex items-center justify-center cursor-pointer pointer-events-auto animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-sky-400 bg-sky-500/80 shadow-md scale-110" />
              <span className="right-5 absolute bg-sky-950 text-sky-200 px-1.5 py-0.5 border border-sky-400 rounded font-mono text-[9px] whitespace-nowrap shadow-md">
                {candidateNotePort.portName}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

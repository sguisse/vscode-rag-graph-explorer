#!/bin/bash

# Ensure layout directories exist inside the current workspace context
mkdir -p src/components/app
mkdir -p src/components/ui

# 1. Update LayoutPanel to accept and forward granular element sub-IDs for testing pipeline visibility
cat << 'EOF' > src/components/app/layout-panel.tsx
import React from "react";
import { cn } from "../../lib/utils";

export interface LayoutPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  leftId?: string;
  centerId?: string;
  rightId?: string;
}

export function LayoutPanel({
  left,
  center,
  right,
  leftId,
  centerId,
  rightId,
  className,
  ...props
}: LayoutPanelProps) {
  return (
    <div className={cn("flex items-center justify-between w-full", className)} {...props}>
      <div id={leftId} className="flex items-center gap-2 empty:hidden">{left}</div>
      <div id={centerId} className="flex-1 flex items-center justify-center overflow-hidden empty:hidden px-2">{center}</div>
      <div id={rightId} className="flex items-center gap-2 justify-end empty:hidden">{right}</div>
    </div>
  );
}
EOF

# 2. Update ResizableContainer to forward explicit matching sub-element IDs across all view matrix layout panels
cat << 'EOF' > src/components/app/resizable-container.tsx
import React from "react";
import { cn } from "../../lib/utils";
import { LayoutPanel } from "./layout-panel";

export interface ResizableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  visible?: boolean;
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  titleBarId?: string;
  titleBarLeftId?: string;
  titleBarCenterId?: string;
  titleBarRightId?: string;
  contentId?: string;
  handleId?: string;
  headerClassName?: string;
  contentClassName?: string;
  resizeHandle?: 'top' | 'right' | 'bottom' | 'left' | 'none';
  onResizeStart?: (e: React.MouseEvent) => void;
}

export function ResizableContainer({
  id,
  visible = true,
  headerLeft,
  headerCenter,
  headerRight,
  titleBarId,
  titleBarLeftId,
  titleBarCenterId,
  titleBarRightId,
  contentId,
  handleId,
  headerClassName,
  contentClassName,
  resizeHandle = 'none',
  onResizeStart,
  className,
  children,
  style,
  ...props
}: ResizableContainerProps) {
  if (!visible) return null;

  const handleClasses = {
    top: "top-0 right-0 left-0 h-1 cursor-row-resize",
    right: "top-0 right-0 bottom-0 w-1 cursor-col-resize",
    bottom: "bottom-0 right-0 left-0 h-1 cursor-row-resize",
    left: "top-0 bottom-0 left-0 w-1 cursor-col-resize",
    none: "hidden"
  };

  const handleInnerClasses = {
    top: "top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px]",
    right: "top-1/2 right-[1px] -translate-y-1/2 w-[2px] h-8",
    bottom: "bottom-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px]",
    left: "top-1/2 left-[1px] -translate-y-1/2 w-[2px] h-8",
    none: "hidden"
  };

  const hasHeader = headerLeft || headerCenter || headerRight;

  return (
    <div
      id={id}
      style={style}
      className={cn("relative flex flex-col shrink-0 min-w-0 min-h-0 overflow-hidden bg-card border-border", className)}
      {...props}
    >
      {hasHeader && (
        <LayoutPanel
          id={titleBarId}
          left={headerLeft}
          center={headerCenter}
          right={headerRight}
          leftId={titleBarLeftId}
          centerId={titleBarCenterId}
          rightId={titleBarRightId}
          className={cn(
            "h-8 px-3 border-b border-border bg-secondary text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 select-none",
            headerClassName
          )}
        />
      )}

      <div id={contentId || `${id}-content`} className={cn("relative flex-1 overflow-auto scrollbar-hide w-full h-full min-h-0 min-w-0 bg-background", contentClassName)}>
        {children}
      </div>

      {resizeHandle !== 'none' && onResizeStart && (
        <div
          id={handleId}
          className={cn("absolute z-20 hover:bg-primary/20 transition-colors group", handleClasses[resizeHandle])}
          onMouseDown={onResizeStart}
        >
          <div className={cn("absolute bg-border rounded-full", handleInnerClasses[resizeHandle])}></div>
        </div>
      )}
    </div>
  );
}
EOF

# 3. Overwrite App.tsx with absolute fidelity, integrating precise IDs on all structural DOM nodes
cat << 'EOF' > src/App.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Network, Search, Download, Upload, Moon, Sun, RotateCcw, EyeOff, Eye,
  ChevronRight, ChevronLeft, LayoutDashboard, FolderTree, Scale, Terminal,
  History, HelpCircle, FileJson, Server, Database, ShieldAlert, Play,
  Minus, Plus, Focus, X, CheckCircle2, XCircle, CircleArrowRight, File, Folder,
  Shrink, Maximize, Minimize, Menu, Settings
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Switch } from './components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './components/ui/select';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge, SidebarFooter } from './components/ui/sidebar';

import { LayoutPanel } from './components/app/layout-panel';
import { ResizableContainer } from './components/app/resizable-container';

// ==========================================
// 1. INITIAL AST DATA (18 Nodes, 16 Edges)
// ==========================================
const AST_DATA = {
  nodes: [
    { data: { id: 'UserController', label: 'UserController.ts', type: 'class', layer: 'controller' } },
    { data: { id: 'AuthService', label: 'AuthService.ts', type: 'class', layer: 'service' } },
    { data: { id: 'PaymentService', label: 'PaymentService.ts', type: 'class', layer: 'service' } },
    { data: { id: 'UserRepository', label: 'UserRepository.ts', type: 'class', layer: 'repository' } },
    { data: { id: 'DbClient', label: 'DatabaseClient.ts', type: 'class', layer: 'database' } },
    { data: { id: 'uc_api1', parent: 'UserController', label: 'login()', layer: 'controller' } },
    { data: { id: 'uc_api2', parent: 'UserController', label: 'getProfile()', layer: 'controller' } },
    { data: { id: 'uc_api3', parent: 'UserController', label: 'processPay()', layer: 'controller' } },
    { data: { id: 'as_auth', parent: 'AuthService', label: 'authenticate()', layer: 'service' } },
    { data: { id: 'as_verify', parent: 'AuthService', label: 'verifyToken()', layer: 'service' } },
    { data: { id: 'ps_process', parent: 'PaymentService', label: 'process()', layer: 'service' } },
    { data: { id: 'ps_refund', parent: 'PaymentService', label: 'refund()', layer: 'service' } },
    { data: { id: 'ur_getUser', parent: 'UserRepository', label: 'findById()', layer: 'repository' } },
    { data: { id: 'ur_saveUser', parent: 'UserRepository', label: 'save()', layer: 'repository' } },
    { data: { id: 'ur_updateStatus', parent: 'UserRepository', label: 'updateStatus()', layer: 'repository' } },
    { data: { id: 'db_read', parent: 'DbClient', label: 'query()', layer: 'database' } },
    { data: { id: 'db_write', parent: 'DbClient', label: 'execute()', layer: 'database' } },
    { data: { id: 'db_transaction', parent: 'DbClient', label: 'transaction()', layer: 'database' } }
  ],
  edges: [
    { data: { id: 'e1', source: 'uc_api1', target: 'as_auth' } },
    { data: { id: 'e2', source: 'uc_api2', target: 'as_verify' } },
    { data: { id: 'e3', source: 'uc_api3', target: 'ps_process' } },
    { data: { id: 'e4', source: 'as_auth', target: 'ur_getUser' } },
    { data: { id: 'e5', source: 'as_verify', target: 'ur_getUser' } },
    { data: { id: 'e6', source: 'ps_process', target: 'as_verify' } },
    { data: { id: 'e7', source: 'ps_process', target: 'ur_updateStatus' } },
    { data: { id: 'e8', source: 'ps_process', target: 'db_transaction' } },
    { data: { id: 'e9', source: 'ps_refund', target: 'ur_updateStatus' } },
    { data: { id: 'e10', source: 'ur_getUser', target: 'db_read' } },
    { data: { id: 'e11', source: 'ur_saveUser', target: 'db_write' } },
    { data: { id: 'e12', source: 'ur_updateStatus', target: 'db_write' } },
    { data: { id: 'e13', source: 'as_auth', target: 'ur_saveUser' } },
    { data: { id: 'e14', source: 'uc_api1', target: 'uc_api2' } },
    { data: { id: 'e15', source: 'ps_process', target: 'ps_refund' } },
    { data: { id: 'e16', source: 'db_transaction', target: 'db_write' } }
  ]
};

// ==========================================
// 2. DYNAMIC CYTOSCAPE STYLES (Light/Dark)
// ==========================================
const getCyStyles = (isDark) => [
  { selector: 'node', style: { 'background-color': isDark ? '#27272a' : '#ffffff', 'color': isDark ? '#e4e4e7' : '#27272a', 'label': 'data(label)', 'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif', 'font-size': '12px', 'text-valign': 'center', 'text-halign': 'center', 'border-width': 1, 'border-color': isDark ? '#3f3f46' : '#d4d4d8', 'shape': 'round-rectangle', 'width': 'wrap', 'height': 'wrap', 'padding': '10px' } },
  { selector: ':parent', style: { 'background-color': isDark ? '#18181b' : '#f4f4f5', 'background-opacity': 0.8, 'border-width': 1, 'border-color': isDark ? '#3f3f46' : '#d4d4d8', 'border-style': 'solid', 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -8, 'color': isDark ? '#e4e4e7' : '#3f3f46', 'font-size': '12px', 'font-weight': 'bold', 'padding': '16px' } },
  { selector: 'edge', style: { 'width': 1.5, 'line-color': isDark ? '#3f3f46' : '#a1a1aa', 'target-arrow-color': isDark ? '#3f3f46' : '#a1a1aa', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'arrow-scale': 1.2 } },
  { selector: 'node.selected', style: { 'background-color': isDark ? '#93c5fd' : '#bfdbfe', 'color': isDark ? '#172554' : '#1e3a8a', 'border-color': isDark ? '#2563eb' : '#3b82f6', 'border-width': 2, 'z-index': 10 } },
  { selector: 'node.caller', style: { 'background-color': isDark ? '#f87171' : '#fecaca', 'color': isDark ? '#450a0a' : '#7f1d1d', 'border-color': isDark ? '#dc2626' : '#ef4444', 'border-width': 2 } },
  { selector: 'node.callee', style: { 'background-color': isDark ? '#fb923c' : '#fed7aa', 'color': isDark ? '#431407' : '#7c2d12', 'border-color': isDark ? '#ea580c' : '#f97316', 'border-width': 2 } },
  { selector: 'edge.caller-edge', style: { 'line-color': isDark ? '#f87171' : '#ef4444', 'target-arrow-color': isDark ? '#f87171' : '#ef4444', 'width': 2 } },
  { selector: 'edge.callee-edge', style: { 'line-color': isDark ? '#fb923c' : '#f97316', 'target-arrow-color': isDark ? '#fb923c' : '#f97316', 'width': 2 } },
  { selector: 'node.layer-colored[layer="controller"]', style: { 'background-color': '#3b82f6', 'color': '#ffffff', 'border-color': '#1d4ed8' } },
  { selector: 'node.layer-colored[layer="service"]', style: { 'background-color': '#8b5cf6', 'color': '#ffffff', 'border-color': '#6d28d9' } },
  { selector: 'node.layer-colored[layer="repository"]', style: { 'background-color': '#10b981', 'color': '#ffffff', 'border-color': '#047857' } },
  { selector: 'node.layer-colored[layer="database"]', style: { 'background-color': '#eab308', 'color': '#000000', 'border-color': '#a16207' } },
  { selector: ':parent.layer-colored[layer]', style: { 'color': isDark ? '#e4e4e7' : '#3f3f46', 'background-opacity': 0.15 } },
];

// ==========================================
// 3. UTILITY HOOKS (Resizing)
// ==========================================
const useResizable = (initialSize: number, minSize: number, maxSize: number, isHorizontal: boolean = true, reverse: boolean = false) => {
  const [size, setSize] = useState(initialSize);
  const sizeRef = useRef(size);

  useEffect(() => { sizeRef.current = size; }, [size]);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent | MouseEvent | any) => {
    mouseDownEvent.preventDefault();
    const startSize = sizeRef.current;
    const startPosition = isHorizontal ? mouseDownEvent.clientX : mouseDownEvent.clientY;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const currentPosition = isHorizontal ? mouseMoveEvent.clientX : mouseMoveEvent.clientY;
      const delta = currentPosition - startPosition;
      const newSize = reverse ? startSize - delta : startSize + delta;
      setSize(Math.min(Math.max(newSize, minSize), maxSize));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [isHorizontal, reverse, minSize, maxSize]);

  return [size, startResizing, setSize] as const;
};

// ==========================================
// 5. MAIN APPLICATION
// ==========================================
export default function App() {
  // --- GLOBAL STATES ---
  const [cyLoaded, setCyLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('panel-welcome');
  const [sidebarLeftMode, setSidebarLeftMode] = useState('normal');

  // Core view visibility toggles
  const [isCtnAppWorkspaceVisible, setIsCtnAppWorkspaceVisible] = useState(true);
  const [isCtnAppWorkspaceTopVisible, setIsCtnAppWorkspaceTopVisible] = useState(true);
  const [isCtnAppWorkspaceLeftVisible, setIsCtnAppWorkspaceLeftVisible] = useState(true);
  const [isCtnAppWorkspaceCenterVisible, setIsCtnAppWorkspaceCenterVisible] = useState(true);
  const [isCtnAppWorkspaceRightVisible, setIsCtnAppWorkspaceRightVisible] = useState(true);
  const [isCtnAppWorkspaceBottomVisible, setIsCtnAppWorkspaceBottomVisible] = useState(true);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(true);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);

  const [explorerFilter, setExplorerFilter] = useState('folder');

  // --- DIMENSIONAL STATES ---
  const [sidebarLeftWidth, startSidebarLeftResize] = useResizable(220, 160, 400, true);
  const [mainLeftWidth, startmainLeftResize] = useResizable(30, 15, 60, true);
  const [mainRightWidth, startmainRightResize] = useResizable(30, 15, 60, true, true);
  const [ctnAppWorkspaceTopHeight, startCtnAppWorkspaceTopResize] = useResizable(120, 50, 250, false);
  const [ctnAppWorkspaceBottomHeight, startCtnAppWorkspaceBottomResize] = useResizable(30, 30, 400, false, true);
  const [sidebarRightWidth, startSidebarRightResize] = useResizable(300, 180, 600, true, true);

  const cyRef = useRef(null);
  const graphContainerRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [impacts, setImpacts] = useState({ callers: [], callees: [], edges: [] });

  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // --- SYNC DARK MODE CLASS WITH ROOT ELEMENT ---
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) htmlElement.classList.add('dark');
    else htmlElement.classList.remove('dark');
    if (cyRef.current) cyRef.current.style(getCyStyles(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (cyRef.current) {
      setTimeout(() => { cyRef.current.resize(); cyRef.current.fit(); }, 180);
    }
  }, [isCtnAppWorkspaceLeftVisible, isCtnAppWorkspaceRightVisible, isCtnAppWorkspaceCenterVisible, mainLeftWidth, mainRightWidth]);

  useEffect(() => {
    if (window.cytoscape) { setCyLoaded(true); return; }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js";
    script.async = true;
    script.onload = () => setCyLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!selectedIds.length) {
      setImpacts({ callers: [], callees: [], edges: [] });
      return;
    }
    const callers = new Set(), callees = new Set(), impactEdges = new Set();

    let queue = [...selectedIds];
    let visited = new Set(selectedIds);
    while(queue.length > 0) {
      const current = queue.shift();
      AST_DATA.edges.filter(e => e.data.target === current).forEach(e => {
        impactEdges.add(e.data.id);
        if (!visited.has(e.data.source)) {
          visited.add(e.data.source);
          callers.add(e.data.source);
          queue.push(e.data.source);
        }
      });
    }

    queue = [...selectedIds];
    visited = new Set(selectedIds);
    while(queue.length > 0) {
      const current = queue.shift();
      AST_DATA.edges.filter(e => e.data.source === current).forEach(e => {
        impactEdges.add(e.data.id);
        if (!visited.has(e.data.target)) {
          visited.add(e.data.target);
          callees.add(e.data.target);
          queue.push(e.data.target);
        }
      });
    }

    setImpacts({ callers: Array.from(callers), callees: Array.from(callees), edges: Array.from(impactEdges) });
  }, [selectedIds]);

  useEffect(() => {
    if (!cyLoaded || !graphContainerRef.current) return;

    if (!cyRef.current) {
      cyRef.current = window.cytoscape({
        container: graphContainerRef.current,
        elements: AST_DATA,
        style: getCyStyles(isDarkMode),
        layout: { name: 'cose', padding: 50, animate: false },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false
      });

      cyRef.current.on('tap', 'node', (evt) => {
        const node = evt.target;
        if (node.isParent()) return;
        const isMulti = evt.originalEvent.ctrlKey || evt.originalEvent.metaKey;
        const id = node.id();
        setSelectedIds(prev => isMulti ? (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]) : [id]);
      });

      cyRef.current.on('tap', (evt) => {
        if (evt.target === cyRef.current) setSelectedIds([]);
      });
    }

    const cy = cyRef.current;
    cy.batch(() => {
      cy.elements().removeClass('selected caller callee layer-colored caller-edge callee-edge');
      if (explorerFilter === 'layer') cy.nodes().addClass('layer-colored');
      selectedIds.forEach(id => cy.$id(id).addClass('selected'));
      impacts.callers.forEach(id => cy.$id(id).addClass('caller'));
      impacts.callees.forEach(id => cy.$id(id).addClass('callee'));
      impacts.edges.forEach(eId => {
         const edge = cy.$id(eId);
         if (selectedIds.includes(edge.data('source'))) edge.addClass('callee-edge');
         if (selectedIds.includes(edge.data('target'))) edge.addClass('caller-edge');
      });
    });
  }, [cyLoaded, selectedIds, impacts, explorerFilter, isDarkMode]);

  const renderViewContent = () => {
    switch(activeView) {
      case 'panel-welcome':
        return (
          <div id="panel-welcome" className="space-y-6 p-4">
            <div id="panel-welcome-header" className="flex items-center gap-2 font-semibold text-foreground text-sm tracking-tight">
              <ShieldAlert className="text-primary" size={18} /> Installation Diagnostics
            </div>
            <div id="panel-security-breaker" className="flex justify-between items-center bg-muted p-3 border border-border rounded-md">
              <div>
                <span className="font-medium text-foreground text-xs">Security Breaker</span>
                <p className="text-[11px] text-muted-foreground">Simulate a connection loss with the graph database.</p>
              </div>
              <Switch id="checkbox-security-breaker" checked={isLocked} onCheckedChange={setIsLocked} />
            </div>
            <div id="panel-diagnostic-grid" className="gap-2 grid grid-cols-2 text-xs">
              {['Node.js v20', 'Dependency Cruiser', 'SWC Parser', 'Python 3.11', 'jQAssistant', 'Neo4j Community v5'].map((check, i) => {
                const isFail = isLocked && (check.includes('Neo4j') || check.includes('jQAssistant'));
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded border transition-colors ${isFail ? 'border-destructive/30 bg-destructive/10 text-destructive-foreground' : 'border-success/30 bg-success/10 text-success-foreground'}`}>
                    {isFail ? <XCircle size={14} className="text-destructive-foreground" /> : <CheckCircle2 size={14} />}
                    <span className="text-foreground">{check}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'panel-explorer':
        return (
          <div id="panel-explorer" className="flex flex-col h-full">
            <LayoutPanel
              id="panel-explorer-filters"
              left={
                <div className="flex gap-1">
                  {['folder', 'ext', 'layer', 'list'].map(f => (
                    <Button key={f} id={`btn-filter-${f}`} variant="ghost" size="sm" onClick={() => setExplorerFilter(f)} className={`capitalize text-xs h-7 px-2.5 ${explorerFilter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted'}`}>{f}</Button>
                  ))}
                </div>
              }
              className="bg-muted p-2 border-border border-b h-auto"
            />
            <div id="panel-explorer-list" className="flex-1 space-y-1 p-2 overflow-y-auto">
              {AST_DATA.nodes.filter(n => n.data.type !== 'class').map(node => (
                <div key={node.data.id} id={`item-explorer-${node.data.id}`} onClick={(e) => {
                    const isMulti = e.ctrlKey || e.metaKey;
                    setSelectedIds(prev => isMulti ? (prev.includes(node.data.id) ? prev.filter(id => id !== node.data.id) : [...prev, node.data.id]) : [node.data.id]);
                  }}
                  className={`flex items-center gap-2 p-1.5 text-xs rounded cursor-pointer border border-transparent hover:border-border ${selectedIds.includes(node.data.id) ? 'bg-primary/10 text-primary border border-primary/20 font-medium' : 'text-foreground/80'}`}
                >
                  <FileJson size={14} className={explorerFilter === 'layer' ? 'text-primary' : 'text-muted-foreground'} />
                  <span className="truncate">{node.data.parent}.{node.data.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'panel-rules':
        return (
          <div id="panel-rules" className="flex flex-col gap-4 p-4 h-full">
             <div id="panel-rules-selector" className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">Pre-configured Rule</label>
              <Select defaultValue="layer-bypass">
                <SelectTrigger id="select-cypher-rules" className="w-full bg-card"><SelectValue placeholder="Select Rule" /></SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="layer-bypass">Layer bypass detection (Controller -{'>'} Repo)</SelectItem>
                  <SelectItem value="cyclic">Cyclic dependencies detected</SelectItem>
                  <SelectItem value="orphan">Orphan methods (Dead Code)</SelectItem>
                </SelectContent>
              </Select>
             </div>
             <div id="panel-rules-editor" className="flex flex-col flex-1 space-y-1.5">
               <LayoutPanel
                 left={<span className="text-muted-foreground text-xs font-medium">Cypher Editor</span>}
                 right={<Button id="btn-execute-cypher" variant="ghost" size="sm" className="text-primary h-6 px-2"><Play size={12} className="mr-1"/> Execute</Button>}
               />
               <Textarea id="textarea-cypher-editor" className="flex-1 font-mono text-foreground text-xs resize-none bg-muted/50 border-border" defaultValue={"MATCH (c:Controller)-[r:CALLS]->(repo:Repository)\nRETURN c.name, repo.name, type(r)"} />
             </div>
          </div>
        );
      case 'panel-help':
        return (
          <div id="panel-help" className="space-y-4 p-4 text-muted-foreground text-xs">
            <h3 className="mb-2 font-semibold text-foreground">Navigation Guide</h3>
            <p>Use <kbd className="bg-muted px-1 border border-border rounded text-[10px] text-foreground">Ctrl</kbd> or <kbd className="bg-muted px-1 border border-border rounded text-[10px] text-foreground">Cmd</kbd> + Click on the explorer or graph to enable multiple selection.</p>
            <div id="panel-help-legend" className="space-y-2 mt-4 pt-4 border-border border-t">
              <p className="font-semibold text-foreground">Impact Legend</p>
              <div className="flex items-center gap-2"><div className="bg-primary/20 border border-primary rounded w-3 h-3"></div> Selected source</div>
              <div className="flex items-center gap-2"><div className="bg-destructive border border-destructive rounded w-3 h-3"></div> Callers (Upstream)</div>
              <div className="flex items-center gap-2"><div className="bg-warning border border-warning rounded w-3 h-3"></div> Callees (Downstream)</div>
            </div>
          </div>
        );
      default:
        return (
          <div id="panel-fallback" className="p-4 space-y-2 text-xs">
            <div className="text-center text-muted-foreground font-medium mb-1">Module Showcase Fallback</div>
            <div className="flex items-center gap-2 bg-success p-2 border border-success/30 rounded text-success-foreground transition-colors"><CheckCircle2 size={14} className="shrink-0" /><span><strong>Success state:</strong> Action completed.</span></div>
            <div className="flex items-center gap-2 bg-destructive p-2 border border-destructive/30 rounded text-destructive-foreground transition-colors"><XCircle size={14} className="shrink-0" /><span><strong>Error state:</strong> Destructive fallback triggered.</span></div>
            <div className="flex items-center gap-2 bg-warning p-2 border border-warning/30 rounded text-warning-foreground transition-colors"><ShieldAlert size={14} className="shrink-0" /><span><strong>Warning state:</strong> Muted gold context limits.</span></div>
            <div className="flex items-center gap-2 bg-info p-2 border border-info/30 rounded text-info-foreground transition-colors"><HelpCircle size={14} className="shrink-0" /><span><strong>Info state:</strong> Sky blue layout indicator maps.</span></div>
          </div>
        );
    }
  };

  const getActiveViewLabel = () => SIDEBAR_MENU_ITEMS.find(i => i.id === activeView)?.label || 'Detailed Overview';

  const renderSidebarMenuItem = (item) => (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton id={`btn-menu-${item.id}`} isActive={activeView === item.id} onClick={() => setActiveView(item.id)} title={sidebarLeftMode === 'minimal' ? item.label : undefined}>
        <item.icon size={16} className="mr-2.5 shrink-0" />
        {sidebarLeftMode === 'normal' && (
          <><span className="truncate">{item.label}</span>{item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}</>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <TooltipProvider>
      <div id="ctn-app-root" className={`flex flex-col h-screen w-screen overflow-hidden font-sans text-sm select-none transition-colors duration-200 bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>

        {/* SECURITY LOCK (Overlay) */}
        {isLocked && (
          <div id="panel-security-lock-overlay" className="z-40 absolute inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200">
            <div id="panel-security-lock-modal" className="bg-card shadow-2xl p-6 border border-border rounded-lg max-w-md text-center zoom-in-95 duration-200">
              <ShieldAlert className="mx-auto mb-4 text-destructive-foreground" size={44} />
              <h2 className="mb-2 font-bold text-foreground text-base tracking-tight">Sandbox locked</h2>
              <p className="mb-4 text-muted-foreground text-xs leading-relaxed">Connection to the local Neo4j cluster was interrupted. Analysis modules are suspended for safety.</p>
              <div id="panel-security-lock-actions">
                <Button variant="destructive" size="sm" id="btn-restore-connection" onClick={() => setIsLocked(false)}>Restore connection</Button>
              </div>
            </div>
          </div>
        )}

        {/* A. FIXED HEADER */}
        <LayoutPanel
          id="ctn-app-header"
          leftId="panel-app-header-left"
          centerId="panel-app-header-center"
          rightId="panel-app-header-right"
          className="z-20 bg-card h-[40px] px-3 border-b border-border shrink-0"
          left={
            <>
              <Button id="btn-toggle-sidebar-collapse" variant="ghost" size="icon" onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')} className="w-8 h-8 text-muted-foreground hover:text-foreground">
                <Menu size={16} />
              </Button>
              <Tooltip>
                <TooltipTrigger render={
                  <div id="header-logo" className="flex items-center gap-2 text-primary cursor-help ml-1">
                    <span className="font-bold tracking-tight text-xs text-foreground">Graph-Impact</span>
                  </div>
                } />
                <TooltipContent side="bottom">Active GraphRAG engine - Real-time topological analysis</TooltipContent>
              </Tooltip>
            </>
          }
          center={
            <div className="w-full max-w-md relative flex items-center">
              <Search className="left-2 absolute text-muted-foreground" size={14} />
              <Input id="input-global-search" type="text" placeholder="Search for an AST entity (e.g., UserController)..." className="pl-8 bg-muted text-xs h-8" disabled={isLocked} />
            </div>
          }
          right={
            <div className="flex items-center gap-1">
              <button id="btn-import-dialog" onClick={() => setImportOpen(true)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Import"><Upload size={16} /></button>
              <button id="btn-export-dialog" onClick={() => setExportOpen(true)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Export"><Download size={16} /></button>
              <div className="bg-border mx-1 w-px h-4"></div>
              <button id="btn-toggle-theme" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}>
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button id="btn-reset-graphe" onClick={() => { setSelectedIds([]); setExplorerFilter('folder'); if(cyRef.current) cyRef.current.fit(); }} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Reset"><RotateCcw size={16} /></button>
              <div className="bg-border mx-1 w-px h-4"></div>
              <button id="btn-toggle-main" onClick={() => setIsCtnAppWorkspaceVisible(!isCtnAppWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnAppWorkspaceVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-main-header" onClick={() => setIsCtnAppWorkspaceTopVisible(!isCtnAppWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnAppWorkspaceTopVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-main-left" onClick={() => setIsCtnAppWorkspaceLeftVisible(!isCtnAppWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnAppWorkspaceLeftVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-main-center" onClick={() => setIsCtnAppWorkspaceCenterVisible(!isCtnAppWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnAppWorkspaceCenterVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-workspace-right" onClick={() => setIsCtnAppWorkspaceRightVisible(!isCtnAppWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnAppWorkspaceRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-workspace-bottom" onClick={() => setIsCtnAppWorkspaceBottomVisible(!isCtnAppWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnAppWorkspaceBottomVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <div className="bg-border mx-1 w-px h-4"></div>
              <button id="btn-toggle-main-right" onClick={() => setIsSidebarRightVisible(!isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isSidebarRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
            </div>
          }
        />

        {/* MODALS */}
        <Dialog id="modal-import" open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="bg-card border border-border">
            <DialogHeader><DialogTitle className="font-semibold text-foreground text-sm">Import AST Graph</DialogTitle></DialogHeader>
            <p className="my-2 text-muted-foreground text-xs">Select a JSON file generated by the SWC extractor.</p>
            <Button id="btn-import-browse" className="mt-2 w-full">Browse...</Button>
          </DialogContent>
        </Dialog>

        <Dialog id="modal-export" open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="bg-card border border-border">
            <DialogHeader><DialogTitle className="font-semibold text-foreground text-sm">Export Topology</DialogTitle></DialogHeader>
            <p className="my-2 text-muted-foreground text-xs">Exporting metadata and current adjacency matrix.</p>
            <div id="panel-export-actions" className="flex gap-2">
              <Button id="btn-export-json" variant="outline" size="sm" className="flex-1">JSON</Button>
              <Button id="btn-export-cypher" variant="default" size="sm" className="flex-1">Cypher DDL</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MAIN APPLICATION CONTAINER MATRIX */}
        <div id="ctn-app-main" className="relative flex flex-1 overflow-hidden">

          {/* B. SIDEBAR */}
          {sidebarLeftMode !== 'collapsed' && (
            <Sidebar id="ctn-app-sidebar-left" width={sidebarLeftMode === 'minimal' ? '56px' : `${sidebarLeftWidth}px`}>
              <SidebarContent id="panel-app-sidebar-left-top">
                <SidebarGroup><SidebarMenu>{SIDEBAR_MENU_ITEMS.filter(item => !item.bottom).map(renderSidebarMenuItem)}</SidebarMenu></SidebarGroup>
                <SidebarGroup className="mt-auto pt-2 border-sidebar-border border-t"><SidebarMenu>{SIDEBAR_MENU_ITEMS.filter(item => item.bottom).map(renderSidebarMenuItem)}</SidebarMenu></SidebarGroup>
              </SidebarContent>
              <SidebarFooter id="panel-app-sidebar-left-bottom" className="p-0">
                <Button id="btn-sidebar-toggle-mode" variant="ghost" size="sm" onClick={() => setSidebarLeftMode(m => m === 'normal' ? 'minimal' : 'normal')} className={`w-full text-muted-foreground hover:text-foreground ${sidebarLeftMode === 'normal' ? 'justify-end' : 'justify-center'}`}>
                  {sidebarLeftMode === 'normal' ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
                </Button>
              </SidebarFooter>
              {sidebarLeftMode === 'normal' && (
                <div id="ctn-app-sidebar-left-handle" className="group top-0 right-0 bottom-0 z-20 absolute hover:bg-sidebar-border w-1 cursor-col-resize" onMouseDown={startSidebarLeftResize}>
                   <div className="top-1/2 right-[1px] absolute bg-sidebar-border rounded-full w-[2px] h-8 -translate-y-1/2"></div>
                </div>
              )}
            </Sidebar>
          )}

          {/* C. CENTRAL WORKSPACE STAGE */}
          <div id="ctn-app-workspace" style={{ display: isCtnAppWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-background min-w-0">
            <div id="ctn-app-workspace-wrapper-lvl-1" className="relative flex flex-col flex-1 min-w-0">

              {/* TOP COLLAPSIBLE CONTAINER */}
              <ResizableContainer
                id="ctn-app-workspace-top"
                visible={isCtnAppWorkspaceTopVisible}
                style={{ height: `${ctnAppWorkspaceTopHeight}px` }}
                headerLeft="Selected files"
                titleBarId="ctn-app-workspace-top-title-bar"
                titleBarLeftId="ctn-app-workspace-top-title-bar-left"
                titleBarCenterId="ctn-app-workspace-top-title-bar-center"
                contentId="ctn-app-workspace-top-content"
                handleId="ctn-app-workspace-top-handle"
                resizeHandle="bottom"
                onResizeStart={startCtnWorkspaceTopResize}
                className="bg-muted border-b"
              >
                <div className="p-1">
                  <ul id="files-list" className="space-y-1.5 text-muted-foreground p-2">
                    <li className="flex items-center gap-2"><Folder size={14} /> <span>workspace/src/main/java</span></li>
                    <li className="flex items-center gap-2"><File size={14} /> <span>workspace/src/main/resources/application.properties</span></li>
                    <li className="flex items-center gap-2"><Folder size={14} /> <span>workspace//src/main/resources/templates</span></li>
                  </ul>
                </div>
              </ResizableContainer>

              {/* MIDDLE LAYOUT TIER SPLITS */}
              <div id="ctn-app-workspace-middle-row" className="flex flex-1 min-h-0 overflow-hidden">

                {/* LEFT TIER CONTAINER */}
                <ResizableContainer
                  id="ctn-app-workspace-left"
                  visible={isCtnAppWorkspaceLeftVisible}
                  style={{ width: `${mainLeftWidth}%` }}
                  headerLeft={getActiveViewLabel()}
                  titleBarId="ctn-app-workspace-left-title-bar"
                  titleBarLeftId="ctn-app-workspace-left-title-left"
                  contentId="ctn-app-workspace-left-content"
                  handleId="ctn-app-workspace-left-handle"
                  className="border-r min-w-[200px]"
                  resizeHandle="right"
                  onResizeStart={startmainLeftResize}
                >
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex-1 overflow-auto scrollbar-hide">
                      {renderViewContent()}
                    </div>
                    <ResizableContainer
                      id="panel-logs"
                      headerLeft="Parser Logs"
                      titleBarId="panel-logs-title-bar"
                      contentId="panel-logs-content"
                      className="h-[140px] border-t border-l-0 border-r-0 border-b-0"
                      resizeHandle="top"
                    >
                      <div className="p-2 font-mono text-[11px] text-muted-foreground space-y-1">
                        <div><span className="text-primary">[INFO]</span> AST Parser initiated on 3 files.</div>
                        <div><span className="text-primary">[INFO]</span> Topological graph built: 18 nodes.</div>
                      </div>
                    </ResizableContainer>
                  </div>
                </ResizableContainer>

                {/* CENTER CORE CANVAS CONTAINER */}
                <ResizableContainer
                  id="ctn-app-workspace-center"
                  visible={isCtnAppWorkspaceCenterVisible || isGraphMaximized}
                  style={isGraphMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : { flex: 1 }}
                  headerLeft="Topological Graph"
                  titleBarId="ctn-app-workspace-center-top-bar"
                  titleBarRightId="ctn-app-workspace-center-top-right"
                  contentId="ctn-app-workspace-center-content"
                  headerRight={
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => cyRef.current?.zoom(cyRef.current.zoom() + 0.1)}><Plus size={12}/></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => cyRef.current?.zoom(cyRef.current.zoom() - 0.1)}><Minus size={12}/></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => cyRef.current?.fit()}><Shrink size={12}/></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => { setIsGraphMaximized(!isGraphMaximized); setTimeout(() => { cyRef.current?.resize(); cyRef.current?.fit(); }, 50); }}>
                        {isGraphMaximized ? <Minimize size={12}/> : <Maximize size={12}/>}
                      </Button>
                    </div>
                  }
                  className="bg-background"
                >
                  <div id="panel-graph-canvas" ref={graphContainerRef} className="absolute inset-0 outline-none w-full h-full"></div>
                  {isLocked && <div id="ctn-app-workspace-center-locked-overlay" className="z-20 absolute inset-0 bg-background/40 pointer-events-none"></div>}
                </ResizableContainer>

                {/* RIGHT TIER CONTAINER */}
                <ResizableContainer
                  id="ctn-app-workspace-right"
                  visible={isCtnAppWorkspaceRightVisible}
                  style={{ width: !isCtnAppWorkspaceCenterVisible ? '100%' : `${mainRightWidth}%` }}
                  headerLeft="Workspace Left title"
                  titleBarId="ctn-app-workspace-right-title-bar"
                  contentId="ctn-app-workspace-right-content"
                  handleId="ctn-app-workspace-right-handle"
                  className={!isCtnAppWorkspaceCenterVisible ? 'flex-1 border-l min-w-[200px]' : 'border-l min-w-[200px]'}
                  resizeHandle={isCtnAppWorkspaceCenterVisible ? "left" : "none"}
                  onResizeStart={isCtnAppWorkspaceCenterVisible ? startmainRightResize : undefined}
                >
                  <div className="p-4 text-muted-foreground text-xs">
                    Not used at this moment
                  </div>
                </ResizableContainer>

              </div>

              {/* BOTTOM HORIZONTAL TIER CONTAINER */}
              <ResizableContainer
                id="ctn-app-workspace-bottom"
                visible={isCtnAppWorkspaceBottomVisible}
                style={{ height: `${ctnAppWorkspaceBottomHeight}px` }}
                className="border-t bg-secondary"
                handleId="ctn-app-workspace-bottom-handle"
                resizeHandle="top"
                onResizeStart={startCtnWorkspaceBottomResize}
              >
                <LayoutPanel
                   className="h-full px-4 text-xs font-medium text-muted-foreground"
                   left={<div id="ctn-app-workspace-bottom-left">Wksp Bottom Left</div>}
                   center={<div id="ctn-app-workspace-bottom-center">Wksp Bottom Center</div>}
                   right={<div id="ctn-app-workspace-bottom-right">Wksp Bottom Right</div>}
                />
              </ResizableContainer>

            </div>
          </div>

          {/* D. RIGHT SIDEBAR INSPECTOR */}
          <ResizableContainer
            id="ctn-app-sidebar-right"
            visible={isSidebarRightVisible}
            style={{ width: `${sidebarRightWidth}px` }}
            headerLeft={<><Database size={13} className="mr-1.5"/> <span>Inspector</span></>}
            headerRight={<Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setSelectedIds([])}><X size={12}/></Button>}
            titleBarId="panel-app-sidebar-right-title-bar"
            contentId="panel-app-sidebar-right-content"
            handleId="ctn-app-sidebar-right-handle"
            className="border-l shrink-0"
            resizeHandle="left"
            onResizeStart={startSidebarRightResize}
          >
            <div className="flex-1 p-4 overflow-y-auto text-xs">
              {selectedIds.length === 0 ? (
                <div className="flex flex-col justify-center items-center gap-1.5 h-full text-muted-foreground text-center">
                  <Focus size={24} className="opacity-40" /> <span>No selection active</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-3 border border-border rounded-md text-center">
                    <div className="text-xl font-bold text-primary">{selectedIds.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Nodes Selected</div>
                  </div>
                  {selectedIds.map(id => {
                    const node = AST_DATA.nodes.find(n => n.data.id === id);
                    if(!node) return null;
                    return (
                      <div key={id} className="border border-border rounded-md overflow-hidden bg-background">
                        <div className="bg-secondary px-2.5 py-1.5 border-b border-border flex justify-between items-center">
                          <span className="font-semibold text-foreground">{node.data.label}</span>
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1 py-0.5 rounded uppercase font-bold">{node.data.layer}</span>
                        </div>
                        <div className="p-2 space-y-1 text-[11px] text-muted-foreground">
                           <div className="flex justify-between"><span>Parent:</span> <span className="text-foreground">{node.data.parent || 'N/A'}</span></div>
                           <div className="flex justify-between"><span>Incoming:</span> <span className="text-destructive-foreground font-bold">{AST_DATA.edges.filter(e => e.data.target === id).length}</span></div>
                           <div className="flex justify-between"><span>Outgoing:</span> <span className="text-primary font-bold">{AST_DATA.edges.filter(e => e.data.source === id).length}</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ResizableContainer>

        </div>

        {/* E. FIXED FOOTER */}
        <LayoutPanel
          id="ctn-app-footer"
          leftId="panel-app-footer-left"
          className="z-20 bg-primary text-primary-foreground h-[35px] px-3 text-xs select-none shrink-0"
          left={
            <>
              <Server size={13} className="mr-1.5"/>
              <span className="font-medium">{isLocked ? "Disconnected" : "Neo4j Connected"}</span>
            </>
          }
          center={
            <div className="flex gap-4 font-mono">
              <div>Callers: <span className="font-bold text-primary-foreground/90">{impacts.callers.length}</span></div>
              <div>Callees: <span className="font-bold text-primary-foreground/90">{impacts.callees.length}</span></div>
            </div>
          }
          right={
            <Tooltip>
              <TooltipTrigger render={
                <div className="opacity-90 text-[11px] cursor-help">Impact count: {selectedIds.length + impacts.callers.length + impacts.callees.length} node(s)</div>
              } />
              <TooltipContent side="top">
                Total node visualization tracking metric matrix context
              </TooltipContent>
            </Tooltip>
          }
        />

      </div>
    </TooltipProvider>
  );
}
EOF

# Verify all structural code tags build smoothly
npm run build

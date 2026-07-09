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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  { selector: 'node', style: { 'background-color': isDark ? '#27272a' : '#ffffff', 'color': isDark ? '#e4e4e7' : '#27272a', 'label': 'data(label)', 'font-family': 'system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif', 'font-size': '12px', 'text-valign': 'center', 'text-halign': 'center', 'border-width': 1, 'border-color': isDark ? '#3f3f46' : '#d4d4d8', 'shape': 'round-rectangle', 'width': 'label', 'height': 'label', 'padding': '10px' } },
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
// 4. SIDEBAR MENU CONFIGURATION
// ==========================================
const SIDEBAR_MENU_ITEMS = [
  { id: 'panel-welcome', icon: LayoutDashboard, label: 'Home' },
  { id: 'panel-explorer', icon: FolderTree, label: 'AST Explorer', badge: AST_DATA.nodes.length },
  { id: 'panel-rules', icon: Scale, label: 'Cypher Rules' },
  { id: 'panel-prompt', icon: FileJson, label: 'GraphRAG Prompt' },
  { id: 'panel-terminal', icon: Terminal, label: 'CLI Terminal' },
  { id: 'panel-history', icon: History, label: 'History' },
  { id: 'panel-configuration', icon: Settings, label: 'Configuration', bottom: true },
  { id: 'panel-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true }
];

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

  const [isCtnWorkspaceVisible, setIsCtnWorkspaceVisible] = useState(true);
  const [isCtnWorkspaceTopVisible, setIsCtnWorkspaceTopVisible] = useState(true);
  const [isCtnWorkspaceLeftVisible, setIsCtnWorkspaceLeftVisible] = useState(true);
  const [isCtnWorkspaceCenterVisible, setIsCtnWorkspaceCenterVisible] = useState(true);
  const [isCtnWorkspaceRightVisible, setIsCtnWorkspaceRightVisible] = useState(true);
  const [isCtnWorkspaceBottomVisible, setIsCtnWorkspaceBottomVisible] = useState(true);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(true);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);

  const [explorerFilter, setExplorerFilter] = useState('folder');

  // --- DIMENSIONAL STATES ---
  const [sidebarLeftWidth, startSidebarLeftResize] = useResizable(220, 160, 400, true);
  const [mainLeftWidth, startmainLeftResize] = useResizable(30, 15, 60, true);
  const [mainRightWidth, startmainRightResize] = useResizable(30, 15, 60, true, true);
  const [ctnWorkspaceTopHeight, startCtnWorkspaceTopResize] = useResizable(120, 50, 250, false);
  const [ctnWorkspaceBottomHeight, startCtnWorkspaceBottomResize] = useResizable(30, 30, 400, false, true);
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
  }, [isCtnWorkspaceLeftVisible, isCtnWorkspaceRightVisible, isCtnWorkspaceCenterVisible, mainLeftWidth, mainRightWidth]);

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
              <label className="font-medium text-muted-foreground text-xs">Pre-configured Rule</label>
              <Select defaultValue="layer-bypass">
                <SelectTrigger id="select-cypher-rules" className="bg-card w-full"><SelectValue placeholder="Select Rule" /></SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="layer-bypass">Layer bypass detection (Controller -{'>'} Repo)</SelectItem>
                  <SelectItem value="cyclic">Cyclic dependencies detected</SelectItem>
                  <SelectItem value="orphan">Orphan methods (Dead Code)</SelectItem>
                </SelectContent>
              </Select>
             </div>
             <div id="panel-rules-editor" className="flex flex-col flex-1 space-y-1.5">
               <LayoutPanel
                 id="panel-cypher-editor"
                 left={<span className="font-medium text-muted-foreground text-xs">Cypher Editor</span>}
                 right={<Button id="btn-execute-cypher" variant="ghost" size="sm" className="px-2 h-6 text-primary"><Play size={12} className="mr-1"/> Execute</Button>}
               />
               <Textarea id="textarea-cypher-editor" className="flex-1 bg-muted/50 border-border font-mono text-foreground text-xs resize-none" defaultValue={"MATCH (c:Controller)-[r:CALLS]->(repo:Repository)\nRETURN c.name, repo.name, type(r)"} />
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
          <div id="panel-fallback" className="space-y-2 p-4 text-xs">
            <div className="mb-1 font-medium text-muted-foreground text-center">Module Showcase Fallback</div>
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
      <div id="ctn-root" className={`flex flex-col h-screen w-screen overflow-hidden font-sans text-sm select-none transition-colors duration-200 bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>

        {/* SECURITY LOCK (Overlay) */}
        {isLocked && (
          <div id="panel-security-lock-overlay" className="z-40 absolute inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm animate-in duration-200 pointer-events-auto fade-in">
            <div id="panel-security-lock-modal" className="bg-card shadow-2xl p-6 border border-border rounded-lg max-w-md text-center duration-200 zoom-in-95">
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
          id="ctn-header"

          className="z-20 bg-card px-3 border-border border-b h-[40px] shrink-0"
          left={
            <>
              <Button id="btn-toggle-sidebar-collapse" variant="ghost" size="icon" onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')} className="w-8 h-8 text-muted-foreground hover:text-foreground">
                <Menu size={16} />
              </Button>
              <Tooltip>
                <TooltipTrigger render={
                  <div id="header-logo" className="flex items-center gap-2 ml-1 text-primary cursor-help">
                    <span className="font-bold text-foreground text-xs tracking-tight">Graph-Impact</span>
                  </div>
                } />
                <TooltipContent side="bottom">Active GraphRAG engine - Real-time topological analysis</TooltipContent>
              </Tooltip>
            </>
          }
          center={
            <div className="relative flex items-center w-full max-w-md">
              <Search className="left-2 absolute text-muted-foreground" size={14} />
              <Input id="input-global-search" type="text" placeholder="Search for an AST entity (e.g., UserController)..." className="bg-muted pl-8 h-8 text-xs" disabled={isLocked} />
            </div>
          }
          right={
            <div className="flex items-center gap-1">
              <button id="btn-import-dialog" onClick={() => setImportOpen(true)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Import"><Upload size={16} /></button>
              <button id="btn-export-dialog" onClick={() => setExportOpen(true)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Export"><Download size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>
              <button id="btn-toggle-theme" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}>
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button id="btn-reset-graphe" onClick={() => { setSelectedIds([]); setExplorerFilter('folder'); if(cyRef.current) cyRef.current.fit(); }} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Reset"><RotateCcw size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>
              <button id="btn-toggle-main" onClick={() => setIsCtnWorkspaceVisible(!isCtnWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-main-header" onClick={() => setIsCtnWorkspaceTopVisible(!isCtnWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceTopVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-main-left" onClick={() => setIsCtnWorkspaceLeftVisible(!isCtnWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceLeftVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-main-center" onClick={() => setIsCtnWorkspaceCenterVisible(!isCtnWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceCenterVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-workspace-right" onClick={() => setIsCtnWorkspaceRightVisible(!isCtnWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <button id="btn-toggle-workspace-bottom" onClick={() => setIsCtnWorkspaceBottomVisible(!isCtnWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceBottomVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground'}`}><Eye size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>
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
        <div id="ctn-main" className="relative flex flex-1 overflow-hidden">

          {/* B. SIDEBAR */}
          {sidebarLeftMode !== 'collapsed' && (
            <Sidebar id="ctn-sidebar-left" width={sidebarLeftMode === 'minimal' ? '56px' : `${sidebarLeftWidth}px`}>
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
                <div id="ctn-sidebar-left-handle" className="group top-0 right-0 bottom-0 z-20 absolute hover:bg-sidebar-border w-1 cursor-col-resize" onMouseDown={startSidebarLeftResize}>
                   <div className="top-1/2 right-[1px] absolute bg-sidebar-border rounded-full w-[2px] h-8 -translate-y-1/2"></div>
                </div>
              )}
            </Sidebar>
          )}

          {/* C. CENTRAL WORKSPACE STAGE */}
          <div id="ctn-workspace" style={{ display: isCtnWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-background min-w-0">
            <div id="ctn-workspace-wrapper-lvl-1" className="relative flex flex-col flex-1 min-w-0">

              {/* TOP COLLAPSIBLE CONTAINER */}
              <ResizableContainer
                id="ctn-workspace-top"
                visible={isCtnWorkspaceTopVisible}
                style={{ height: `${ctnWorkspaceTopHeight}px` }}
                headerLeft="Selected paths"
                resizeHandle="bottom"
                onResizeStart={startCtnWorkspaceTopResize}
                className="bg-muted border-b"
              >
                <div className="px-1">
                  <ul id="paths-list" className="space-y-0.5 p-1 text-muted-foreground">
                    <li className="flex items-center gap-2"><Folder size={14} /> <span>workspace/src/main/java</span></li>
                    <li className="flex items-center gap-2"><File size={14} /> <span>workspace/src/main/resources/application.properties</span></li>
                    <li className="flex items-center gap-2"><Folder size={14} /> <span>workspace//src/main/resources/templates</span></li>
                  </ul>
                </div>
              </ResizableContainer>

              {/* MIDDLE LAYOUT TIER SPLITS */}
              <div id="ctn-workspace-middle-row" className="flex flex-1 min-h-0 overflow-hidden">

                {/* LEFT TIER CONTAINER */}
                <ResizableContainer
                  id="ctn-workspace-left"
                  visible={isCtnWorkspaceLeftVisible}
                  style={{ width: `${mainLeftWidth}%` }}
                  headerLeft={getActiveViewLabel()}
                  className="border-r min-w-[200px]"
                  resizeHandle="right"
                  onResizeStart={startmainLeftResize}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex-1 overflow-auto scrollbar-hide">
                      {renderViewContent()}
                    </div>
                    <ResizableContainer
                      id="panel-logs"
                      headerLeft="Parser Logs"
                      className="border-t border-r-0 border-b-0 border-l-0 h-[140px]"
                      resizeHandle="top"
                    >
                      <div className="space-y-1 p-2 font-mono text-[11px] text-muted-foreground">
                        <div><span className="text-primary">[INFO]</span> AST Parser initiated on 3 files.</div>
                        <div><span className="text-primary">[INFO]</span> Topological graph built: 18 nodes.</div>
                      </div>
                    </ResizableContainer>
                  </div>
                </ResizableContainer>

                {/* CENTER CORE CANVAS CONTAINER */}
                <ResizableContainer
                  id="ctn-workspace-center"
                  visible={isCtnWorkspaceCenterVisible || isGraphMaximized}
                  style={isGraphMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : { flex: 1 }}
                  headerLeft="Topological Graph"
                  headerRight={
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground" onClick={() => cyRef.current?.zoom(cyRef.current.zoom() + 0.1)}><Plus size={12}/></Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground" onClick={() => cyRef.current?.zoom(cyRef.current.zoom() - 0.1)}><Minus size={12}/></Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground" onClick={() => cyRef.current?.fit()}><Shrink size={12}/></Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground" onClick={() => { setIsGraphMaximized(!isGraphMaximized); setTimeout(() => { cyRef.current?.resize(); cyRef.current?.fit(); }, 50); }}>
                        {isGraphMaximized ? <Minimize size={12}/> : <Maximize size={12}/>}
                      </Button>
                    </div>
                  }
                  className="bg-background"
                >
                  <div id="panel-graph-canvas" ref={graphContainerRef} className="absolute inset-0 outline-none w-full h-full"></div>
                  {isLocked && <div id="ctn-workspace-center-locked-overlay" className="z-20 absolute inset-0 bg-background/40 pointer-events-none"></div>}
                </ResizableContainer>

                {/* RIGHT TIER CONTAINER */}
                <ResizableContainer
                  id="ctn-workspace-right"
                  visible={isCtnWorkspaceRightVisible}
                  style={{ width: !isCtnWorkspaceCenterVisible ? '100%' : `${mainRightWidth}%` }}
                  headerLeft="Workspace Right title"
                  className={!isCtnWorkspaceCenterVisible ? 'flex-1 border-l min-w-[200px]' : 'border-l min-w-[200px]'}
                  resizeHandle={isCtnWorkspaceCenterVisible ? "left" : "none"}
                  onResizeStart={isCtnWorkspaceCenterVisible ? startmainRightResize : undefined}
                >
                  <div className="p-4 text-muted-foreground text-xs">
                    Not used at this moment
                  </div>
                </ResizableContainer>

              </div>

              {/* BOTTOM HORIZONTAL TIER CONTAINER */}
              <ResizableContainer
                id="ctn-workspace-bottom"
                visible={isCtnWorkspaceBottomVisible}
                style={{ height: `${ctnWorkspaceBottomHeight}px` }}
                className="bg-secondary border-t"
                resizeHandle="top"
                onResizeStart={startCtnWorkspaceBottomResize}
              >
                <LayoutPanel
                   id="panel-workspace-bottom"
                   className="px-4 h-full font-medium text-muted-foreground text-xs"
                   left={"Wksp Bottom Left"}
                   center={"Wksp Bottom Center"}
                   right={"Wksp Bottom Right"}
                />
              </ResizableContainer>

            </div>
          </div>

          {/* D. RIGHT SIDEBAR INSPECTOR */}
          <ResizableContainer
            id="ctn-sidebar-right"
            visible={isSidebarRightVisible}
            style={{ width: `${sidebarRightWidth}px` }}
            headerLeft={<><Database size={13} className="mr-1.5"/> <span>Inspector</span></>}
            headerRight={<Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setSelectedIds([])}><X size={12}/></Button>}
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
                    <Card className="bg-muted shadow-none p-0 border-border rounded-md">
                        <CardContent className="p-3 text-center">
                            <div className="font-bold text-primary text-xl">{selectedIds.length}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Nodes Selected
                            </div>
                        </CardContent>
                    </Card>
                  {selectedIds.map(id => {
                    const node = AST_DATA.nodes.find(n => n.data.id === id);
                    if(!node) return null;
                    return (
                          <Card key={id} className="gap-0 bg-background shadow-none p-0 rounded-md overflow-hidden" >
                              <CardHeader className="flex flex-row justify-between items-center space-y-0 bg-secondary px-2.5 py-1.5 border-b rounded-t-md" style={{ paddingBottom: '6px' }}>
                          <span className="font-semibold text-foreground">{node.data.label}</span>
                                  <span className="bg-primary/10 px-1 py-0.5 border border-primary/20 rounded font-bold text-[9px] text-primary uppercase">
                                  {node.data.layer}
                                  </span>
                              </CardHeader>

                              <CardContent className="space-y-1 p-1 pt-1 text-[11px] text-muted-foreground">
                                  <div className="flex justify-between">
                                  <span>Parent:</span>
                                  <span className="text-foreground">{node.data.parent || 'N/A'}</span>
                        </div>
                                  <div className="flex justify-between">
                                  <span>Incoming:</span>
                                  <span className="font-bold text-destructive-foreground">
                                      {AST_DATA.edges.filter(e => e.data.target === id).length}
                                  </span>
                        </div>
                                  <div className="flex justify-between">
                                  <span>Outgoing:</span>
                                  <span className="font-bold text-primary">
                                      {AST_DATA.edges.filter(e => e.data.source === id).length}
                                  </span>
                      </div>
                              </CardContent>
                          </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </ResizableContainer>

        </div>

        {/* E. FIXED FOOTER */}
        <LayoutPanel
          id="ctn-footer"
          className="z-20 bg-primary px-3 h-[35px] text-primary-foreground text-xs select-none shrink-0"
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

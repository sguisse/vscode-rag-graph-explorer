import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Network, Search, Download, Upload, Moon, Sun, RotateCcw, EyeOff, Eye,
  ChevronRight, ChevronLeft, LayoutDashboard, FolderTree, Scale, Terminal,
  History, HelpCircle, FileJson, Server, Database, ShieldAlert, Play,
  Minus, Plus, Focus, X, CheckCircle2, XCircle, CircleArrowRight,
  Shrink, Maximize, Minimize, Menu, Settings
} from 'lucide-react';

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
  { selector: 'node', style: { 'background-color': isDark ? '#27272a' : '#ffffff', 'color': isDark ? '#e4e4e7' : '#27272a', 'label': 'data(label)', 'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', 'font-size': '12px', 'text-valign': 'center', 'text-halign': 'center', 'border-width': 1, 'border-color': isDark ? '#3f3f46' : '#d4d4d8', 'shape': 'round-rectangle', 'width': 'label', 'height': 'label', 'padding': '10px' } },

  { selector: ':parent', style: {
      'background-color': isDark ? '#18181b' : '#f4f4f5',
      'background-opacity': 0.8,
      'border-width': 1,
      'border-color': isDark ? '#3f3f46' : '#d4d4d8',
      'border-style': 'solid',
      'text-valign': 'top',
      'text-halign': 'center',
      'text-margin-y': -8,
      'color': isDark ? '#e4e4e7' : '#3f3f46',
      'font-size': '12px',
      'font-weight': 'bold',
      'padding': '16px'
  } },

  { selector: 'edge', style: { 'width': 1.5, 'line-color': isDark ? '#3f3f46' : '#a1a1aa', 'target-arrow-color': isDark ? '#3f3f46' : '#a1a1aa', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'arrow-scale': 1.2 } },

  // Selection states
  { selector: 'node.selected', style: { 'background-color': isDark ? '#93c5fd' : '#bfdbfe', 'color': isDark ? '#172554' : '#1e3a8a', 'border-color': isDark ? '#2563eb' : '#3b82f6', 'border-width': 2, 'z-index': 10 } },
  { selector: 'node.caller', style: { 'background-color': isDark ? '#f87171' : '#fecaca', 'color': isDark ? '#450a0a' : '#7f1d1d', 'border-color': isDark ? '#dc2626' : '#ef4444', 'border-width': 2 } },
  { selector: 'node.callee', style: { 'background-color': isDark ? '#fb923c' : '#fed7aa', 'color': isDark ? '#431407' : '#7c2d12', 'border-color': isDark ? '#ea580c' : '#f97316', 'border-width': 2 } },
  { selector: 'edge.caller-edge', style: { 'line-color': isDark ? '#f87171' : '#ef4444', 'target-arrow-color': isDark ? '#f87171' : '#ef4444', 'width': 2 } },
  { selector: 'edge.callee-edge', style: { 'line-color': isDark ? '#fb923c' : '#f97316', 'target-arrow-color': isDark ? '#fb923c' : '#f97316', 'width': 2 } },

  // Layer colors
  { selector: 'node.layer-colored[layer="controller"]', style: { 'background-color': '#3b82f6', 'color': '#ffffff', 'border-color': '#1d4ed8' } },
  { selector: 'node.layer-colored[layer="service"]', style: { 'background-color': '#8b5cf6', 'color': '#ffffff', 'border-color': '#6d28d9' } },
  { selector: 'node.layer-colored[layer="repository"]', style: { 'background-color': '#10b981', 'color': '#ffffff', 'border-color': '#047857' } },
  { selector: 'node.layer-colored[layer="database"]', style: { 'background-color': '#eab308', 'color': '#000000', 'border-color': '#a16207' } },

  { selector: ':parent.layer-colored[layer]', style: {
      'color': isDark ? '#e4e4e7' : '#3f3f46',
      'background-opacity': 0.15
  } },
];

// ==========================================
// 3. UTILITY HOOKS (Resizing)
// ==========================================
const useResizable = (initialSize: number, minSize: number, maxSize: number, isHorizontal: boolean = true, reverse: boolean = false) => {
  const [size, setSize] = useState(initialSize);
  const sizeRef = useRef(size);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

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
// 4. UI COMPONENTS
// ==========================================
const Tooltip = ({ children, content }: { children: React.ReactNode, content: React.ReactNode }) => (
  <div className="group relative flex justify-center items-center">
    {children}
    <div className="hidden group-hover:block top-full z-50 absolute bg-zinc-800 shadow-lg mt-2 px-2 py-1 border border-zinc-700 rounded text-zinc-100 text-xs whitespace-nowrap">
      {content}
    </div>
  </div>
);

const Dialog = ({ id, isOpen, onClose, title, children }: { id?: string, isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div id={id} className="z-50 fixed inset-0 flex justify-center items-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
      <div id={`${id}-panel`} className="flex flex-col bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200 dark:border-zinc-800 rounded-lg w-[400px] overflow-hidden">
        <div id={`${id}-header`} className="flex justify-between items-center p-4 border-zinc-200 dark:border-zinc-800 border-b">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{title}</h2>
          <button id={`btn-${id}-close`} onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"><X size={16} /></button>
        </div>
        <div id={`${id}-content`} className="p-4 text-zinc-700 dark:text-zinc-300 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. SIDEBAR MENU CONFIGURATION
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
// 6. MAIN APPLICATION
// ==========================================
export default function App() {
  // --- GLOBAL STATES ---
  const [cyLoaded, setCyLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('panel-welcome');
  const [sidebarLeftMode, setSidebarLeftMode] = useState('normal');

  // Visibility states
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
  const [ctnAppWorkspaceBottomHeight, startCtnAppWorkspaceBottomResize] = useResizable(100, 30, 400, false, true);
  const [sidebarRightWidth, startSidebarRightResize] = useResizable(300, 180, 600, true, true);

  // --- DATA & SELECTION STATES ---
  const cyRef = useRef(null);
  const graphContainerRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [impacts, setImpacts] = useState({ callers: [], callees: [], edges: [] });

  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // --- CYTOSCAPE LOADING ---
  useEffect(() => {
    if (window.cytoscape) { setCyLoaded(true); return; }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js";
    script.async = true;
    script.onload = () => setCyLoaded(true);
    document.body.appendChild(script);
  }, []);

  // --- IMPACT CALCULATION ---
  useEffect(() => {
    if (!selectedIds.length) {
      setImpacts({ callers: [], callees: [], edges: [] });
      return;
    }

    const callers = new Set();
    const callees = new Set();
    const impactEdges = new Set();

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

    setImpacts({
      callers: Array.from(callers),
      callees: Array.from(callees),
      edges: Array.from(impactEdges)
    });
  }, [selectedIds]);

  // --- CYTOSCAPE INITIALIZATION & SYNCHRONIZATION ---
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

        setSelectedIds(prev => {
          if (isMulti) {
            return prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
          }
          return [id];
        });
      });

      cyRef.current.on('tap', (evt) => {
        if (evt.target === cyRef.current) setSelectedIds([]);
      });
    } else {
      cyRef.current.style(getCyStyles(isDarkMode));
    }

    const cy = cyRef.current;
    cy.batch(() => {
      cy.elements().removeClass('selected caller callee layer-colored caller-edge callee-edge');

      if (explorerFilter === 'layer') {
        cy.nodes().addClass('layer-colored');
      }

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

  // --- SPECIFIC TAB VIEWS (Displayed in main-left) ---
  const renderViewContent = () => {
    switch(activeView) {
      case 'panel-welcome':
        return (
          <div id="panel-welcome" className="space-y-6 p-4">
            <div id="panel-welcome-header">
              <h2 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
                <ShieldAlert className="text-blue-600 dark:text-blue-500" size={18} /> Installation Diagnostics
              </h2>
              <p className="mt-1 text-zinc-500 text-xs">Verifying the integrity of the local environment.</p>
            </div>

            <div id="panel-security-breaker" className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 rounded-md">
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-200 text-sm">Security Breaker</span>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">Simulate a connection loss with the graph database.</p>
              </div>
              <label className="inline-flex relative items-center cursor-pointer">
                <input id="checkbox-security-breaker" type="checkbox" className="sr-only peer" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
                <div className="peer after:top-[2px] after:left-[2px] after:absolute bg-zinc-300 after:bg-white dark:bg-zinc-700 peer-checked:bg-red-500 after:border after:border-zinc-300 dark:after:border-zinc-500 peer-checked:after:border-white rounded-full after:rounded-full peer-focus:outline-none w-9 after:w-4 h-5 after:h-4 after:content-[''] after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            <div id="panel-diagnostic-grid" className="gap-2 grid grid-cols-2 text-xs">
              {['Node.js v20', 'Dependency Cruiser', 'SWC Parser', 'Python 3.11', 'jQAssistant', 'Neo4j Community v5'].map((check, i) => {
                const isNeo4j = check.includes('Neo4j') || check.includes('jQAssistant');
                const isFail = isLocked && isNeo4j;
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded border ${isFail ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300'}`}>
                    {isFail ? <XCircle size={14} /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                    <span>{check}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'panel-explorer':
        return (
          <div id="panel-explorer" className="flex flex-col h-full">
            <div id="panel-explorer-filters" className="flex gap-1 bg-zinc-50 dark:bg-zinc-900 p-2 border-zinc-200 dark:border-zinc-800 border-b">
              {['folder', 'ext', 'layer', 'list'].map(f => (
                <button
                  key={f}
                  id={`btn-filter-${f}`}
                  onClick={() => setExplorerFilter(f)}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${explorerFilter === f ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div id="panel-explorer-list" className="flex-1 space-y-1 p-2 overflow-y-auto">
              {AST_DATA.nodes.filter(n => n.data.type !== 'class').map(node => (
                <div
                  key={node.data.id}
                  id={`item-explorer-${node.data.id}`}
                  onClick={(e) => {
                    const isMulti = e.ctrlKey || e.metaKey;
                    setSelectedIds(prev => isMulti ? (prev.includes(node.data.id) ? prev.filter(id => id !== node.data.id) : [...prev, node.data.id]) : [node.data.id]);
                  }}
                  className={`flex items-center gap-2 p-1.5 text-xs rounded cursor-pointer border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700
                    ${selectedIds.includes(node.data.id) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50' : 'text-zinc-600 dark:text-zinc-400'}`}
                >
                  <FileJson size={14} className={explorerFilter === 'layer' ?
                    (node.data.layer === 'controller' ? 'text-blue-600 dark:text-blue-500' : node.data.layer === 'service' ? 'text-purple-600 dark:text-purple-500' : node.data.layer === 'repository' ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500')
                    : 'text-zinc-400 dark:text-zinc-500'} />
                  <span className="truncate">{node.data.parent}.{node.data.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'panel-rules':
        return (
          <div id="panel-rules" className="flex flex-col gap-4 p-4 h-full">
             <div id="panel-rules-selector" className="space-y-1">
              <label className="text-zinc-600 dark:text-zinc-500 text-xs">Pre-configured Rule</label>
              <select id="select-cypher-rules" className="bg-white dark:bg-zinc-900 p-2 border border-zinc-300 focus:border-blue-500 dark:border-zinc-700 rounded outline-none focus:ring-1 focus:ring-blue-500 w-full text-zinc-900 dark:text-zinc-200 text-sm">
                <option>Layer bypass detection (Controller -{'>'} Repo)</option>
                <option>Cyclic dependencies detected</option>
                <option>Orphan methods (Dead Code)</option>
              </select>
             </div>
             <div id="panel-rules-editor" className="flex flex-col flex-1 space-y-1">
               <label className="flex justify-between items-center text-zinc-600 dark:text-zinc-500 text-xs">
                 <span>Cypher Editor</span>
                 <button id="btn-execute-cypher" className="flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:hover:text-blue-300 dark:text-blue-400 cursor-pointer">
                   <Play size={12}/> Execute
                 </button>
               </label>
               <textarea
                  id="textarea-cypher-editor"
                  className="flex-1 bg-zinc-50 dark:bg-[#1e1e1e] p-3 border border-zinc-200 focus:border-blue-500 dark:border-zinc-800 rounded outline-none w-full font-mono text-emerald-700 dark:text-emerald-400 text-xs resize-none"
                  defaultValue={"MATCH (c:Controller)-[r:CALLS]->(repo:Repository)\nRETURN c.name, repo.name, type(r)"}
               />
             </div>
          </div>
        );

      case 'panel-help':
        return (
          <div id="panel-help" className="space-y-4 p-4 text-zinc-600 dark:text-zinc-400 text-xs">
             <img src={isDarkMode ? '/favicon.png' : '/favicon.png'} alt="Graph-Impact Logo" className="w-20 h-20" />
            <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-200">Navigation Guide</h3>
            <p>Use <kbd className="bg-zinc-200 dark:bg-zinc-800 px-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-800 dark:text-zinc-200">Ctrl</kbd> or <kbd className="bg-zinc-200 dark:bg-zinc-800 px-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-800 dark:text-zinc-200">Cmd</kbd> + Click on the explorer or graph to enable multiple selection.</p>
            <div id="panel-help-legend" className="space-y-2 mt-4 pt-4 border-zinc-200 dark:border-zinc-800 border-t">
              <p className="font-semibold text-zinc-900 dark:text-zinc-300">Impact Legend</p>
              <div className="flex items-center gap-2"><div className="bg-[#bfdbfe] dark:bg-[#93c5fd] border border-[#3b82f6] dark:border-[#2563eb] rounded w-3 h-3"></div> Selected source</div>
              <div className="flex items-center gap-2"><div className="bg-[#fecaca] dark:bg-[#f87171] border border-[#ef4444] dark:border-[#dc2626] rounded w-3 h-3"></div> Callers (Upstream)</div>
              <div className="flex items-center gap-2"><div className="bg-[#fed7aa] dark:bg-[#fb923c] border border-[#f97316] dark:border-[#ea580c] rounded w-3 h-3"></div> Callees (Downstream)</div>
            </div>
          </div>
        );

      default:
        return <div id="panel-fallback" className="p-4 text-zinc-500 text-sm text-center">Module under construction...</div>;
    }
  };

  const getActiveViewLabel = () => SIDEBAR_MENU_ITEMS.find(i => i.id === activeView)?.label || 'Detailed Overview';

  // --- RENDER MENU ITEMS ---
  const renderSidebarMenuItem = (item) => (
    <button
      key={item.id}
      id={`btn-menu-${item.id}`}
      onClick={() => setActiveView(item.id)}
      className={`flex items-center px-3 py-2.5 rounded-md transition-colors whitespace-nowrap group ${activeView === item.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50'}`}
      title={sidebarLeftMode === 'minimal' ? item.label : undefined}
    >
      <item.icon size={20} className="shrink-0" />

      {sidebarLeftMode === 'normal' && (
        <>
          <span className="ml-3 font-medium text-sm">{item.label}</span>
          {item.badge && (
            <span className="bg-blue-100 dark:bg-blue-900/50 ml-auto px-2 py-0.5 rounded-full font-bold text-[10px] text-blue-700 dark:text-blue-300">
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );

  // --- RENDER ---
  return (
    <div id="ctn-app-root" className={`flex flex-col h-screen w-screen overflow-hidden font-mono text-sm select-none transition-colors duration-200 ${isDarkMode ? 'dark bg-zinc-950 text-zinc-300' : 'bg-zinc-50 text-zinc-800'}`}>

      {/* SECURITY LOCK (Overlay) */}
      {isLocked && (
        <div id="panel-security-lock-overlay" className="z-40 absolute inset-0 flex justify-center items-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm pointer-events-auto">
          <div id="panel-security-lock-modal" className="bg-red-50 dark:bg-red-950/50 shadow-2xl p-6 border border-red-200 dark:border-red-900 rounded-lg max-w-md text-center">
            <ShieldAlert className="mx-auto mb-4 text-red-600 dark:text-red-500" size={48} />
            <h2 className="mb-2 font-bold text-red-700 dark:text-red-400 text-lg">Sandbox locked</h2>
            <p className="mb-4 text-red-600/80 dark:text-red-200/70 text-xs">Connection to the local Neo4j cluster was interrupted. Analysis modules are suspended for safety.</p>
            <button id="btn-restore-connection" onClick={() => setIsLocked(false)} className="bg-red-600 hover:bg-red-700 dark:bg-red-900/50 dark:hover:bg-red-800 px-4 py-2 border border-red-700 rounded text-white dark:text-red-200 text-xs transition-colors">
              Restore connection
            </button>
          </div>
        </div>
      )}

      {/* A. FIXED HEADER (header) */}
      <div id="ctn-app-header" className="z-20 flex justify-between items-center bg-white dark:bg-[#18181b] px-3 border-zinc-200 dark:border-zinc-800 border-b h-[40px] shrink-0">
        <div id="panel-app-header-left" className="flex items-center gap-3">
          {/* Toggle Button Hamburger */}
          <button
            id="btn-toggle-sidebar-collapse"
            onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')}
            className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="Toggle Main Menu"
          >
            <Menu size={18} />
          </button>

          <Tooltip content="Active GraphRAG engine - Real-time topological analysis">
            <div id="header-logo" className="flex items-center gap-2 text-blue-600 dark:text-blue-500 cursor-help">
              <img src={isDarkMode ? '/favicon.png' : '/favicon.png'} alt="Graph-Impact Logo" className="w-5 h-5" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Graph-Impact</span>
            </div>
          </Tooltip>
        </div>

        <div id="panel-app-header-center" className="flex-1 mx-4 max-w-md">
          <div className="relative flex items-center w-full">
            <Search className="left-2 absolute text-zinc-400 dark:text-zinc-500" size={14} />
            <input
              id="input-global-search"
              type="text"
              placeholder="Search for an AST entity (e.g., UserController)..."
              className="bg-zinc-50 dark:bg-zinc-900 py-1 pr-3 pl-8 border border-zinc-200 focus:border-blue-500 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-zinc-900 dark:placeholder:text-zinc-600 dark:text-zinc-200 placeholder:text-zinc-500 text-xs transition-all"
              disabled={isLocked}
            />
          </div>
        </div>

        <div id="panel-app-header-right" className="flex items-center gap-1">
          <button id="btn-import-dialog" onClick={() => setImportOpen(true)} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" title="Import"><Upload size={16} /></button>
          <button id="btn-export-dialog" onClick={() => setExportOpen(true)} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" title="Export"><Download size={16} /></button>
          <div className="bg-zinc-300 dark:bg-zinc-700 mx-1 w-px h-4"></div>

          <button id="btn-toggle-theme" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button id="btn-reset-graphe" onClick={() => { setSelectedIds([]); setExplorerFilter('folder'); if(cyRef.current) cyRef.current.fit(); }} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" title="Reset"><RotateCcw size={16} /></button>

           <div className="bg-zinc-300 dark:bg-zinc-700 mx-1 w-px h-4"></div>

          <button id="btn-toggle-main" onClick={() => setIsCtnAppWorkspaceVisible(!isCtnAppWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 ${!isCtnAppWorkspaceVisible ? 'text-zinc-400 dark:text-zinc-500' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`} title="Toggle Full Main">
             {isCtnAppWorkspaceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button id="btn-toggle-main-header" onClick={() => setIsCtnAppWorkspaceTopVisible(!isCtnAppWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 ${!isCtnAppWorkspaceTopVisible ? 'text-zinc-400 dark:text-zinc-500' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`} title="Toggle File Header">
             {isCtnAppWorkspaceTopVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button id="btn-toggle-main-left" onClick={() => setIsCtnAppWorkspaceLeftVisible(!isCtnAppWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 ${!isCtnAppWorkspaceLeftVisible ? 'text-zinc-400 dark:text-zinc-500' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`} title="Toggle Main Content">
             {isCtnAppWorkspaceLeftVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button id="btn-toggle-main-center" onClick={() => setIsCtnAppWorkspaceCenterVisible(!isCtnAppWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 ${!isCtnAppWorkspaceCenterVisible ? 'text-zinc-400 dark:text-zinc-500' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`} title="Toggle Graph">
             {isCtnAppWorkspaceCenterVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button id="btn-toggle-workspace-right" onClick={() => setIsCtnAppWorkspaceRightVisible(!isCtnAppWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${!isCtnAppWorkspaceRightVisible ? 'text-zinc-400 dark:text-zinc-500' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`} title="Toggle Workspace Right">
             {isCtnAppWorkspaceRightVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button id="btn-toggle-workspace-bottom" onClick={() => setIsCtnAppWorkspaceBottomVisible(!isCtnAppWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 ${!isCtnAppWorkspaceBottomVisible ? 'text-zinc-400 dark:text-zinc-500' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`} title="Toggle Workspace Bottom">
             {isCtnAppWorkspaceBottomVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
           <div className="bg-zinc-300 dark:bg-zinc-700 mx-1 w-px h-4"></div>
          <button id="btn-toggle-main-right" onClick={() => setIsSidebarRightVisible(!isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${!isSidebarRightVisible ? 'text-zinc-400 dark:text-zinc-500' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`} title="Toggle Inspector (Detail)">
             {isSidebarRightVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      {/* IMPORT/EXPORT MODALS */}
      <Dialog id="modal-import" isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import AST Graph">
        <p className="mb-4">Select a JSON file generated by the SWC extractor.</p>
        <button id="btn-import-browse" className="bg-blue-600 hover:bg-blue-500 py-2 rounded w-full text-white text-xs transition-colors">Browse...</button>
      </Dialog>
      <Dialog id="modal-export" isOpen={exportOpen} onClose={() => setExportOpen(false)} title="Export Topology">
        <p className="mb-4">Exporting metadata and current adjacency matrix.</p>
        <div id="panel-export-actions" className="flex gap-2">
          <button id="btn-export-json" className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-white text-xs transition-colors">JSON</button>
          <button id="btn-export-cypher" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded text-white text-xs transition-colors">Cypher DDL</button>
        </div>
      </Dialog>

      {/* MAIN (main) */}
      <div id="ctn-app-main" className="relative flex flex-1 overflow-hidden">

        {/* B. SIDEBAR (Classic navigation sidebar) */}
        {sidebarLeftMode !== 'collapsed' && (
          <div
            id="ctn-app-sidebar-left"
            style={{ width: sidebarLeftMode === 'minimal' ? '64px' : `${sidebarLeftWidth}px` }}
            className="z-10 relative flex flex-col bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 border-r h-full transition-all duration-200 ease-in-out shrink-0"
          >
            {/* Menu list */}
            <div id="panel-app-sidebar-left-top" className="flex flex-col flex-1 gap-1 px-2 py-3 overflow-x-hidden overflow-y-auto">
              {/* Top elements */}
              {SIDEBAR_MENU_ITEMS.filter(item => !item.bottom).map(renderSidebarMenuItem)}

              {/* Bottom elements (grouped) */}
              <div className="flex flex-col gap-1 mt-auto pt-2 border-zinc-200 dark:border-zinc-800 border-t">
                {SIDEBAR_MENU_ITEMS.filter(item => item.bottom).map(renderSidebarMenuItem)}
              </div>
            </div>

            {/* Minimal/normal toggle button */}
            <div id="panel-app-sidebar-left-bottom" className="flex p-2 border-zinc-200 dark:border-zinc-800 border-t">
              <button
                id="btn-sidebar-toggle-mode"
                onClick={() => setSidebarLeftMode(m => m === 'normal' ? 'minimal' : 'normal')}
                className={`w-full flex p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${sidebarLeftMode === 'normal' ? 'justify-end' : 'justify-center'}`}
              >
                {sidebarLeftMode === 'normal' ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}
              </button>
            </div>

            {/* Sidebar resize handle */}
            {sidebarLeftMode === 'normal' && (
              <div
                id="ctn-app-sidebar-left-handle"
                className="group top-0 right-0 bottom-0 z-20 absolute hover:bg-blue-500/50 w-1 cursor-col-resize"
                onMouseDown={startSidebarLeftResize}
              >
                 <div className="top-1/2 right-[1px] absolute bg-zinc-300 dark:bg-zinc-700 dark:group-hover:bg-blue-400 group-hover:bg-blue-500 rounded-full w-[2px] h-8 -translate-y-1/2"></div>
              </div>
            )}
          </div>
        )}

        {/* C. CENTRAL STAGE (Main Stage) */}
        <div id="ctn-app-workspace" style={{ display: isCtnAppWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-white dark:bg-zinc-950 min-w-0">

          {/* (Top + Content + Graph + bottom) */}
          <div id="ctn-app-workspace-wrapper-lvl-1" className="relative flex flex-col flex-1 min-w-0">

            {/* Main Header (Open files - ListFiles) - Collapsible */}
            <div
              id="ctn-app-workspace-top"
              style={{
                height: `${ctnAppWorkspaceTopHeight}px`,
                display: isCtnAppWorkspaceTopVisible ? 'flex' : 'none'
              }}
              className="relative flex-col bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 border-b w-full shrink-0"
            >
              <div id="ctn-app-workspace-top-title-bar" className="flex justify-between items-center bg-zinc-100 dark:bg-[#18181b] px-3 border-zinc-200 dark:border-zinc-800/50 border-b h-8 font-semibold text-zinc-600 dark:text-zinc-300 text-xs uppercase tracking-wider shrink-0">
                <div id="ctn-app-workspace-top-title-bar-left" className="flex items-center gap-2">Selected files</div>
                <div id="ctn-app-workspace-top-title-bar-center" className="flex-1"></div>
                <div id="ctn-app-workspace-top-title-bar-right" className="flex items-center gap-2"></div>
              </div>

              <div id="ctn-app-workspace-top-content" className="flex-1 space-y-2 p-4 w-full overflow-y-auto">
                <ul id="files-list" className="space-y-3 text-zinc-700 dark:text-zinc-300 text-sm">
                  <li className="flex items-center gap-2">
                    <CircleArrowRight size={18} className="text-zinc-400 dark:text-zinc-500" />
                    <p>zz-tmp/temp-01.txt</p>
                  </li>
                  <li className="flex items-center gap-2">
                    <CircleArrowRight size={18} className="text-zinc-400 dark:text-zinc-500" />
                    <p>zz-tmp/temp-02.txt</p>
                  </li>
                  <li className="flex items-center gap-2">
                    <CircleArrowRight size={18} className="text-zinc-400 dark:text-zinc-500" />
                    <p>zz-tmp/temp-03.txt</p>
                  </li>
                </ul>
              </div>

              {/* Container Workspace top resize handle */}
              <div
                id="ctn-app-workspace-top-handle"
                className="right-0 bottom-0 left-0 z-10 absolute hover:bg-blue-500/50 h-1 cursor-row-resize"
                onMouseDown={startCtnAppWorkspaceTopResize}
              ></div>
            </div>

            {/* Middle row container for Left, Center, Right split layouts */}
            <div id="ctn-app-workspace-middle-row" className="flex flex-1 min-h-0 overflow-hidden">

              {/* Main Left (Tabs panel) -> Toggle via toggle-main-left */}
              <div
                id="ctn-app-workspace-left"
                style={{
                  display: isCtnAppWorkspaceLeftVisible ? 'flex' : 'none',
                  width: `${mainLeftWidth}%`
                }}
                className="relative flex flex-col bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 border-r min-w-[200px] overflow-hidden shrink-0"
              >
                 <div id="ctn-app-workspace-left-title-bar" className="flex justify-between items-center bg-zinc-100 dark:bg-[#18181b] px-3 border-zinc-200 dark:border-zinc-800/50 border-b h-8 font-semibold text-zinc-600 dark:text-zinc-300 text-xs uppercase tracking-wider shrink-0">
                    <div id="ctn-app-workspace-left-title-left" className="flex items-center gap-2">{getActiveViewLabel()}</div>
                    <div id="ctn-app-workspace-left-title-center" className="flex-1"></div>
                    <div id="ctn-app-workspace-left-title-right" className="flex items-center gap-2"></div>
                 </div>

                 <div id="ctn-app-workspace-left-content" className="flex-1 overflow-auto">
                    {renderViewContent()}
                 </div>

                 {/* Logs sub-panel */}
                 <div id="panel-logs" className="flex flex-col bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 border-t h-[150px] shrink-0">
                    <div id="panel-logs-title-bar" className="flex items-center gap-4 bg-zinc-100 dark:bg-[#1e1e1e] px-3 border-zinc-200 dark:border-zinc-800 border-b h-7 text-[10px] text-zinc-500 uppercase tracking-widest">
                      <span className="flex items-center border-blue-600 dark:border-blue-500 border-b h-full text-blue-600 dark:text-blue-400">Parser Logs</span>
                      <span className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer">Cypher Output</span>
                    </div>
                    <div id="panel-logs-content" className="flex-1 space-y-1 bg-white dark:bg-zinc-950 p-2 overflow-auto font-mono text-zinc-600 dark:text-zinc-400 text-xs">
                      <div><span className="text-emerald-600 dark:text-emerald-500">[INFO]</span> AST Parser initiated on 3 files.</div>
                      <div><span className="text-emerald-600 dark:text-emerald-500">[INFO]</span> Topological graph built: 18 nodes, 16 edges.</div>
                      {impacts.callers.length > 0 && <div><span className="text-amber-600 dark:text-amber-500">[WARN]</span> Warning: {impacts.callers.length} callers potentially impacted by selection.</div>}
                    </div>
                 </div>

                 {/* Main Left horizontal handle */}
                 <div
                    id="ctn-app-workspace-left-handle"
                    className="top-0 right-0 bottom-0 z-10 absolute hover:bg-blue-500/50 w-1 cursor-col-resize"
                    onMouseDown={startmainLeftResize}
                  ></div>
              </div>

              {/* Main Center -> Toggle via toggle-main-center */}
              <div
                id="ctn-app-workspace-center"
                style={{
                  display: isCtnAppWorkspaceCenterVisible || isGraphMaximized ? 'flex' : 'none',
                  ...(isGraphMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : {})
                }}
                className={`relative bg-zinc-50 dark:bg-[#0a0a0b] overflow-hidden flex flex-col ${!isGraphMaximized ? 'flex-1' : ''}`}
              >
                <div id="ctn-app-workspace-center-top-bar" className="z-10 relative flex justify-between items-center bg-zinc-100 dark:bg-[#18181b] px-3 border-zinc-200 dark:border-zinc-800/50 border-b h-8 font-semibold text-zinc-600 dark:text-zinc-300 text-xs uppercase tracking-wider shrink-0">
                  <div id="ctn-app-workspace-center-top-left" className="flex items-center gap-2">
                    Topological Graph
                    </div>
                  <div id="ctn-app-workspace-center-top-center" className="hidden md:flex flex-1 justify-center items-center gap-2">

                    <div className="flex items-center gap-2 bg-[var(--vscode-input-background)]/50 shadow-inner px-2 py-1">
                        <label className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide" data-tooltip="Number of parent files levels to select">Callers</label>
                        <input type="number" id="graph-input-callers-depth" min="0" max="20" className="bg-[var(--vscode-input-background)] shadow-sm border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-sm outline-none focus:ring-1 focus:ring-blue-500/50 w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all" defaultValue="1" />
                    </div>


                    <button id="btn-open-neo4j" className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 hover:from-orange-500 to-orange-500 hover:to-orange-400 shadow-sm px-2.5 rounded-md h-7 font-bold text-[10px] text-white uppercase tracking-wider transition-all cursor-pointer select-none" data-tooltip="Open embedded Neo4j Web Console Client Browser"><span className="codicon codicon-database"></span> Neo4j</button>

                    <div className="flex items-center gap-2 bg-[var(--vscode-input-background)]/50 shadow-inner px-2 py-1">
                        <label className="font-semibold text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide" data-tooltip="Number of child files levels to select">Callees</label>
                        <input type="number" id="graph-input-callees-depth" min="0" max="20" className="bg-[var(--vscode-input-background)] shadow-sm border border-[var(--vscode-input-border)] focus:border-blue-500 rounded-sm outline-none focus:ring-1 focus:ring-blue-500/50 w-12 h-6 font-bold text-[var(--vscode-input-foreground)] text-xs text-center transition-all" defaultValue="1" />
                    </div>

                  </div>
                  <div id="ctn-app-workspace-center-top-right" className="flex items-center gap-1">
                    <button id="btn-zoom-in" className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => cyRef.current?.zoom(cyRef.current.zoom() + 0.1)} title="Zoom In"><Plus size={14}/></button>
                    <button id="btn-zoom-out" className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => cyRef.current?.zoom(cyRef.current.zoom() - 0.1)} title="Zoom Out"><Minus size={14}/></button>
                    <button id="btn-zoom-fit" className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => cyRef.current?.fit()} title="Fit to screen"><Shrink size={14}/></button>
                    <div className="bg-zinc-300 dark:bg-zinc-700 mx-1 w-px h-3"></div>
                    <button
                      id="btn-zoom-maximize"
                      className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      onClick={() => {
                        setIsGraphMaximized(!isGraphMaximized);
                        setTimeout(() => { cyRef.current?.resize(); cyRef.current?.fit(); }, 50);
                      }}
                      title={isGraphMaximized ? "Restore down" : "Maximize fullscreen"}
                    >
                      {isGraphMaximized ? <Minimize size={14}/> : <Maximize size={14}/>}
                    </button>
                  </div>
                </div>

                <div id="ctn-app-workspace-center-content" className="relative flex-1 w-full h-full">
                   <div id="panel-graph-canvas" ref={graphContainerRef} className="relative outline-none w-full h-full"></div>
                </div>

                {/* Graph lock overlay */}
                {isLocked && <div id="ctn-app-workspace-center-locked-overlay" className="z-20 absolute inset-0 bg-white/50 dark:bg-black/50 pointer-events-none"></div>}
              </div>

              {/* ctn-app-workspace-right -> Dynamic flex sizing when center component goes invisible */}
              <div
                id="ctn-app-workspace-right"
                style={{
                  display: isCtnAppWorkspaceRightVisible ? 'flex' : 'none',
                  width: !isCtnAppWorkspaceCenterVisible ? '100%' : `${mainRightWidth}%`
                }}
                className={`relative flex flex-col bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 border-l min-w-[200px] overflow-hidden shrink-0 ${!isCtnAppWorkspaceCenterVisible ? 'flex-1' : ''}`}
              >
                 <div id="ctn-app-workspace-right-title-bar" className="flex justify-between items-center bg-zinc-100 dark:bg-[#18181b] px-3 border-zinc-200 dark:border-zinc-800/50 border-b h-8 font-semibold text-zinc-600 dark:text-zinc-300 text-xs uppercase tracking-wider shrink-0">
                    <div id="ctn-app-workspace-right-title-left" className="flex items-center gap-2">Workspace Left title</div>
                    <div id="ctn-app-workspace-right-title-center" className="flex-1"></div>
                    <div id="ctn-app-workspace-right-title-right" className="flex items-center gap-2"></div>
                 </div>

                 <div id="ctn-app-workspace-right-content" className="flex-1 p-4 overflow-auto text-zinc-600 dark:text-zinc-400 text-xs">
                    Not used at this moment
                 </div>

                 {/* Main Right horizontal handle */}
                 {isCtnAppWorkspaceCenterVisible && (
                   <div
                      id="ctn-app-workspace-right-handle"
                      className="top-0 bottom-0 left-0 z-10 absolute hover:bg-blue-500/50 w-1 cursor-col-resize"
                      onMouseDown={startmainRightResize}
                    >
                       <div className="top-1/2 left-[1px] absolute bg-zinc-300 dark:bg-zinc-700 dark:group-hover:bg-blue-400 group-hover:bg-blue-500 rounded-full w-[2px] h-8 -translate-y-1/2"></div>
                    </div>
                 )}
              </div>

            </div> {/* End Middle row Content */}

            {/* ctn-app-workspace-bottom -> Positioned cleanly under Left, Center, and Right containers */}
            <div
              id="ctn-app-workspace-bottom"
              style={{
                display: isCtnAppWorkspaceBottomVisible ? 'flex' : 'none',
                height: `${ctnAppWorkspaceBottomHeight}px`
              }}
              className="relative flex justify-between items-center bg-zinc-100 dark:bg-[#18181b] px-3 border-zinc-200 dark:border-zinc-800 border-t w-full font-semibold text-zinc-600 dark:text-zinc-300 text-xs shrink-0"
            >
              {/* Workspace bottom vertical resize handle */}
              <div
                id="ctn-app-workspace-bottom-handle"
                className="group top-0 right-0 left-0 z-20 absolute hover:bg-blue-500/50 h-1 cursor-row-resize"
                onMouseDown={startCtnAppWorkspaceBottomResize}
              >
                 <div className="top-[1px] left-1/2 absolute bg-zinc-300 dark:bg-zinc-700 dark:group-hover:bg-blue-400 group-hover:bg-blue-500 rounded-full w-8 h-[2px] -translate-x-1/2"></div>
              </div>

              <div id="ctn-app-workspace-bottom-left" className="py-2">Wksp Bottom Left</div>
              <div id="ctn-app-workspace-bottom-center" className="py-2">Wksp Bottom Center</div>
              <div id="ctn-app-workspace-bottom-right" className="py-2">Wksp Bottom Right</div>
            </div>

          </div> {/* End Column stage wrap */}
        </div>

        {/* D. RIGHT CONTEXTUAL PANE (aside) -> Positioned with ml-auto to strictly lock to right side even if workspace vanishes */}
        <div
          id="ctn-app-sidebar-right"
          style={{
            display: isSidebarRightVisible ? 'flex' : 'none',
            width: `${sidebarRightWidth}px`,
            borderLeftWidth: '1px'
          }}
          className="z-30 relative flex flex-col bg-white dark:bg-[#18181b] ml-auto border-zinc-200 dark:border-zinc-800 h-full transition-all duration-300 ease-in-out shrink-0"
        >
          {/* Resize handle (leftwards) */}
          <div
            id="ctn-app-sidebar-right-handle"
            className="group top-0 bottom-0 left-0 z-40 absolute hover:bg-blue-500/50 w-1 cursor-col-resize"
            onMouseDown={startSidebarRightResize}
          >
             <div className="top-1/2 left-[1px] absolute bg-zinc-300 dark:bg-zinc-700 dark:group-hover:bg-blue-400 group-hover:bg-blue-500 rounded-full w-[2px] h-8 -translate-y-1/2"></div>
          </div>

          <div id="panel-app-sidebar-right-title-bar" className="flex justify-between items-center bg-zinc-100 dark:bg-[#18181b] px-3 border-zinc-200 dark:border-zinc-800/50 border-b h-8 font-semibold text-zinc-600 dark:text-zinc-300 text-xs uppercase tracking-wider shrink-0">
            <div id="panel-app-sidebar-right-title-left" className="flex items-center gap-2">
              <Database size={14} className="text-blue-600 dark:text-blue-500"/>
              Inspector
            </div>
            <div id="panel-app-sidebar-right-title-center" className="flex-1"></div>
            <div id="panel-app-sidebar-right-title-right" className="flex items-center gap-2">
              <button id="btn-close-detail" onClick={() => setSelectedIds([])} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"><X size={14}/></button>
            </div>
          </div>

          <div id="panel-app-sidebar-right-content" className="flex-1 space-y-6 p-4 overflow-y-auto text-sm">
            {selectedIds.length === 0 ? (
              <div id="panel-right-sidebar-content-empty" className="flex flex-col justify-center items-center h-full text-zinc-400 dark:text-zinc-600 text-center">
                <Focus size={32} className="opacity-30 dark:opacity-20 mb-2" />
                No selection
              </div>
            ) : (
              <div id="panel-right-sidebar-content-selected">
                {/* Plural Summary */}
                <div id="ctn-app-sidebar-right-content-summary" className="bg-white dark:bg-zinc-950 mb-4 p-3 border border-zinc-200 dark:border-zinc-800 rounded text-center">
                  <div className="mb-1 font-light text-blue-600 dark:text-blue-400 text-3xl">{selectedIds.length}</div>
                  <div className="text-zinc-500 text-xs uppercase tracking-widest">Selected Node(s)</div>
                </div>

                {/* Individual details */}
                <div id="panel-sidebar-right-content-list" className="space-y-4">
                  {selectedIds.map(id => {
                    const node = AST_DATA.nodes.find(n => n.data.id === id);
                    if(!node) return null;
                    return (
                      <div key={id} id={`detail-item-${id}`} className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                        <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 px-3 py-2 border-zinc-200 dark:border-zinc-800 border-b">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200 text-xs">{node.data.label}</span>
                          <span className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 border border-blue-200 dark:border-blue-800/50 rounded text-[10px] text-blue-700 dark:text-blue-400 capitalize">{node.data.layer}</span>
                        </div>
                        <div className="space-y-2 bg-white dark:bg-zinc-950 p-3 text-xs">
                           <div className="flex justify-between"><span className="text-zinc-500">Parent ID:</span> <span className="text-zinc-800 dark:text-zinc-300">{node.data.parent}</span></div>
                           <div className="flex justify-between"><span className="text-zinc-500">Incoming (In):</span> <span className="font-bold text-red-600 dark:text-red-400">{AST_DATA.edges.filter(e => e.data.target === id).length}</span></div>
                           <div className="flex justify-between"><span className="text-zinc-500">Outgoing (Out):</span> <span className="font-bold text-orange-600 dark:text-orange-400">{AST_DATA.edges.filter(e => e.data.source === id).length}</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* E. FIXED FOOTER (footer) */}
      <div id="ctn-app-footer" className="z-20 flex justify-between items-center bg-[#005cb8] dark:bg-[#004a94] px-3 h-[40px] text-white text-xs select-none shrink-0">

        <div id="panel-app-footer-left" className="flex items-center gap-4">
          <div id="panel-app-footer-connection" className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors cursor-pointer">
            <Server size={14} className={isLocked ? "text-red-300" : "text-emerald-300"} />
            <span className="font-medium">{isLocked ? "Disconnected" : "Neo4j Connected"}</span>
          </div>
          <div id="panel-app-footer-latency" className="hidden sm:flex items-center text-blue-200">
            {isLocked ? "N/A" : "Latency: 12ms"}
          </div>
        </div>

        <div id="panel-app-footer-center" className="flex items-center gap-4">
           <div id="panel-footer-callers" className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded">
             <span className="text-red-200">Callers:</span>
             <span className="font-bold">{impacts.callers.length}</span>
           </div>
           <div id="panel-app-footer-callees" className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded">
             <span className="text-orange-200">Callees:</span>
             <span className="font-bold">{impacts.callees.length}</span>
           </div>
        </div>

        <div id="panel-app-footer-right" className="flex items-center">
          <Tooltip content="Navigation Shortcut - Interactive tip: Double-click any node to load its simulated NestJS source code.">
            <div id="panel-footer-cascade-size" className="flex items-center gap-1 hover:bg-white/10 px-3 py-1 rounded font-semibold transition-colors cursor-pointer">
              Impact count: {selectedIds.length + impacts.callers.length + impacts.callees.length} impacted node(s)
            </div>
          </Tooltip>
        </div>

      </div>
    </div>
  );
}

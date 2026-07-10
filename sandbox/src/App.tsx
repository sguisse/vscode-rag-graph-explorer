import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';

import {
  Network, Search, Download, Upload, Moon, Sun, RotateCcw, EyeOff, Eye,
  ChevronRight, ChevronLeft, LayoutDashboard, FolderTree, Scale, Terminal,
  History, HelpCircle, FileJson, Server, Database, ShieldAlert, Play,
  Minus, Plus, Focus, X, CheckCircle2, XCircle, CircleArrowRight, File, Folder,
  Shrink, Maximize, Minimize, Menu, Settings,
  User, Baby, Layers, Grid, Milestone, FileCode, Copy, Check, Code, Info, GitFork, ChevronDown
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
// 1. DATASETS & UML RELATIONSHIPS SCHEMAS
// ==========================================

const JSON_SCHEMA_SPEC = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "PolyglotDependencyUmlSchema",
  "description": "Data structure defining a polyglot ecosystem with multi-level UML relationships",
  "type": "object",
  "required": ["files", "dependencies"],
  "properties": {
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "type", "path", "language"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "type": { "type": "string", "enum": ["class", "interface", "component", "module", "config"] },
          "path": { "type": "string" },
          "language": { "type": "string" }
        }
      }
    }
  }
};

const initialCodebase = {
  files: [
    {
      id: 'OrderButton.tsx', name: 'OrderButton.tsx', type: 'component', path: 'frontend/components/OrderButton.tsx', language: 'TypeScript (React)', size: 145, complexity: 4,
      attributes: [{ name: 'disabled: boolean', visibility: 'private' }, { name: 'cartTotal: number', visibility: 'public' }],
      methods: [{ id: 'onClick', name: 'onClick()', description: "Intercepts UI click events and triggers API client methods sequentially." }, { id: 'render', name: 'render()', description: "Computes component visual tree using current reactive hook updates." }]
    },
    {
      id: 'orderApi.ts', name: 'orderApi.ts', type: 'module', path: 'frontend/services/orderApi.ts', language: 'TypeScript', size: 90, complexity: 2,
      attributes: [{ name: 'BASE_URL: string', visibility: 'private' }],
      methods: [{ id: 'placeOrder', name: 'placeOrder(items)', description: "Assembles fetch payloads and opens connections to backend proxy controller mapping paths." }]
    },
    {
      id: 'OrderController.java', name: 'OrderController.java', type: 'class', path: 'backend/controllers/OrderController.java', language: 'Java', size: 210, complexity: 5,
      attributes: [{ name: 'orderRepo: OrderRepository', visibility: 'private' }],
      methods: [{ id: 'createOrder', name: 'createOrder(dto)', description: "Deserializes data context structures, verifies authentication parameters, and applies updates." }]
    },
    {
      id: 'Order.java', name: 'Order.java', type: 'class', path: 'backend/models/Order.java', language: 'Java', size: 320, complexity: 9,
      attributes: [{ name: 'id: UUID', visibility: 'private' }, { name: 'items: List<Item>', visibility: 'private' }, { name: 'totalPrice: BigDecimal', visibility: 'private' }],
      methods: [{ id: 'addItem', name: 'addItem(item)', description: "Appends target item structures onto internal sequence and forces sum evaluation." }, { id: 'calculateTotal', name: 'calculateTotal()', description: "Processes array streams using precise bigdecimal scale resolution configurations." }]
    },
    {
      id: 'OrderRepository.java', name: 'OrderRepository.java', type: 'interface', path: 'backend/repositories/OrderRepository.java', language: 'Java', size: 55, complexity: 1,
      attributes: [], methods: [{ id: 'save', name: 'save(order)', description: "Declarative persistence specifications handled via ORM schema configurations." }]
    },
    {
      id: 'JpaOrderRepository.java', name: 'JpaOrderRepository.java', type: 'class', path: 'backend/repositories/JpaOrderRepository.java', language: 'Java', size: 130, complexity: 3,
      attributes: [{ name: 'entityManager: EntityManager', visibility: 'private' }],
      methods: [{ id: 'save', name: 'save(order)', description: "Resolves transaction states and commits object properties directly down to database stacks." }]
    },
    {
      id: 'application.yml', name: 'application.yml', type: 'config', path: 'config/application.yml', language: 'YAML', size: 40, complexity: 1,
      configProperties: [{ key: 'spring.datasource.url', value: 'jdbc:postgresql://localhost:5432/orders_db' }, { key: 'spring.datasource.username', value: 'db_admin_prod' }, { key: 'spring.jpa.show-sql', value: 'true' }]
    }
  ],
  dependencies: [
    { id: 'e-button-api', sourceNode: 'OrderButton.tsx', sourceHandle: 'onClick', targetNode: 'orderApi.ts', targetHandle: 'placeOrder', relation: 'dependency', label: 'Imports & Calls' },
    { id: 'e-api-controller', sourceNode: 'orderApi.ts', sourceHandle: 'placeOrder', targetNode: 'OrderController.java', targetHandle: 'createOrder', relation: 'association', label: 'HTTP POST' },
    { id: 'e-controller-domain', sourceNode: 'OrderController.java', sourceHandle: 'createOrder', targetNode: 'Order.java', targetHandle: 'addItem', relation: 'aggregation', label: 'Invokes' },
    { id: 'e-controller-repo', sourceNode: 'OrderController.java', sourceHandle: 'createOrder', targetNode: 'OrderRepository.java', targetHandle: 'save', relation: 'association', label: 'Uses' },
    { id: 'e-repo-impl', sourceNode: 'JpaOrderRepository.java', sourceHandle: 'header', targetNode: 'OrderRepository.java', targetHandle: 'header', relation: 'implementation', label: 'Implements' },
    { id: 'e-jpa-repo-config', sourceNode: 'JpaOrderRepository.java', sourceHandle: 'save', targetNode: 'application.yml', targetHandle: 'spring.datasource.url', relation: 'dependency', label: 'Reads DB Config' }
  ]
};

const FOLDER_POSITIONS = {
  'frontend': { label: '📂 Client Frontend (TSX/TS)' },
  'backend': { label: '📂 API Backend (Spring Boot / Java)' },
  'config': { label: '⚙️ Configurations d\'Écosystème' }
};

// ==========================================
// 2. RENDERING COMPONENT LAYERS (DOM OVERLAY)
// ==========================================

const FolderNode = ({ data }: any) => (
  <div className="relative bg-slate-100/40 dark:bg-slate-900/10 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl w-full h-full transition-all pointer-events-none select-none">
    <div className="top-3 left-4 absolute flex items-center gap-2 bg-background/80 shadow-sm backdrop-blur px-2 py-1 border border-border/40 rounded font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
      <Folder size={14} className="fill-yellow-500/30 text-yellow-500" />
      {data.label}
    </div>
  </div>
);

const UmlClassNode = ({ id, data }: any) => {
  const getHeaderStyle = () => {
    switch (data.type) {
      case 'component': return { bg: 'bg-emerald-600 dark:bg-emerald-900/80', border: 'border-emerald-500', badge: '🎨 React Component', iconColor: 'text-emerald-400' };
      case 'interface': return { bg: 'bg-indigo-700 dark:bg-indigo-950/80', border: 'border-indigo-500', badge: '⚙️ Java Interface', iconColor: 'text-indigo-400' };
      default: return { bg: 'bg-blue-600 dark:bg-blue-950/80', border: 'border-blue-500', badge: '☕ Java Class', iconColor: 'text-blue-400' };
    }
  };

  const style = getHeaderStyle();

  return (
    <div className={`w-72 bg-card rounded-lg shadow-xl border-2 ${style.border} relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
      <div className={`${style.bg} p-3 text-white relative rounded-t-[5px]`}>
        <div className="flex justify-between items-center">
          <span className="bg-black/30 opacity-85 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">{style.badge}</span>
          <span className="opacity-60 font-mono text-[10px]">{data.language}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FileCode size={18} className={style.iconColor} />
          <h4 className="font-mono font-bold text-sm truncate">{data.name}</h4>
        </div>
      </div>
      <div className="bg-muted/30 p-2.5 border-border border-b">
        <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Attributes</div>
        {data.attributes.length === 0 ? (
          <div className="text-muted-foreground text-xs italic">no attributes available</div>
        ) : (
          <ul className="space-y-0.5 font-mono text-[11px] text-foreground/80">
            {data.attributes.map((attr: any, idx: number) => (
              <li key={idx} className="flex items-center gap-1">
                <span className="text-muted-foreground">{attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+'}</span>
                {attr.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-2.5">
        <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Methods / Exports</div>
        <div className="space-y-2">
          {data.methods.map((m: any) => {
            const isMethodImpacted = data.impactedMembers && data.impactedMembers.includes(m.id);
            const isSelected = data.selectedMember === m.id;
            return (
              <div key={m.id} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, m.id); }}
                className={`pointer-events-auto group relative flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                  isSelected ? 'border-primary bg-primary/10' : isMethodImpacted ? 'border-orange-500 bg-orange-500/15 animate-pulse' : 'border-transparent hover:bg-muted'
                }`}
              >
                <span className="font-mono text-foreground/90 text-xs">+ {m.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ConfigNode = ({ id, data }: any) => (
  <div className={`w-80 bg-card rounded-lg shadow-xl border-2 border-amber-500 relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
    <div className="flex justify-between items-center bg-amber-500 p-2.5 rounded-t-[5px] text-white">
      <div className="flex items-center gap-1.5">
        <Settings size={16} className="text-amber-100" />
        <h4 className="font-mono font-bold text-xs truncate">{data.name}</h4>
      </div>
      <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest">Configuration</span>
    </div>
    <div className="space-y-2 bg-black/90 p-3 max-h-64 overflow-y-auto font-mono text-[10px] text-slate-300">
      {data.configProperties.map((prop: any) => {
        const isPropImpacted = data.impactedMembers && data.impactedMembers.includes(prop.key);
        const isSelected = data.selectedMember === prop.key;
        return (
          <div key={prop.key} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, prop.key); }}
            className={`pointer-events-auto group relative p-2 rounded border transition-all cursor-pointer ${
              isSelected ? 'border-primary bg-primary/20 text-white' : isPropImpacted ? 'border-orange-500 bg-orange-950/50 text-orange-400' : 'border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="font-semibold text-amber-400 truncate">{prop.key}:</div>
            <div className="pl-2 text-slate-400 truncate">{prop.value}</div>
          </div>
        );
      })}
    </div>
  </div>
);

// ==========================================
// 3. SIDEBAR MENU CONFIGURATION
// ==========================================
const SIDEBAR_MENU_ITEMS = [
  { id: 'panel-welcome', icon: LayoutDashboard, label: 'Home' },
  { id: 'panel-explorer', icon: FolderTree, label: 'AST Explorer' },
  { id: 'panel-rules', icon: Scale, label: 'Cypher Rules' },
  { id: 'panel-prompt', icon: FileJson, label: 'GraphRAG Prompt' },
  { id: 'panel-terminal', icon: Terminal, label: 'CLI Terminal' },
  { id: 'panel-history', icon: History, label: 'History' },
  { id: 'panel-configuration', icon: Settings, label: 'Configuration', bottom: true },
  { id: 'panel-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true }
];

// ==========================================
// 4. MAIN INTEGRATED LAYOUT CONTROLLER
// ==========================================
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // --- LAYOUT ENGINE STATES ---
  const [isLocked, setIsLocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeView, setActiveView] = useState('panel-explorer');
  const [sidebarLeftMode, setSidebarLeftMode] = useState('normal');

  const [isCtnWorkspaceVisible, setIsCtnWorkspaceVisible] = useState(true);
  const [isCtnWorkspaceTopVisible, setIsCtnWorkspaceTopVisible] = useState(true);
  const [isCtnWorkspaceLeftVisible, setIsCtnWorkspaceLeftVisible] = useState(true);
  const [isCtnWorkspaceCenterVisible, setIsCtnWorkspaceCenterVisible] = useState(true);
  const [isCtnWorkspaceRightVisible, setIsCtnWorkspaceRightVisible] = useState(true);
  const [isCtnWorkspaceBottomVisible, setIsCtnWorkspaceBottomVisible] = useState(true);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(true);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // --- DIMENSIONAL SIZE HANDLERS ---
  const [sidebarLeftWidth, startSidebarLeftResize] = useResizable(220, 160, 400, true);
  const [mainLeftWidth, startmainLeftResize] = useResizable(25, 15, 60, true);
  const [mainRightWidth, startmainRightResize] = useResizable(30, 15, 60, true, true);
  const [ctnWorkspaceTopHeight, startCtnWorkspaceTopResize] = useResizable(120, 50, 250, false);
  const [ctnWorkspaceBottomHeight, startCtnWorkspaceBottomResize] = useResizable(30, 30, 400, false, true);

  // --- RENDERING CONFIGURATIONS ---
  const [maxNodesLimit, setMaxNodesLimit] = useState(50);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(0);
  const [displayLevel, setDisplayLevel] = useState('all');

  // --- EXPLORER CORE STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'frontend': true, 'backend': true, 'config': true });
  const [visibleFiles, setVisibleFiles] = useState<Record<string, boolean>>({
    'OrderButton.tsx': true, 'orderApi.ts': true, 'OrderController.java': true, 'Order.java': true, 'OrderRepository.java': true, 'JpaOrderRepository.java': true, 'application.yml': true
  });
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'node' | 'member' | 'edge'; nodeId: string; memberId?: string; edgeId?: string; } | null>({ type: 'node', nodeId: 'OrderController.java' });
  const [impactDirection, setImpactDirection] = useState<'aval' | 'amont'>('aval');
  const [impactedSet, setImpactedSet] = useState<Set<string>>(new Set());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'inspect' | 'plantuml' | 'json_schema'>('inspect');

  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // --- REAL-TIME CYTOSCAPE VIEWPORT STATE SYNC ---
  const [graphState, setGraphState] = useState<{
    zoom: number;
    pan: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
  }>({ zoom: 1, pan: { x: 0, y: 0 }, nodePositions: {} });

  const toggleFolder = (folderName: string) => setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  const toggleFolderCheckbox = (folderName: string, forceState?: boolean) => {
    const isCurrentlyChecked = forceState !== undefined ? forceState : initialCodebase.files.filter(f => f.path.startsWith(folderName)).every(f => visibleFiles[f.id]);
    const targetState = !isCurrentlyChecked;
    const updated = { ...visibleFiles };
    initialCodebase.files.forEach(file => { if (file.path.startsWith(folderName)) updated[file.id] = targetState; });
    setVisibleFiles(updated);
  };
  const toggleFileCheckbox = (fileId: string) => setVisibleFiles(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  const handleSelectMember = (nodeId: string, memberId: string) => setSelectedEntity({ type: 'member', nodeId, memberId });
  const triggerNotification = (msg: string) => { setCopiedNotification(msg); setTimeout(() => setCopiedNotification(null), 3000); };
  const copyToClipboard = (text: string, notificationMessage: string) => {
    navigator.clipboard.writeText(text);
    triggerNotification(notificationMessage);
  };
  const resetAllFilters = () => {
    setVisibleFiles({ 'OrderButton.tsx': true, 'orderApi.ts': true, 'OrderController.java': true, 'Order.java': true, 'OrderRepository.java': true, 'JpaOrderRepository.java': true, 'application.yml': true });
    setSearchTerm('');
    setDisplayLevel('all');
    setMaxNodesLimit(50);
    setSelectedEntity({ type: 'node', nodeId: 'OrderController.java' });
    triggerNotification('Configuration and filters reset successfully!');
  };

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) htmlElement.classList.add('dark');
    else htmlElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- TRANSITIVE BFS Engine GRAPH EVALUATOR ---
  useEffect(() => {
    if (!selectedEntity) { setImpactedSet(new Set()); return; }
    const visited = new Set<string>();
    const queue: string[] = [];
    let startKey = '';
    if (selectedEntity.type === 'member') startKey = `${selectedEntity.nodeId}__member__${selectedEntity.memberId}`;
    else if (selectedEntity.type === 'node') startKey = selectedEntity.nodeId;

    if (startKey) { queue.push(startKey); visited.add(startKey); }

    while (queue.length > 0) {
      const current = queue.shift()!;
      initialCodebase.dependencies.forEach(dep => {
        const sourceKeyMember = `${dep.sourceNode}__member__${dep.sourceHandle}`;
        const targetKeyMember = `${dep.targetNode}__member__${dep.targetHandle}`;
        const isHeaderRelation = dep.sourceHandle === 'header' || dep.targetHandle === 'header';
        const sourceKey = isHeaderRelation ? dep.sourceNode : sourceKeyMember;
        const targetKey = isHeaderRelation ? dep.targetNode : targetKeyMember;

        if (impactDirection === 'aval') {
          if (current === dep.sourceNode || current === sourceKey) {
            if (!visited.has(targetKey)) { visited.add(targetKey); visited.add(dep.targetNode); queue.push(targetKey); }
          }
        } else {
          if (current === dep.targetNode || current === targetKey) {
            if (!visited.has(sourceKey)) { visited.add(sourceKey); visited.add(dep.sourceNode); queue.push(sourceKey); }
          }
        }
      });
    }
    setImpactedSet(visited);
  }, [selectedEntity, impactDirection]);

  const searchFilteredFiles = useMemo(() => {
    return initialCodebase.files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) || file.language.toLowerCase().includes(searchTerm.toLowerCase()) || file.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = displayLevel === 'all' || file.type === displayLevel;
      return matchesSearch && visibleFiles[file.id] && matchesLevel;
    }).slice(0, maxNodesLimit);
  }, [searchTerm, visibleFiles, displayLevel, maxNodesLimit]);

  // ==========================================
  // 5. CYTOSCAPE INITIALIZATION ENGINE
  // ==========================================
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'rectangle',
            'opacity': 0.0,
            'width': 'data(width)',
            'height': 'data(height)'
          }
        },
        {
          selector: 'node.folder',
          style: {
            'shape': 'rectangle',
            'opacity': 0.05,
            'background-color': isDarkMode ? '#475569' : '#94a3b8',
            'border-width': '2px',
            'border-color': isDarkMode ? '#334155' : '#cbd5e1',
            'border-style': 'dashed',
            'padding-top': '54px',
            'padding-left': '24px',
            'padding-right': '24px',
            'padding-bottom': '24px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': isDarkMode ? '#475569' : '#cbd5e1',
            'target-arrow-color': isDarkMode ? '#475569' : '#cbd5e1',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'font-family': 'monospace',
            'color': isDarkMode ? '#94a3b8' : '#475569',
            'text-background-opacity': 1,
            'text-background-color': isDarkMode ? '#18181b' : '#ffffff',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'source-endpoint': 'data(sourceEndpoint)',
            'target-endpoint': 'data(targetEndpoint)'
          }
        },
        {
          selector: 'edge.impacted',
          style: {
            'line-color': '#f97316',
            'target-arrow-color': '#f97316',
            'width': 4
          }
        }
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    cyRef.current = cy;

    const syncGraph = () => {
      const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
      cy.nodes().forEach(node => {
        const pos = node.position();
        const w = node.width();
        const h = node.height();
        positions[node.id()] = {
          x: pos.x - w / 2,
          y: pos.y - h / 2,
          w,
          h
        };
      });

      setGraphState({
        zoom: cy.zoom(),
        pan: cy.pan(),
        nodePositions: positions
      });
    };

    cy.on('drag pan zoom render', syncGraph);

    return () => {
      cy.destroy();
    };
  }, [isDarkMode]);

  // ==========================================
  // 6. SYNCHRONISATION DE LA TOPOLOGIE DES ITEMS
  // ==========================================
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.elements().remove();

    const filesByFolder: Record<string, typeof searchFilteredFiles> = {};
    searchFilteredFiles.forEach(file => {
      const folderKey = file.path.split('/')[0] || 'other';
      if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
      filesByFolder[folderKey].push(file);
    });

    const PADDING_TOP = 65;
    const PADDING_LEFT = 24;
    const GAP_X = 40;
    const GAP_Y = 40;

    const folderBaseX: Record<string, number> = { 'frontend': 40, 'backend': 460, 'config': 1270 };
    const folderBaseY: Record<string, number> = { 'frontend': 80, 'backend': 30, 'config': 160 };
    const folderMaxCols: Record<string, number> = { 'frontend': 1, 'backend': 2, 'config': 1 };

    Object.entries(FOLDER_POSITIONS).forEach(([folderKey, initialPos]) => {
      const folderFiles = filesByFolder[folderKey] || [];
      if (folderFiles.length === 0) return;

      const maxCols = folderMaxCols[folderKey] || 1;
      const maxNodeWidth = folderKey === 'config' ? 320 : 288;
      const maxNodeHeight = folderKey === 'config' ? 240 : 280;

      cy.add({
        data: { id: `folder__${folderKey}` },
        classes: 'folder'
      });

      folderFiles.forEach((file, index) => {
        const colIdx = index % maxCols;
        const rowIdx = Math.floor(index / maxCols);

        const absX = folderBaseX[folderKey] + PADDING_LEFT + colIdx * (maxNodeWidth + GAP_X) + maxNodeWidth / 2;
        const absY = folderBaseY[folderKey] + PADDING_TOP + rowIdx * (maxNodeHeight + GAP_Y) + maxNodeHeight / 2;

        cy.add({
          data: {
            id: file.id,
            parent: `folder__${folderKey}`,
            width: maxNodeWidth,
            height: maxNodeHeight
          },
          position: { x: absX, y: absY }
        });
      });
    });

    initialCodebase.dependencies.forEach(dep => {
      if (visibleFiles[dep.sourceNode] && visibleFiles[dep.targetNode]) {
        const sourceActive = searchFilteredFiles.some(f => f.id === dep.sourceNode);
        const targetActive = searchFilteredFiles.some(f => f.id === dep.targetNode);
        if (!sourceActive || !targetActive) return;

        const srcKey = dep.sourceHandle === 'header' ? dep.sourceNode : `${dep.sourceNode}__member__${dep.sourceHandle}`;
        const tgtKey = dep.targetHandle === 'header' ? dep.targetNode : `${dep.targetNode}__member__${dep.targetHandle}`;
        const isEdgeImpacted = impactedSet.has(srcKey) && impactedSet.has(tgtKey);

        // --- CALCUL CHIRURGICAL DU PORT DES MÉTHODES ---
        const sourceFile = initialCodebase.files.find(f => f.id === dep.sourceNode);
        const targetFile = initialCodebase.files.find(f => f.id === dep.targetNode);

        let sourceXOffset = sourceFile?.type === 'config' ? 160 : 144;
        let targetXOffset = targetFile?.type === 'config' ? -160 : -144;
        let sourceYOffset = 0;
        let targetYOffset = 0;

        if (sourceFile) {
          if (dep.sourceHandle !== 'header') {
            if (sourceFile.type === 'config') {
              const idx = sourceFile.configProperties?.findIndex(p => p.key === dep.sourceHandle) ?? 0;
              sourceYOffset = -44 + idx * 42;
            } else {
              const idx = sourceFile.methods?.findIndex(m => m.id === dep.sourceHandle) ?? 0;
              sourceYOffset = 36 + idx * 32;
            }
          }
        }

        if (targetFile) {
          if (dep.targetHandle !== 'header') {
            if (targetFile.type === 'config') {
              const idx = targetFile.configProperties?.findIndex(p => p.key === dep.targetHandle) ?? 0;
              targetYOffset = -44 + idx * 42;
            } else {
              const idx = targetFile.methods?.findIndex(m => m.id === dep.targetHandle) ?? 0;
              targetYOffset = 36 + idx * 32;
            }
          }
        }

        cy.add({
          data: {
            id: dep.id,
            source: dep.sourceNode,
            target: dep.targetNode,
            label: dep.label,
            sourceEndpoint: `${sourceXOffset}px ${sourceYOffset}px`,
            targetEndpoint: `${targetXOffset}px ${targetYOffset}px`
          },
          classes: isEdgeImpacted ? 'impacted' : ''
        });
      }
    });

    cy.trigger('render');
  }, [searchFilteredFiles, visibleFiles, impactedSet]);

  const generatedPlantUML = useMemo(() => {
    let puml = `' Real-time synchronization state\n@startuml Codebase_Architecture_State\n\n`;
    ['frontend', 'backend', 'config'].forEach(f => {
      const folderFiles = searchFilteredFiles.filter(file => file.path.startsWith(f));
      if (folderFiles.length > 0) {
        puml += `package "${f}" {\n`;
        folderFiles.forEach(file => {
          if (file.type === 'config') {
            puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} << (C, #f59e0b) Config >> {\n`;
            file.configProperties?.forEach(prop => { puml += `    {field} ${prop.key}\n`; });
            puml += `  }\n`;
          } else {
            const stereotype = file.type === 'interface' ? '<< Interface >>' : file.type === 'component' ? '<< Component >>' : '';
            puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} ${stereotype} {\n`;
            file.attributes.forEach(attr => { puml += `    {field} ${attr.name}\n`; });
            file.methods.forEach(m => { puml += `    {method} + ${m.name}\n`; });
            puml += `  }\n`;
          }
        });
        puml += `}\n\n`;
      }
    });
    initialCodebase.dependencies.forEach(dep => {
      if (visibleFiles[dep.sourceNode] && visibleFiles[dep.targetNode]) {
        puml += `${dep.sourceNode.replace(/\.[^/.]+$/, "")} --> ${dep.targetNode.replace(/\.[^/.]+$/, "")} : "${dep.label}"\n`;
      }
    });
    return puml + `\n@enduml`;
  }, [searchFilteredFiles, visibleFiles]);

  const generatedMarkdownRecipe = useMemo(() => {
    let md = `### 🛡️ Plan d'Impact & Fiche de Recette Polyglotte\n\n`;
    let startElement = 'Non défini';
    if (selectedEntity) {
      if (selectedEntity.type === 'member') startElement = `Méthode \`${selectedEntity.memberId}()\` de \`${selectedEntity.nodeId}\``;
      else startElement = `Fichier \`${selectedEntity.nodeId}\``;
    }
    md += `**Élément Déclencheur :** ${startElement}\n`;
    md += `**Direction de Propagation :** ${impactDirection === 'aval' ? 'Aval (Impacts descendants)' : 'Amont (Appelants ascendants)'}\n\n`;
    md += `#### 📋 Liste des composants à re-tester\n\n`;
    initialCodebase.files.forEach(file => {
      if (impactedSet.has(file.id)) {
        md += `- [ ] **${file.name}** (\`${file.path}\`)\n`;
      }
    });
    return md;
  }, [selectedEntity, impactDirection, impactedSet]);

  const visibleCount = searchFilteredFiles.length;

  const renderViewContent = () => {
    switch(activeView) {
      case 'panel-explorer':
        return (
          <div id="panel-explorer" className="flex flex-col bg-card h-full">
            <div className="bg-muted/20 p-4 border-border border-b">
              <h3 className="flex justify-between items-center mb-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
                <span>Codebase Explorer</span>
                <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">{visibleCount}/{initialCodebase.files.length}</span>
              </h3>
              <div className="relative">
                <Search className="top-2.5 left-2.5 absolute w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Filter by FQN or file extension..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-background px-3 py-1.5 pl-9 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary w-full font-mono text-foreground text-xs" />
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
              <div className="mb-4">
                <div className="group flex justify-between items-center hover:bg-muted/50 px-1 py-1 rounded">
                  <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder('frontend')}>
                    {expandedFolders['frontend'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Folder size={15} className="fill-yellow-500/20 text-yellow-500" />
                    <span className="font-bold">frontend/</span>
                  </div>
                  <input type="checkbox" checked={initialCodebase.files.filter(f => f.path.startsWith('frontend')).every(f => visibleFiles[f.id])} onChange={() => toggleFolderCheckbox('frontend')} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                </div>
                {expandedFolders['frontend'] && (
                  <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                    {initialCodebase.files.filter(f => f.path.startsWith('frontend')).map(file => (
                      <div key={file.id} className="group flex justify-between items-center hover:bg-muted px-2 py-1 rounded">
                        <span className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`} onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}>
                          <FileCode size={13} className="text-emerald-500" />
                          {file.name}
                        </span>
                        <input type="checkbox" checked={visibleFiles[file.id]} onChange={() => toggleFileCheckbox(file.id)} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="group flex justify-between items-center hover:bg-muted/50 px-1 py-1 rounded">
                  <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder('backend')}>
                    {expandedFolders['backend'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Folder size={15} className="fill-indigo-500/20 text-indigo-500" />
                    <span className="font-bold">backend/</span>
                  </div>
                  <input type="checkbox" checked={initialCodebase.files.filter(f => f.path.startsWith('backend')).every(f => visibleFiles[f.id])} onChange={() => toggleFolderCheckbox('backend')} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                </div>
                {expandedFolders['backend'] && (
                  <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                    {initialCodebase.files.filter(f => f.path.startsWith('backend')).map(file => {
                      const color = file.type === 'interface' ? 'text-indigo-400' : 'text-blue-500';
                      return (
                        <div key={file.id} className="group flex justify-between items-center hover:bg-muted px-2 py-1 rounded">
                          <span className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`} onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}>
                            <FileCode size={13} className={color} />
                            {file.name}
                          </span>
                          <input type="checkbox" checked={visibleFiles[file.id]} onChange={() => toggleFileCheckbox(file.id)} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="group flex justify-between items-center hover:bg-muted/50 px-1 py-1 rounded">
                  <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder('config')}>
                    {expandedFolders['config'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Settings size={15} className="text-amber-500" />
                    <span className="font-bold">config/</span>
                  </div>
                  <input type="checkbox" checked={initialCodebase.files.filter(f => f.path.startsWith('config')).every(f => visibleFiles[f.id])} onChange={() => toggleFolderCheckbox('config')} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                </div>
                {expandedFolders['config'] && (
                  <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                    {initialCodebase.files.filter(f => f.path.startsWith('config')).map(file => (
                      <div key={file.id} className="group flex justify-between items-center hover:bg-muted px-2 py-1 rounded">
                        <span className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`} onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}>
                          <Database size={13} className="text-amber-500" />
                          {file.name}
                        </span>
                        <input type="checkbox" checked={visibleFiles[file.id]} onChange={() => toggleFileCheckbox(file.id)} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
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
          <><span className="truncate">{item.label}</span>{item.id === 'panel-explorer' ? <SidebarMenuBadge>New</SidebarMenuBadge> : item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}</>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <TooltipProvider>
      <div id="ctn-root" className={`flex flex-col h-screen w-screen overflow-hidden font-sans text-sm select-none transition-colors duration-200 bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>

        {/* TOAST NOTIFICATION WINDOW */}
        {copiedNotification && (
          <div className="top-12 left-1/2 z-50 fixed flex items-center gap-2 bg-primary slide-in-from-top-4 shadow-2xl px-4 py-2.5 rounded-full font-mono text-primary-foreground text-xs -translate-x-1/2 animate-in transform fade-in">
            <Check size={14} /> {copiedNotification}
          </div>
        )}

        {/* ISOLATION BLOCKER OVERLAY */}
        {isLocked && (
          <div className="z-40 absolute inset-0 flex justify-center items-center bg-background/80 backdrop-blur-sm pointer-events-auto">
            <div className="bg-card shadow-2xl p-6 border border-border rounded-lg max-w-md text-center">
              <ShieldAlert className="mx-auto mb-4 text-destructive" size={44} />
              <h2 className="mb-2 font-bold text-foreground text-base">Sandbox Cluster Suspended</h2>
              <Button variant="destructive" size="sm" onClick={() => setIsLocked(false)}>Restore connection</Button>
            </div>
          </div>
        )}

        {/* A. FIXED NAVIGATION HEADER ROW */}
        <LayoutPanel
          id="ctn-header"
          className="z-20 bg-card px-3 border-border border-b h-[40px] shrink-0"
          left={
            <>
              <Button variant="ghost" size="icon" onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')} className="w-8 h-8 text-muted-foreground hover:text-foreground"><Menu size={16} /></Button>
              <div className="flex items-center gap-2 ml-1 text-primary cursor-help"><span className="font-bold text-foreground text-xs tracking-tight">Archi-Polyglot Workspace (Cytoscape)</span></div>
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
              <button id="btn-reset-graphe" onClick={resetAllFilters} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Reset Workspace"><RotateCcw size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>

              <button id="btn-toggle-main" onClick={() => setIsCtnWorkspaceVisible(!isCtnWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors'}`} title="Workspace Frame"><Eye size={16} /></button>
              <button id="btn-toggle-main-header" onClick={() => setIsCtnWorkspaceTopVisible(!isCtnWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceTopVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors'}`} title="Top Paths Container"><Eye size={16} /></button>
              <button id="btn-toggle-main-left" onClick={() => setIsCtnWorkspaceLeftVisible(!isCtnWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceLeftVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors'}`} title="Left Filter Stream"><Eye size={16} /></button>
              <button id="btn-toggle-main-center" onClick={() => setIsCtnWorkspaceCenterVisible(!isCtnWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceCenterVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors'}`} title="Center Canvas Stage"><Eye size={16} /></button>
              <button id="btn-toggle-workspace-right" onClick={() => setIsCtnWorkspaceRightVisible(!isCtnWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors'}`} title="Right Side Workspace View"><Eye size={16} /></button>
              <button id="btn-toggle-workspace-bottom" onClick={() => setIsCtnWorkspaceBottomVisible(!isCtnWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceBottomVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors'}`} title="Bottom Terminals"><Eye size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>
              <button id="btn-toggle-main-right" onClick={() => setIsSidebarRightVisible(!isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isSidebarRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors'}`} title="Inspector Panel"><Eye size={16} /></button>
            </div>
          }
        />

        {/* MODALS MAP */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="bg-card border border-border">
            <DialogHeader><DialogTitle className="text-foreground text-sm">Import AST Data Schema</DialogTitle></DialogHeader>
            <div className="p-2 border border-dashed rounded text-muted-foreground text-xs text-center">Select local extraction file payload</div>
          </DialogContent>
        </Dialog>

        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="bg-card border border-border">
            <DialogHeader><DialogTitle className="text-foreground text-sm">Export Topology Map</DialogTitle></DialogHeader>
            <div className="flex gap-2 mt-2"><Button size="sm" className="flex-1">JSON Matrix</Button><Button size="sm" variant="outline" className="flex-1">DDL Query</Button></div>
          </DialogContent>
        </Dialog>

        {/* CORE APPLICATION CONTENT INTERACTIVE FRAME MESH */}
        <div id="ctn-main" className="relative flex flex-1 overflow-hidden">

          {/* B. SIDEBAR VIEW SELECTOR */}
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

          {/* C. SYSTEM TIERS WORKSPACE MATRIX BLOCK */}
          <div id="ctn-workspace" style={{ display: isCtnWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-background min-w-0">
            <div className="relative flex flex-col flex-1 min-w-0">

              {/* TOP DIRECTORY MAPPING PATH CONTAINER ROW */}
              <ResizableContainer id="ctn-workspace-top" visible={isCtnWorkspaceTopVisible} style={{ height: `${ctnWorkspaceTopHeight}px` }} headerLeft="Target Path Mapping Streams" resizeHandle="bottom" onResizeStart={startCtnWorkspaceTopResize} className="bg-muted border-b">
                <div className="p-3 font-mono text-muted-foreground text-xs">/Users/mac-SGUISS21/01-work/01-projects/10-tools/01-plugins/vscode-rag-graph-explorer</div>
              </ResizableContainer>

              {/* CENTER CORE INTERACTIVE STAGE AND EXTENSION TIERS */}
              <div id="ctn-workspace-middle-row" className="flex flex-1 min-h-0 overflow-hidden">

                {/* LEFT ATTACHED MODULE PANEL CONTROL VIEWPORT */}
                <ResizableContainer id="ctn-workspace-left" visible={isCtnWorkspaceLeftVisible} style={{ width: `${mainLeftWidth}%` }} headerLeft={getActiveViewLabel()} className="border-r min-w-[200px]" resizeHandle="right" onResizeStart={startmainLeftResize}>
                  {renderViewContent()}
                </ResizableContainer>

                {/* CORE SYSTEM TOPOLOGICAL NETSTAGE CANVAS OVERLAY CONTROL TIERS */}
                <ResizableContainer
                  id="ctn-workspace-center"
                  visible={isCtnWorkspaceCenterVisible || isGraphMaximized}
                  style={isGraphMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : { flex: 1 }}
                  headerLeft={
                    <div className="flex items-center gap-2">
                      <span>Topological Network</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-5 w-5 rounded transition-colors ${showGrid ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                        onClick={() => setShowGrid(!showGrid)}
                        title="Toggle Background Dots Grid Visibility"
                      >
                        <Grid size={12} />
                      </Button>
                    </div>
                  }
                  headerCenter={
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm" title="Maximum sequential nodes rendering constraint limit">
                        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
                        <Input type="number" id="graph-input-limit" min={1} max={100} className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center" value={maxNodesLimit} onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)} />
                      </div>

                      <Button id="btn-open-neo4j" className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 hover:from-orange-500 to-orange-500 hover:to-orange-400 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider" onClick={() => console.log("Routing execution context...")}>
                        <Database size={11} /> Neo4j
                      </Button>

                      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm" title="Upstream Callers Level Matrix Tracer">
                        <User size={12} className="text-muted-foreground" />
                        <Input type="number" id="graph-input-callers-depth" min={0} max={20} className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center" value={callersDepth} onChange={(e) => setCallersDepth(Number(e.target.value) || 0)} />
                      </div>

                      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm" title="Downstream Callees Level Matrix Tracer">
                        <Baby size={12} className="text-muted-foreground" />
                        <Input type="number" id="graph-input-callees-depth" min={0} max={20} className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center" value={calleesDepth} onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)} />
                      </div>

                      <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
                        <Select value={displayLevel} onValueChange={setDisplayLevel}>
                          <SelectTrigger id="select-display-level" className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-24 h-5 text-[11px] text-foreground">
                            <SelectValue placeholder="Granularity" />
                          </SelectTrigger>
                          <SelectContent side="bottom">
                            <SelectItem value="all">Show All</SelectItem>
                            <SelectItem value="component">Component</SelectItem>
                            <SelectItem value="class">Class</SelectItem>
                            <SelectItem value="interface">Interface</SelectItem>
                            <SelectItem value="module">Module</SelectItem>
                            <SelectItem value="config">Configuration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  }
                  headerRight={
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}><Plus size={12}/></Button>
                      <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}><Minus size={12}/></Button>
                      <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => { cyRef.current?.fit(); cyRef.current?.center(); }}><Focus size={12}/></Button>
                      <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => { setIsGraphMaximized(!isGraphMaximized); }}><Maximize size={12}/></Button>
                    </div>
                  }
                  className="relative bg-background"
                >
                  <div id="panel-graph-canvas" className="absolute inset-0 outline-none w-full h-full overflow-hidden">

                    {/* Conteneur natif Cytoscape (Calque Arrière) */}
                    <div
                      ref={containerRef}
                      className="z-0 absolute inset-0 w-full h-full"
                      style={showGrid ? {
                        backgroundImage: isDarkMode ? 'radial-gradient(#334155 1.2px, transparent 1.2px)' : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
                        backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`,
                        backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px`
                      } : undefined}
                    />

                    {/* Calque HTML Synchrone (Calque Avant) */}
                    <div
                      className="z-10 absolute inset-0 origin-top-left pointer-events-none select-none"
                      style={{
                        transform: `translate(${graphState.pan.x}px, ${graphState.pan.y}px) scale(${graphState.zoom})`,
                      }}
                    >
                      {/* Rendu dynamique des Packages / Folders */}
                      {Object.entries(FOLDER_POSITIONS).map(([folderKey, initialPos]) => {
                        const bounds = graphState.nodePositions[`folder__${folderKey}`];
                        if (!bounds) return null;
                        return (
                          <div
                            key={`folder-${folderKey}`}
                            className="z-10 absolute transition-all duration-75 ease-out"
                            style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
                          >
                            <FolderNode data={{ label: initialPos.label }} />
                          </div>
                        );
                      })}

                      {/* Rendu dynamique des Classes / UML Nodes */}
                      {searchFilteredFiles.map(file => {
                        const bounds = graphState.nodePositions[file.id];
                        if (!bounds) return null;

                        const impactedMembers: string[] = [];
                        impactedSet.forEach(item => {
                          if (item.startsWith(`${file.id}__member__`)) {
                            impactedMembers.push(item.split('__member__')[1]);
                          }
                        });
                        const isNodeImpacted = impactedSet.has(file.id);
                        const isDimmed = selectedEntity !== null && impactedSet.size > 0 && !isNodeImpacted;

                        return (
                          <div
                            key={file.id}
                            className="z-20 absolute transition-all duration-75 ease-out pointer-events-none"
                            style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
                          >
                            {file.type === 'config' ? (
                              <ConfigNode
                                id={file.id}
                                data={{
                                  ...file,
                                  isDimmed,
                                  impactedMembers,
                                  selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
                                  onSelectMember: handleSelectMember
                                }}
                              />
                            ) : (
                              <UmlClassNode
                                id={file.id}
                                data={{
                                  ...file,
                                  isDimmed,
                                  impactedMembers,
                                  selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
                                  onSelectMember: handleSelectMember
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="top-4 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto">
                      <div className="flex items-center gap-2 mb-1"><Info size={14} className="text-primary" /><span className="font-bold">Surgical Analysis (Cytoscape Engine)</span></div>
                      <p className="text-[10px] text-muted-foreground">Le drag-and-drop sur les en-têtes et le zoom molette utilisent l'architecture réactive de Cytoscape. Les clics sur les méthodes restent gérés par React.</p>
                    </div>

                  </div>
                </ResizableContainer>

                {/* RIGHT SYSTEM EXTENDED INSPECTOR TABS CONTEXT CONTAINER PANEL */}
                <ResizableContainer id="ctn-workspace-right" visible={isCtnWorkspaceRightVisible} style={{ width: !isCtnWorkspaceCenterVisible ? '100%' : `${mainRightWidth}%` }} headerLeft="Metadata & Inspector Tab Matrices" className={!isCtnWorkspaceCenterVisible ? 'flex-1 border-l min-w-[200px]' : 'border-l min-w-[200px]'} resizeHandle={isCtnWorkspaceCenterVisible ? "left" : "none"} onResizeStart={isCtnWorkspaceCenterVisible ? startmainRightResize : undefined}>
                  <div className="flex flex-col bg-card h-full">
                    <div className="flex bg-muted/40 border-border border-b shrink-0">
                      <button onClick={() => setRightPanelTab('inspect')} className={`flex-1 py-2 text-center font-mono text-[11px] font-bold ${rightPanelTab === 'inspect' ? 'border-b-2 border-primary text-primary bg-background' : 'text-muted-foreground'}`}>Inspector</button>
                      <button onClick={() => setRightPanelTab('plantuml')} className={`flex-1 py-2 text-center font-mono text-[11px] font-bold ${rightPanelTab === 'plantuml' ? 'border-b-2 border-primary text-primary bg-background' : 'text-muted-foreground'}`}>PlantUML</button>
                      <button onClick={() => setRightPanelTab('json_schema')} className={`flex-1 py-2 text-center font-mono text-[11px] font-bold ${rightPanelTab === 'json_schema' ? 'border-b-2 border-primary text-primary bg-background' : 'text-muted-foreground'}`}>JSON Schema</button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">

                      {/* FULL IMMERSIVE COMPREHENSIVE INSPECTOR PANEL */}
                      {rightPanelTab === 'inspect' && (
                        selectedEntity ? (
                          (() => {
                            const currentFile = initialCodebase.files.find(f => f.id === selectedEntity.nodeId);
                            if (!currentFile) return null;
                            return (
                              <div className="space-y-4 animate-in duration-200 fade-in">
                                <div className="space-y-3 bg-primary/5 p-4 border border-primary/20 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono font-bold text-[10px] text-primary uppercase tracking-wider">ACTIVE SUBSYSTEM</span>
                                    <span className="bg-primary/10 px-2.5 py-0.5 rounded font-mono font-bold text-primary text-xs">{currentFile.language}</span>
                                  </div>
                                  <div className="flex items-start gap-2.5 mt-3">
                                    <FileCode size={20} className="mt-1 text-primary shrink-0" />
                                    <div className="overflow-hidden">
                                      <h4 className="font-mono font-bold text-foreground text-sm truncate">
                                        {selectedEntity.type === 'member' ? `${currentFile.name} ➔ ${selectedEntity.memberId}()` : currentFile.name}
                                      </h4>
                                      <span className="block mt-0.5 font-mono text-[10px] text-muted-foreground truncate">{currentFile.path}</span>
                                    </div>
                                  </div>
                                  <div className="gap-3 grid grid-cols-2 pt-3 border-border border-t">
                                    <div className="bg-background p-2 border border-border rounded">
                                      <span className="block font-mono text-[10px] text-muted-foreground uppercase">Volume of Code</span>
                                      <span className="font-mono font-bold text-foreground text-xs">{currentFile.size} LOC</span>
                                    </div>
                                    <div className="bg-background p-2 border border-border rounded">
                                      <span className="block font-mono text-[10px] text-muted-foreground uppercase">Complexity V(g)</span>
                                      <span className="font-mono font-bold text-foreground text-xs">Level {currentFile.complexity}</span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-950 mt-3 p-2.5 border border-slate-800 rounded font-mono text-slate-300 text-xs">
                                    <div className="mb-1 font-bold text-[10px] text-amber-400 uppercase">Functional Documentation:</div>
                                    {selectedEntity.type === 'member' ? (
                                      currentFile.methods?.find(m => m.id === selectedEntity.memberId)?.description ||
                                      currentFile.configProperties?.find(p => p.key === selectedEntity.memberId)?.value ||
                                      "No dedicated structural descriptions mapped for this member item node."
                                    ) : (
                                      `File container encapsulating target polyglot implementation layers at specified location pathing.`
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <label className="font-mono font-bold text-[11px] text-muted-foreground uppercase">Impact Propagation Traversal Direction</label>
                                    <span className="bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded font-mono text-[10px] text-amber-500">Transitive BFS</span>
                                  </div>
                                  <div className="gap-2 grid grid-cols-2">
                                    <button onClick={() => setImpactDirection('aval')} className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all ${impactDirection === 'aval' ? 'bg-orange-500 border-orange-400 text-white shadow-md' : 'bg-muted border-border text-foreground'}`}><GitFork size={13} className="rotate-180" />Downstream (Callees)</button>
                                    <button onClick={() => setImpactDirection('amont')} className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all ${impactDirection === 'amont' ? 'bg-orange-500 border-orange-400 text-white shadow-md' : 'bg-muted border-border text-foreground'}`}><GitFork size={13} />Upstream (Callers)</button>
                                  </div>
                                </div>

                                <div className="space-y-3 bg-orange-500/5 p-4 border border-orange-500/25 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-orange-500" /><h5 className="font-mono font-bold text-orange-500 text-xs">Fluorescent Impact Plan</h5></div>
                                    <button onClick={() => copyToClipboard(generatedMarkdownRecipe, "Markdown impact recipe copied to clip-board!")} className="flex items-center gap-1 bg-muted hover:bg-muted/80 px-2 py-1 border border-border rounded font-mono text-[10px] text-foreground"><Copy size={10} />Copy Recipes</button>
                                  </div>
                                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {initialCodebase.files.map(f => impactedSet.has(f.id) ? (
                                      <div key={f.id} className="flex justify-between items-center bg-background px-2 py-1.5 border border-orange-500/20 rounded font-mono text-[11px]"><span className="font-semibold text-foreground truncate">{f.name}</span><span className="bg-muted px-1.5 py-0.5 rounded text-[9px] text-muted-foreground">{f.language}</span></div>
                                    ) : null)}
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : <div className="py-12 text-muted-foreground text-center"><ShieldAlert size={36} className="opacity-40 mx-auto mb-2 text-muted-foreground" /><h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4><p className="mx-auto mt-1 max-w-[240px] text-muted-foreground text-xs">Click any file component link row or surgical grid handle item to initialize graph mapping parameters.</p></div>
                      )}
                      {rightPanelTab === 'plantuml' && <pre className="bg-black/90 p-3 rounded-lg overflow-x-auto text-[10px] text-white whitespace-pre-wrap">{generatedPlantUML}</pre>}
                      {rightPanelTab === 'json_schema' && <pre className="bg-black/90 p-3 rounded-lg overflow-x-auto text-[10px] text-emerald-400 whitespace-pre-wrap">{JSON.stringify(JSON_SCHEMA_SPEC, null, 2)}</pre>}
                    </div>
                  </div>
                </ResizableContainer>

              </div>

              {/* BOTTOM PANEL RUNTIME LOGGERS AND MONITOR CHANNELS BAR */}
              <ResizableContainer id="ctn-workspace-bottom" visible={isCtnWorkspaceBottomVisible} style={{ height: `${ctnWorkspaceBottomHeight}px` }} className="bg-secondary border-t" resizeHandle="top" onResizeStart={startCtnWorkspaceBottomResize}>
                <LayoutPanel id="panel-workspace-bottom" className="px-4 h-full font-medium text-muted-foreground text-xs" left="Topological AST Compilation Matrix State Logs:" center="Execution Thread Idle Pool" right="OK" />
              </ResizableContainer>

            </div>
          </div>

          {/* D. RIGHT STRUCTURAL PANEL PANEL PROPERTIES MATRIX GRID */}
          <ResizableContainer id="ctn-sidebar-right" visible={isSidebarRightVisible} style={{ width: `300px` }} headerLeft={<><Layers size={13} className="mr-1.5"/> <span>Entity Properties</span></>} headerRight={<Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setSelectedEntity(null)}><X size={12}/></Button>} className="border-l shrink-0" resizeHandle="left">
            <div className="space-y-3 p-4 text-xs">
              {selectedEntity ? (
                <Card className="bg-muted shadow-none border-border">
                  <CardHeader className="bg-secondary/50 p-3 border-b"><span className="font-bold text-foreground">Global Identity attributes</span></CardHeader>
                  <CardContent className="space-y-1 p-3 font-mono text-[11px] text-muted-foreground">
                    <div>FQN: <span className="text-foreground">{selectedEntity.nodeId}</span></div>
                    <div>Type: <span className="text-foreground">{selectedEntity.type}</span></div>
                    {selectedEntity.memberId && <div>Target Member: <span className="text-foreground">{selectedEntity.memberId}()</span></div>}
                  </CardContent>
                </Card>
              ) : <div className="py-8 text-muted-foreground text-center">No selection parameter state active</div>}
            </div>
          </ResizableContainer>

        </div>

        {/* E. FIXED MAIN APPLICATION STATUS BAR FOOTER CHANNELS */}
        <LayoutPanel id="ctn-footer" className="z-20 bg-primary px-3 h-[35px] text-primary-foreground text-xs select-none shrink-0" left={<><Server size={13} className="mr-1.5"/><span className="font-medium">Analysis Subsystems Synced</span></>} center={<div className="font-mono">Active Topology Nodes Rendered: {visibleCount}</div>} right={<div>Cytoscape Pipeline Core</div>} />

      </div>
    </TooltipProvider>
  );
}

// Fluid resize handling controller abstraction layout layer
function useResizable(initialSize: number, minSize: number, maxSize: number, isHorizontal: boolean = true, reverse: boolean = false) {
  const [size, setSize] = useState(initialSize);
  const sizeRef = useRef(size);
  useEffect(() => { sizeRef.current = size; }, [size]);
  const startResizing = useCallback((mouseDownEvent: any) => {
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
}

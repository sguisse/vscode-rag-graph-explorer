#!/bin/bash

# Navigate to the sandbox directory where the app is located

# Ensure source directory exists
mkdir -p src/components/ui src/components/app src/lib src/hooks

# Overwrite App.tsx with the complete, fully repaired, production-ready application
cat << 'EOF' > src/App.tsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/dialog';
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
// 2. CUSTOM RENDER NODE STRUCTS (REACT FLOW)
// ==========================================

const FolderNode = ({ data }: any) => (
  <div className="bg-slate-50/40 dark:bg-slate-900/10 p-4 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl w-full h-full transition-all pointer-events-none select-none">
    <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
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
      <Handle type="target" position={Position.Top} id={`${id}__header_target`} className="opacity-0 w-2 h-2" />
      <Handle type="source" position={Position.Bottom} id={`${id}__header_source`} className="opacity-0 w-2 h-2" />
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
                className={`group relative flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                  isSelected ? 'border-primary bg-primary/10' : isMethodImpacted ? 'border-orange-500 bg-orange-500/15 animate-pulse' : 'border-transparent hover:bg-muted'
                }`}
              >
                <Handle type="target" position={Position.Left} id={`${id}__method__${m.id}__target`} style={{ left: '-6px', width: '10px', height: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  className={`border-2 transition-transform duration-200 group-hover:scale-125 z-10 ${isMethodImpacted ? 'bg-orange-500 border-orange-200' : 'bg-primary border-background'}`} />
                <span className="font-mono text-foreground/90 text-xs">+ {m.name}</span>
                <Handle type="source" position={Position.Right} id={`${id}__method__${m.id}__source`} style={{ right: '-6px', width: '10px', height: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  className={`border-2 transition-transform duration-200 group-hover:scale-125 z-10 ${isMethodImpacted ? 'bg-orange-500 border-orange-200' : 'bg-emerald-500 border-background'}`} />
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
            className={`group relative p-2 rounded border transition-all cursor-pointer ${
              isSelected ? 'border-primary bg-primary/20 text-white' : isPropImpacted ? 'border-orange-500 bg-orange-950/50 text-orange-400' : 'border-slate-800 hover:bg-slate-900'
            }`}
          >
            <Handle type="target" position={Position.Left} id={`${id}__prop__${prop.key}__target`} style={{ left: '-6px', width: '10px', height: '10px', top: '50%', transform: 'translateY(-50%)' }}
              className={`border-2 z-10 ${isPropImpacted ? 'bg-orange-500 border-orange-200' : 'bg-amber-500 border-slate-900'}`} />
            <div className="font-semibold text-amber-400 truncate">{prop.key}:</div>
            <div className="pl-2 text-slate-400 truncate">{prop.value}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const nodeTypesMap = { folder: FolderNode, umlClass: UmlClassNode, config: ConfigNode };

// ==========================================
// 3. MAIN INTEGRATED LAYOUT CONTROLLER
// ==========================================
export default function App() {
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

  // --- REACT FLOW ELEMENTS STATES ---
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  // --- GRAPH MATRIX DISPATCHERS ---
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

  // --- SYNC DARK MODE ATTRIBUTES WITH ROOT ELEMENT ---
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

  // --- SEARCH AND GRANULARITY RE-EVALUATION ---
  const searchFilteredFiles = useMemo(() => {
    return initialCodebase.files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) || file.language.toLowerCase().includes(searchTerm.toLowerCase()) || file.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = displayLevel === 'all' || file.type === displayLevel;
      return matchesSearch && visibleFiles[file.id] && matchesLevel;
    }).slice(0, maxNodesLimit);
  }, [searchTerm, visibleFiles, displayLevel, maxNodesLimit]);

  // =====================================================================================================
  // 5. ATOMIC COMPONENT POSITIONING SYNCHRONIZER (ELIMINATES ERROR #005 AND DRAG COLLISION CHEVRONS)
  // =====================================================================================================
  useEffect(() => {
    const filesByFolder: Record<string, typeof searchFilteredFiles> = {};
    searchFilteredFiles.forEach(file => {
      const folderKey = file.path.split('/')[0] || 'other';
      if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
      filesByFolder[folderKey].push(file);
    });

    const PADDING_TOP = 65;
    const PADDING_LEFT = 24;
    const PADDING_BOTTOM = 24;
    const GAP_X = 40;
    const GAP_Y = 40;

    const folderBaseX: Record<string, number> = { 'frontend': 40, 'backend': 460, 'config': 1270 };
    const folderBaseY: Record<string, number> = { 'frontend': 80, 'backend': 30, 'config': 160 };
    const folderMaxCols: Record<string, number> = { 'frontend': 1, 'backend': 2, 'config': 1 };

    const calculatedNodes: any[] = [];
    const calculatedEdges: any[] = [];

    // CRITICAL: Parent group configurations are injected FIRST so lookup pipelines locate them during child parsing stages.
    Object.entries(FOLDER_POSITIONS).forEach(([folderKey, initialPos]) => {
      const folderFiles = filesByFolder[folderKey] || [];
      if (folderFiles.length === 0) return;

      const maxCols = folderMaxCols[folderKey] || 1;
      const totalFiles = folderFiles.length;
      const cols = Math.min(totalFiles, maxCols);
      const rows = Math.ceil(totalFiles / maxCols);

      const maxNodeWidth = folderKey === 'config' ? 320 : 288;
      const maxNodeHeight = folderKey === 'config' ? 240 : 280;

      const folderW = PADDING_LEFT * 2 + cols * maxNodeWidth + (cols - 1) * GAP_X;
      const folderH = PADDING_TOP + PADDING_BOTTOM + rows * maxNodeHeight + (rows - 1) * GAP_Y;

      calculatedNodes.push({
        id: `folder__${folderKey}`,
        type: 'folder',
        position: { x: folderBaseX[folderKey], y: folderBaseY[folderKey] },
        style: { width: folderW, height: folderH },
        data: { label: initialPos.label },
        draggable: true,
      });

      folderFiles.forEach((file, index) => {
        const colIdx = index % maxCols;
        const rowIdx = Math.floor(index / maxCols);

        // Strict RELATIVE positions mapped underneath the parent container envelope safely.
        const posX = PADDING_LEFT + colIdx * (maxNodeWidth + GAP_X);
        const posY = PADDING_TOP + rowIdx * (maxNodeHeight + GAP_Y);

        const impactedMembers: string[] = [];
        impactedSet.forEach(item => {
          if (item.startsWith(`${file.id}__member__`)) {
            impactedMembers.push(item.split('__member__')[1]);
          }
        });

        const isNodeImpacted = impactedSet.has(file.id);
        const isDimmed = selectedEntity !== null && impactedSet.size > 0 && !isNodeImpacted;

        calculatedNodes.push({
          id: file.id,
          type: file.type === 'config' ? 'config' : 'umlClass',
          parentNode: `folder__${folderKey}`,
          extent: 'parent', // Native coordinate containment validation rules enforcement.
          position: { x: posX, y: posY },
          data: {
            ...file,
            isDark: isDarkMode,
            isDimmed,
            impactedMembers,
            selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
            onSelectMember: handleSelectMember
          }
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
        const isDimmed = selectedEntity !== null && impactedSet.size > 0 && !isEdgeImpacted;

        const sourceHandleId = dep.sourceHandle === 'header' ? `${dep.sourceNode}__header_source` : `${dep.sourceNode}__method__${dep.sourceHandle}__source`;
        const targetHandleId = dep.targetHandle === 'header' ? `${dep.targetNode}__header_target` : dep.targetNode === 'application.yml' ? `${dep.targetNode}__prop__${dep.targetHandle}__target` : `${dep.targetNode}__method__${dep.targetHandle}__target`;

        let strokeColor = isDarkMode ? '#475569' : '#cbd5e1';
        let strokeDash = '0';
        if (isEdgeImpacted) strokeColor = '#f97316';
        else {
          switch (dep.relation) {
            case 'extends': strokeColor = '#3b82f6'; strokeDash = '5,5'; break;
            case 'implementation': strokeColor = '#818cf8'; strokeDash = '4,4'; break;
            case 'aggregation': strokeColor = '#10b981'; break;
            case 'dependency': strokeColor = '#f59e0b'; strokeDash = '2,2'; break;
          }
        }

        calculatedEdges.push({
          id: dep.id, source: dep.sourceNode, target: dep.targetNode, sourceHandle: sourceHandleId, targetHandle: targetHandleId, animated: isEdgeImpacted, label: dep.label,
          labelStyle: { fill: isDarkMode ? '#94a3b8' : '#475569', fontSize: 9, fontFamily: 'monospace' },
          style: { stroke: strokeColor, strokeWidth: isEdgeImpacted ? 3.5 : 2, strokeDasharray: strokeDash, opacity: isDimmed ? 0.15 : 1, transition: 'all 0.3s' },
          markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor, width: 15, height: 15 },
          interactionWidth: 15
        });
      }
    });

    setRfNodes(calculatedNodes);
    setRfEdges(calculatedEdges);
  }, [searchFilteredFiles, visibleFiles, impactedSet, selectedEntity, isDarkMode, setRfNodes, setRfEdges]);

  // --- AUTOMATED RECIPE AND EXPORTS BUILDERS ---
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

  // --- SUB-PANEL CONTROLS ROUTING ---
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
              {/* Folder frontend / component mapping */}
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

              {/* Folder backend / class mapping */}
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

              {/* Folder config / database configuration mapping */}
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
          <div id="panel-welcome" className="space-y-4 p-4 text-xs">
            <div className="font-semibold text-foreground text-sm">Security Diagnostic Rules</div>
            <div className="flex justify-between items-center bg-muted p-3 border border-border rounded-md">
              <div><span className="font-medium text-foreground text-xs">Security Breaker</span><p className="text-[11px] text-muted-foreground">Simulate isolation anomalies.</p></div>
              <Switch checked={isLocked} onCheckedChange={setIsLocked} />
            </div>
          </div>
        );
      default:
        return <div className="p-4 text-muted-foreground text-xs">Additional contextual view placeholder.</div>;
    }
  };

  return (
    <TooltipProvider>
      <div id="ctn-root" className={`flex flex-col h-screen w-screen overflow-hidden font-sans text-sm select-none transition-colors duration-200 bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>

        {/* FIXED NAVIGATION HEADER ROW */}
        <LayoutPanel
          id="ctn-header"
          className="z-20 bg-card px-3 border-border border-b h-[40px] shrink-0"
          left={
            <>
              <Button variant="ghost" size="icon" onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')} className="w-8 h-8 text-muted-foreground hover:text-foreground"><Menu size={16} /></Button>
              <div className="flex items-center gap-2 ml-1 text-primary cursor-help"><span className="font-bold text-foreground text-xs tracking-tight">Archi-Polyglot Workspace</span></div>
            </>
          }
          center={
            <div className="relative flex items-center w-full max-w-md">
              <Search className="left-2 absolute text-muted-foreground" size={14} />
              <Input type="text" placeholder="FQN search routing entity mapping..." className="bg-muted pl-8 h-8 text-xs" disabled={isLocked} />
            </div>
          }
          right={
            <div className="flex items-center gap-1">
              <button onClick={() => setImportOpen(true)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Import"><Upload size={16} /></button>
              <button onClick={() => setExportOpen(true)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Export"><Download size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Toggle Theme">
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={resetAllFilters} className="hover:bg-muted p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Reset Workspace"><RotateCcw size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>

              {/* TOGGLE VISIBILITY CONTROL BUTTON ARRAYS */}
              <button id="btn-toggle-main" onClick={() => setIsCtnWorkspaceVisible(!isCtnWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceVisible ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} title="Workspace Frame"><Eye size={16} /></button>
              <button id="btn-toggle-main-header" onClick={() => setIsCtnWorkspaceTopVisible(!isCtnWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceTopVisible ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} title="Top Paths Container"><Eye size={16} /></button>
              <button id="btn-toggle-main-left" onClick={() => setIsCtnWorkspaceLeftVisible(!isCtnWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceLeftVisible ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} title="Left Filter Stream"><Eye size={16} /></button>
              <button id="btn-toggle-main-center" onClick={() => setIsCtnWorkspaceCenterVisible(!isCtnWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceCenterVisible ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} title="Center Canvas Stage"><Eye size={16} /></button>
              <button id="btn-toggle-workspace-right" onClick={() => setIsCtnWorkspaceRightVisible(!isCtnWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceRightVisible ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} title="Right Side Workspace View"><Eye size={16} /></button>
              <button id="btn-toggle-workspace-bottom" onClick={() => setIsCtnWorkspaceBottomVisible(!isCtnWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isCtnWorkspaceBottomVisible ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} title="Bottom Terminals"><Eye size={16} /></button>
              <div className="mx-1 bg-border w-px h-4"></div>
              <button id="btn-toggle-main-right" onClick={() => setIsSidebarRightVisible(!isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 ${isSidebarRightVisible ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} title="Inspector Panel"><Eye size={16} /></button>
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
            <Sidebar width={sidebarLeftMode === 'minimal' ? '56px' : `${sidebarLeftWidth}px`}>
              <SidebarContent>
                <SidebarGroup><SidebarMenu>{SIDEBAR_MENU_ITEMS.filter(item => !item.bottom).map(item => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={activeView === item.id} onClick={() => setActiveView(item.id)}>
                      <item.icon size={16} className="mr-2.5 shrink-0" />
                      {sidebarLeftMode === 'normal' && <span className="truncate">{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}</SidebarMenu></SidebarGroup>
              </SidebarContent>
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
                <ResizableContainer id="ctn-workspace-left" visible={isCtnWorkspaceLeftVisible} style={{ width: `${mainLeftWidth}%` }} headerLeft="Structure Controls" className="border-r min-w-[200px]" resizeHandle="right" onResizeStart={startmainLeftResize}>
                  {renderViewContent()}
                </ResizableContainer>

                {/* CORE SYSTEM TOPOLOGICAL NETSTAGE CANVAS OVERLAY CONTROL TIERS */}
                <ResizableContainer
                  id="ctn-workspace-center"
                  visible={isCtnWorkspaceCenterVisible || isGraphMaximized}
                  style={isGraphMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : { flex: 1 }}

                  /* INTEGRATED TOGGLE DOTS BACKGROUND CONTROLLER INSIDE THE HEADER LEFT FRAME FRAME */
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

                  /* CORE ACTIONABLE CONTROLS METRICS LABELS STRINGS */
                  headerCenter={
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm" title="Maximum sequential nodes rendering constraint limit">
                        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
                        <Input type="number" id="graph-input-limit" min={1} max={100} className="bg-transparent text-foreground shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-xs text-center" value={maxNodesLimit} onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)} />
                      </div>

                      <Button id="btn-open-neo4j" className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 hover:from-orange-500 to-orange-500 hover:to-orange-400 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider" onClick={() => console.log("Routing execution context down onto stand-alone browser frame layout terminal console.")}>
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
                      <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => { setIsGraphMaximized(!isGraphMaximized); }}><Maximize size={12}/></Button>
                    </div>
                  }
                  className="bg-background"
                >
                  <div id="panel-graph-canvas" className="absolute inset-0 outline-none w-full h-full">
                    {/* Floating Guide Description box */}
                    <div className="top-4 left-4 z-10 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto">
                      <div className="flex items-center gap-2 mb-1"><Info size={14} className="text-primary" /><span className="font-bold">Surgical Port-to-Port Analysis</span></div>
                      <p className="text-[10px] text-muted-foreground">Each structural method block row features dedicated mapping anchor lines. Click on any method line item row to compute dynamic BFS tracking graphs instantly.</p>
                    </div>

                    <ReactFlow nodes={rfNodes} edges={rfEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypesMap} fitView minZoom={0.1} maxZoom={2}>
                      {showGrid && <Background variant="dots" color={isDarkMode ? '#334155' : '#cbd5e1'} gap={16} size={1} />}
                      <Controls className="!bg-card !shadow-md !border-border" />
                      <MiniMap nodeColor={n => n.type === 'config' ? '#f59e0b' : '#3b82f6'} className="!bg-card !border-border" />
                    </ReactFlow>
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

                                  {/* Restored functional documentation block snippet */}
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
                                  <p className="font-mono text-[10px] text-muted-foreground">Impacted structures highlight in high-contrast orange across the layout stage canvas:</p>
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
        <LayoutPanel id="ctn-footer" className="z-20 bg-primary px-3 h-[35px] text-primary-foreground text-xs select-none shrink-0" left={<><Server size={13} className="mr-1.5"/><span className="font-medium">Analysis Subsystems Synced</span></>} center={<div className="font-mono">Active Topology Nodes Rendered: {visibleCount}</div>} right={<div>React Flow Pipeline Core</div>} />

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
EOF

# Trigger standard production build to verify syntax and cross-module link integrity
npm run build

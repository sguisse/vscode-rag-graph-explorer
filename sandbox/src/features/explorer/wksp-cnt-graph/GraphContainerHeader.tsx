import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export const GraphContainerHeaderLeft = ({ showGrid, setShowGrid }: any) => (
  <div className="flex items-center gap-2">
    <span>Topological Network</span>
    <Button variant="ghost" size="icon" className={`h-5 w-5 rounded transition-colors ${showGrid ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`} onClick={() => setShowGrid(!showGrid)}>
      <Grid size={12} />
    </Button>
  </div>
);

export const GraphContainerHeaderCenter = ({ maxNodesLimit, setMaxNodesLimit, callersDepth, setCallersDepth, calleesDepth, setCalleesDepth, displayLevel, setDisplayLevel, currentLayout, setCurrentLayout }: any) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
      <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
      <Input type="number" min={1} max={100} className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center" value={maxNodesLimit} onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)} />
    </div>
    <Button className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider">
      <Database size={11} /> Neo4j
    </Button>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <User size={12} className="text-muted-foreground" />
      <Input type="number" min={0} max={20} className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center" value={callersDepth} onChange={(e) => setCallersDepth(Number(e.target.value) || 0)} />
    </div>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <Baby size={12} className="text-muted-foreground" />
      <Input type="number" min={0} max={20} className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center" value={calleesDepth} onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)} />
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={displayLevel} onValueChange={setDisplayLevel}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-24 h-5 text-[11px] text-foreground"><SelectValue placeholder="Granularity" /></SelectTrigger>
        <SelectContent side="bottom"><SelectItem value="all">Show All</SelectItem><SelectItem value="component">Component</SelectItem><SelectItem value="class">Class</SelectItem><SelectItem value="interface">Interface</SelectItem><SelectItem value="module">Module</SelectItem><SelectItem value="config">Configuration</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={currentLayout} onValueChange={setCurrentLayout}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-28 h-5 text-[11px] text-foreground"><SelectValue placeholder="Layout Architecture" /></SelectTrigger>
        <SelectContent side="bottom"><SelectItem value="preset">Default (Packages)</SelectItem><SelectItem value="grid">Grid Distribution</SelectItem><SelectItem value="breadthfirst">Hierarchical (BFS)</SelectItem><SelectItem value="cose">Force-Directed (Cose)</SelectItem></SelectContent>
      </Select>
    </div>
  </div>
);

export const GraphContainerHeaderRight = ({ cyRef, isGraphMaximized, setIsGraphMaximized }: any) => (
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}><Plus size={12}/></Button>
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}><Minus size={12}/></Button>
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => { cyRef.current?.fit(); cyRef.current?.center(); }}><Focus size={12}/></Button>
    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setIsGraphMaximized(!isGraphMaximized)}>{isGraphMaximized ? <Minimize size={12}/> : <Maximize size={12}/>}</Button>
  </div>
);

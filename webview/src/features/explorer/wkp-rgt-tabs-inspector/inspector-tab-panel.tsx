import React, { useMemo } from 'react';
import { FileCode, ShieldAlert, GitFork, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  ImpactDirection,
  CodebaseMethod,
  ConfigProperty,
  generateMarkdownRecipe
} from '@/shared/services/graph-rag-explorer';

interface InspectorTabPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  impactDirection: ImpactDirection;
  setImpactDirection: (dir: ImpactDirection) => void;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function InspectorTabPanel({
  selectedEntity,
  initialCodebase,
  impactDirection,
  setImpactDirection,
  impactedSet,
  handleCopy
}: InspectorTabPanelProps) {

  const generatedMarkdownRecipe = useMemo(() => {
    return generateMarkdownRecipe(selectedEntity, impactDirection, impactedSet, initialCodebase);
  }, [selectedEntity, impactDirection, impactedSet, initialCodebase]);

  if (!selectedEntity) {
    return (
      <div className="py-12 text-muted-foreground text-center">
        <ShieldAlert size={36} className="opacity-40 mx-auto mb-2 text-muted-foreground" />
        <h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4>
        <p className="mx-auto mt-1 max-w-[240px] text-muted-foreground text-xs">Click any file component link row or surgical grid handle item to initialize graph mapping parameters.</p>
      </div>
    );
  }

  const currentFile = initialCodebase.files.find((f: CodebaseFile) => f.id === selectedEntity.nodeId);
  if (!currentFile) return null;

  return (
    <div className="space-y-4 animate-in duration-200 fade-in">
      {/* Active Element Properties Block */}
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
            currentFile.methods?.find((m: CodebaseMethod) => m.id === selectedEntity.memberId)?.description ||
            currentFile.configProperties?.find((p: ConfigProperty) => p.key === selectedEntity.memberId)?.value ||
            "No dedicated structural descriptions mapped for this member item node."
          ) : (
            `File container encapsulating target polyglot implementation layers at specified location pathing.`
          )}
        </div>
      </div>

      {/* Impact Direction Controls */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-mono font-bold text-[11px] text-muted-foreground uppercase">Impact Propagation</label>
          <span className="bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded font-mono text-[10px] text-amber-500">Transitive BFS</span>
        </div>
        <div className="gap-2 grid grid-cols-2">
          <Button onClick={() => setImpactDirection('aval')} className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 ${impactDirection === 'aval' ? 'bg-orange-500 border-orange-400 text-white shadow-md' : 'bg-muted border-border text-foreground'}`}><GitFork size={13} className="rotate-180" />Downstream</Button>
          <Button onClick={() => setImpactDirection('amont')} className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 ${impactDirection === 'amont' ? 'bg-orange-500 border-orange-400 text-white shadow-md' : 'bg-muted border-border text-foreground'}`}><GitFork size={13} />Upstream</Button>
        </div>
      </div>

      {/* Fluorescent Impact Plan */}
      <div className="space-y-3 bg-orange-500/5 p-4 border border-orange-500/25 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-orange-500" /><h5 className="font-mono font-bold text-orange-500 text-xs">Fluorescent Impact Plan</h5></div>
          <Button onClick={() => handleCopy(generatedMarkdownRecipe, "Markdown impact recipe copied to clip-board!")} className="flex items-center gap-1 bg-muted hover:bg-muted/80 px-2 py-1 border border-border rounded h-6 font-mono text-[10px] text-foreground">
            <Copy size={10} />Copy Recipes
          </Button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {initialCodebase.files.map((f: CodebaseFile) => impactedSet.has(f.id) ? (
            <div key={f.id} className="flex justify-between items-center bg-background px-2 py-1.5 border border-orange-500/20 rounded font-mono text-[11px]"><span className="font-semibold text-foreground truncate">{f.name}</span><span className="bg-muted px-1.5 py-0.5 rounded text-[9px] text-muted-foreground">{f.language}</span></div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}

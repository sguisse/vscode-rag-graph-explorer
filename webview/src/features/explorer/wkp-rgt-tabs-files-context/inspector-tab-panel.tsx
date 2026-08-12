import React from 'react';
import { FileCode, ShieldAlert, Fingerprint, Tag, Code2, Layers, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';

interface InspectorTabPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function InspectorTabPanel({
  selectedEntity,
  initialCodebase,
}: InspectorTabPanelProps) {

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

      {/* Entity Properties Panel */}
      <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
        <CardHeader className="bg-muted/40 p-3 border-border/60 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary shrink-0" />
              <CardTitle className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
                Identity Attributes
              </CardTitle>
            </div>
            <span className="bg-primary/10 px-2 py-0.5 rounded-full font-mono font-semibold text-[10px] text-primary uppercase">
              {selectedEntity.type}
            </span>
          </div>
          <CardDescription className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            Global entity property parameters
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2.5 p-3 font-mono text-[11px]">
          <div className="space-y-1.5 bg-muted/30 p-2 border border-border/40 rounded-md">
            <div className="flex items-center gap-1 font-semibold text-[10px] text-muted-foreground uppercase">
              <Hash className="w-3 h-3 text-primary" /> FQN Identifier
            </div>
            <div className="bg-background/80 p-1.5 border border-border/30 rounded font-medium text-foreground text-xs break-all">
              {selectedEntity.nodeId}
            </div>
          </div>

          <div className="gap-2 grid grid-cols-2 pt-1">
            <div className="bg-muted/20 p-2 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                <Tag className="w-3 h-3 text-amber-500" /> Entity Type
              </span>
              <span className="block mt-0.5 font-bold text-foreground text-xs uppercase">
                {selectedEntity.type}
              </span>
            </div>

            <div className="bg-muted/20 p-2 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                <Layers className="w-3 h-3 text-indigo-500" /> Target Member
              </span>
              <span className="block mt-0.5 font-bold text-foreground text-xs truncate">
                {selectedEntity.memberId ? `${selectedEntity.memberId}()` : 'N/A'}
              </span>
            </div>
          </div>

          {selectedEntity.edgeId && (
            <div className="bg-muted/20 p-2 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                <Code2 className="w-3 h-3 text-emerald-500" /> Edge ID
              </span>
              <span className="block mt-0.5 font-bold text-foreground text-xs break-all">
                {selectedEntity.edgeId}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

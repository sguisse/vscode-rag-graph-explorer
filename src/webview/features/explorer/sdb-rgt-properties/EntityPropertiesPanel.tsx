import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Fingerprint, Tag, Code2, Layers, Info, Hash } from 'lucide-react';
import { SelectedEntity } from '@/services/codebase';

interface Props {
  selectedEntity: SelectedEntity | null;
}

export function EntityPropertiesPanel({ selectedEntity }: Props) {
  if (!selectedEntity) {
    return (
      <div className="flex flex-col items-center justify-center p-6 py-12 text-center text-muted-foreground">
        <Info className="w-8 h-8 mb-2 opacity-40 text-muted-foreground" />
        <p className="font-mono text-xs font-medium">No selection active</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-[200px]">
          Select an AST node or member in the graph or explorer to inspect identity properties.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 text-xs animate-in fade-in duration-200">
      <Card className="bg-card/50 border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/40 border-b border-border/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary shrink-0" />
              <CardTitle className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                Identity Attributes
              </CardTitle>
            </div>
            <span className="bg-primary/10 text-primary font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
              {selectedEntity.type}
            </span>
          </div>
          <CardDescription className="text-[10px] text-muted-foreground font-mono mt-0.5">
            Global entity property parameters
          </CardDescription>
        </CardHeader>

        <CardContent className="p-3 space-y-2.5 font-mono text-[11px]">
          <div className="bg-muted/30 p-2 rounded-md border border-border/40 space-y-1.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <Hash className="w-3 h-3 text-primary" /> FQN Identifier
            </div>
            <div className="text-foreground font-medium text-xs break-all bg-background/80 p-1.5 rounded border border-border/30">
              {selectedEntity.nodeId}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-muted/20 p-2 rounded border border-border/30">
              <span className="block text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" /> Entity Type
              </span>
              <span className="font-bold text-foreground text-xs uppercase mt-0.5 block">
                {selectedEntity.type}
              </span>
            </div>

            <div className="bg-muted/20 p-2 rounded border border-border/30">
              <span className="block text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-500" /> Target Member
              </span>
              <span className="font-bold text-foreground text-xs mt-0.5 block truncate">
                {selectedEntity.memberId ? `${selectedEntity.memberId}()` : 'N/A'}
              </span>
            </div>
          </div>

          {selectedEntity.edgeId && (
            <div className="bg-muted/20 p-2 rounded border border-border/30">
              <span className="block text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Code2 className="w-3 h-3 text-emerald-500" /> Edge ID
              </span>
              <span className="font-bold text-foreground text-xs mt-0.5 block break-all">
                {selectedEntity.edgeId}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

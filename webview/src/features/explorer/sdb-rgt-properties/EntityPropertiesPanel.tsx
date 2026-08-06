import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Fingerprint, Tag, Code2, Layers, Info, Hash } from 'lucide-react';
import { SelectedEntity } from '@/shared/services/graph-rag-explorer/domain/model/codebase.model';
interface Props {
  selectedEntity: SelectedEntity | null;
}
export function EntityPropertiesPanel({ selectedEntity }: Props) {
  if (!selectedEntity) {
    return (
      <div className="flex flex-col justify-center items-center p-6 py-12 text-muted-foreground text-center">
        <Info className="opacity-40 mb-2 w-8 h-8 text-muted-foreground" />
        <p className="font-mono font-medium text-xs">No selection active</p>
        <p className="mt-1 max-w-[200px] text-[11px] text-muted-foreground/70">
          Select an AST node or member in the graph or explorer to inspect identity properties.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 text-xs animate-in duration-200 fade-in">
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

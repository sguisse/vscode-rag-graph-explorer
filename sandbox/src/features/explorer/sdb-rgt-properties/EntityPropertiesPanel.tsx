import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  selectedEntity: { type: 'node' | 'member' | 'edge'; nodeId: string; memberId?: string; edgeId?: string; } | null;
}

export function EntityPropertiesPanel({ selectedEntity }: Props) {
  return (
    <div className="space-y-3 p-4 text-xs">
      {selectedEntity ? (
        <Card className="bg-muted shadow-none border-border">
          <CardHeader className="bg-secondary/50 p-3 border-b">
            <span className="font-bold text-foreground">Global Identity attributes</span>
          </CardHeader>
          <CardContent className="space-y-1 p-3 font-mono text-[11px] text-muted-foreground">
            <div>FQN: <span className="text-foreground">{selectedEntity.nodeId}</span></div>
            <div>Type: <span className="text-foreground">{selectedEntity.type}</span></div>
            {selectedEntity.memberId && <div>Target Member: <span className="text-foreground">{selectedEntity.memberId}()</span></div>}
          </CardContent>
        </Card>
      ) : (
        <div className="py-8 text-muted-foreground text-center">No selection parameter state active</div>
      )}
    </div>
  );
}

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Target } from 'lucide-react';
import { useMaturityMatrixState } from '../../hooks/useMaturityMatrixState';

export const CategoryDetailsTab: React.FC = () => {
  const { selectedCategory } = useMaturityMatrixState();

  return (
    <div className="p-3 space-y-3 font-mono text-xs h-full overflow-y-auto bg-background">
      <Card className="p-3 space-y-3 bg-card border border-border">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h3 className="text-sm font-bold text-primary">{selectedCategory.name}</h3>
            <p className="text-[11px] text-muted-foreground">{selectedCategory.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Current: Level {selectedCategory.currentLevel}
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/30">
              Target: Level {selectedCategory.targetLevel}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Target className="text-primary" size="{13}"/>
            <span>Target Capabilities & Standards dfdffd</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedCategory.capabilities.map((cap, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-muted/30 border border-border/60 rounded-md"
                data-tooltip={`Capability verification: ${cap}`}
              >
                <CheckCircle2 className="text-emerald-500 shrink-0" size="{14}"/>
                <span className="text-[11px] font-medium text-foreground">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CategoryDetailsTab;

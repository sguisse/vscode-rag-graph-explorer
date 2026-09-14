import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Cpu } from 'lucide-react';
import { useMaturityMatrixState } from '../../hooks/useMaturityMatrixState';

export const MaturityReportTab: React.FC = () => {
  const { categories } = useMaturityMatrixState();

  const totalCurrent = categories.reduce((sum, c) => sum + c.currentLevel, 0);
  const totalTarget = categories.reduce((sum, c) => sum + c.targetLevel, 0);
  const overallPercentage = Math.round((totalCurrent / totalTarget) * 100);

  return (
    <div className="p-3 space-y-3 font-mono text-xs h-full overflow-y-auto bg-background">
      <Card className="p-3 space-y-3 bg-card border border-border">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary" size="{16}"/>
            <h3 className="text-sm font-bold text-foreground">Maturity Scorecard</h3>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/30 font-bold">
            Score: {overallPercentage}% Complete
          </Badge>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => {
            const pct = Math.round((cat.currentLevel / cat.targetLevel) * 100);
            return (
              <div key={cat.id} className="space-y-1 bg-muted/20 p-2 border border-border/40 rounded-md">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Cpu className="text-primary" size="{12}"/>
                    <span>{cat.name}</span>
                  </span>
                  <span className="text-muted-foreground font-mono">
                    L{cat.currentLevel} / L{cat.targetLevel} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground italic">
          <TrendingUp className="text-emerald-500 shrink-0" size="{13}"/>
          <span>Evaluation based on tri-layer architecture invariants and GraphRAG standards.</span>
        </div>
      </Card>
    </div>
  );
};

export default MaturityReportTab;

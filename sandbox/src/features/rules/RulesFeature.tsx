import React from 'react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { Play } from 'lucide-react';

export function RulesFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const leftContent = (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div className="space-y-1.5" data-tooltip="Select a pre-configured AST validation rule pattern">
        <label className="font-medium text-muted-foreground text-xs">Pre-configured Rule</label>
        <Select defaultValue="layer-bypass">
          <SelectTrigger className="bg-card w-full"><SelectValue placeholder="Select Rule" /></SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="layer-bypass">Layer bypass detection</SelectItem>
            <SelectItem value="cyclic">Cyclic dependencies detected</SelectItem>
            <SelectItem value="orphan">Orphan methods</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col flex-1 space-y-1.5">
        <LeftCenterRightPanel
          id="panel-cypher-editor"
          left={<span className="font-medium text-muted-foreground text-xs">Cypher Editor</span>}
          right={<Button variant="ghost" size="sm" className="px-2 h-6 text-primary"><Play size={12} className="mr-1"/> Execute</Button>}
        />
        <Textarea className="flex-1 bg-muted/50 border-border font-mono text-foreground text-xs resize-none" defaultValue={"MATCH (c:Controller)-[r:CALLS]->(repo:Repository)\nRETURN c.name, repo.name, type(r)"} />
      </div>
    </div>
  );

  return (
    <AppLayout
      {...props}
      layoutConfig={{ showLeft: true }}
      panels={{ left: leftContent }}
      headers={{ leftPanelTitle: "Cypher Rules" }}
    />
  );
}

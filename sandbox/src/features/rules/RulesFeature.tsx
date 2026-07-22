import React, { useState } from 'react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { Play } from 'lucide-react';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { RULE_PATTERN_LIST, RULE_PATTERN_ICON_MAP } from '@/services/codebase';

export function RulesFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const [selectedRule, setSelectedRule] = useState<string>('layer-bypass');

  const leftContent = (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div data-tooltip="Select a pre-configured AST validation rule pattern">
        <SelectFromTypeBuilder
          id="select-rule-pattern"
          label="Pre-configured Rule"
          desc="Select a pattern to validate against AST graph"
          value={selectedRule}
          onChange={setSelectedRule}
          options={RULE_PATTERN_LIST.map((key) => ({
            value: key,
            icon: RULE_PATTERN_ICON_MAP[key].icon,
            label: RULE_PATTERN_ICON_MAP[key].label,
          }))}
        />
      </div>
      <div className="flex flex-col flex-1 space-y-1.5">
        <LeftCenterRightPanel
          id="panel-cypher-editor"
          left={<span className="font-medium text-muted-foreground text-xs">Cypher Editor</span>}
          right={
            <Button id="btn-execute-cypher" variant="ghost" size="sm" className="px-2 h-6 text-primary">
              <Play size={12} className="mr-1"/> Execute
            </Button>
          }
        />
        <Textarea
          id="textarea-cypher-query"
          className="flex-1 bg-muted/50 border-border font-mono text-foreground text-xs resize-none"
          defaultValue={"MATCH (c:Controller)-[r:CALLS]->(repo:Repository)\nRETURN c.name, repo.name, type(r)"}
        />
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

import React from 'react';
import { Info } from 'lucide-react';
import { BaseNodeContainer } from './BaseNodeContainer';
import { WorkflowNode } from '../../model-ui';

export function AnnotationNodeView({ node }: { node: WorkflowNode }) {
  const title = node.data.annotationTitle || 'AI agent setup';
  const steps: string[] = node.data.annotationSteps || [
    'Choose a model',
    'Set token budget',
    'Connect prompt & skill',
    'Add agent tools',
    'Run & view result',
  ];
  const tip = node.data.annotationTip || 'Tip: Runs with mock data by default — add your API key to use a real LLM.';

  return (
    <BaseNodeContainer node={node} icon={Info} headerBg="bg-sky-500/15">
      <div className="space-y-2 bg-sky-500/10 p-2 border border-sky-500/20 rounded-md h-full font-mono text-xs">
        <div className="flex items-center gap-1.5 font-bold text-sky-500 text-xs">
          <Info size={15} className="shrink-0" />
          <span>{title}</span>
        </div>

        <ol className="space-y-0.5 ml-1 text-[11px] text-foreground/90 list-decimal list-inside">
          {steps.map((step: string, idx: number) => (
            <li key={idx} className="truncate">{step}</li>
          ))}
        </ol>

        <div className="flex items-start gap-1 bg-background/80 p-1.5 border border-sky-500/20 rounded text-[10px] text-muted-foreground leading-tight">
          <span className="shrink-0">💡</span>
          <span>{tip}</span>
        </div>
      </div>
    </BaseNodeContainer>
  );
}

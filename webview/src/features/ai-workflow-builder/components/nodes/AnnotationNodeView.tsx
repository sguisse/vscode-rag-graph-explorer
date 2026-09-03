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
  const tip = node.data.annotationTip || 'Tip: Runs with mock data by default — add your Anthropic or OpenAI API key to use a real LLM.';

  return (
    <BaseNodeContainer node={node} icon={Info} headerBg="bg-sky-500/15">
      <div className="flex flex-col gap-2 bg-sky-500/10 p-2 border border-sky-500/20 rounded-md h-full font-mono text-xs overflow-hidden select-none">
        <div className="flex items-center gap-1.5 font-bold text-sky-500 text-xs shrink-0">
          <Info size={15} className="shrink-0" />
          <span className="whitespace-nowrap">{title}</span>
        </div>

        <ol className="flex flex-col gap-1 ml-1 text-[11px] text-foreground/90 list-decimal list-inside shrink-0">
          {steps.map((step: string, idx: number) => (
            <li key={idx} className="truncate">{step}</li>
          ))}
        </ol>

        <div className="flex items-start gap-1 bg-background/80 p-1.5 border border-sky-500/20 rounded text-[10px] text-muted-foreground leading-tight shrink-0 mt-auto">
          <span className="shrink-0">💡</span>
          <span className="line-clamp-2">{tip}</span>
        </div>
      </div>
    </BaseNodeContainer>
  );
}

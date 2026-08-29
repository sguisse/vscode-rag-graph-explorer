import React from 'react';
import { TransformerWorkflow } from '../../../types/transformer.types';
import { useWorkflowGraph } from '../hooks/use-workflow-graph';

interface GraphDesignTabProps {
  parsedWorkflow: TransformerWorkflow;
}

export const GraphDesignTab: React.FC<GraphDesignTabProps> = ({ parsedWorkflow }) => {
  const { containerRef } = useWorkflowGraph(parsedWorkflow);

  return (
    <div className="w-full h-full relative bg-slate-950 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};

import React from 'react';
import { WorkflowHeader } from './header/WorkflowHeader';
import { CytoscapeCanvas } from './canvas/CytoscapeCanvas';

export function WorkflowBuilderPanel() {
  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-card">
      <WorkflowHeader />
      <CytoscapeCanvas />
    </div>
  );
}

export default WorkflowBuilderPanel;

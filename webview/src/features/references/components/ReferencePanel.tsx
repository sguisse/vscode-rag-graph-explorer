import React from 'react';
import { ProjectReferencesPanel } from '@/components/app/project-references';

export function ReferencePanel() {
  return (
    <div className="flex flex-col bg-background p-3 w-full h-full min-h-0 overflow-y-auto font-mono text-xs">

      <div className="bg-indigo-500/5 p-3 border border-indigo-500/20 rounded-lg">
            <h4 className="font-bold text-foreground text-sm uppercase">Project References</h4>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Manage and explore project references efficiently, ensuring high-quality, predictable outputs.
            </p>
          </div>

      <ProjectReferencesPanel
        localDocumentStorage="global-project-references"
        viewMode="Administrator"
        collapsibleParentIncluded={false}
      />
    </div>
  );
}

export default ReferencePanel;

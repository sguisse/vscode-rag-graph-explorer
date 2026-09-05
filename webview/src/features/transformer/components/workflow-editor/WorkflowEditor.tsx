import React from 'react';
import { FileCode, ListTree, Network, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowEditor } from './hooks/use-workflow-editor';
import { WorkflowEditorProps } from './types/workflow-editor.types';
import { JsonSourceTab } from './tabs/JsonSourceTab';
import { TreeTableTab } from './tabs/TreeTableTab';
import { GraphDesignTab } from './tabs/GraphDesignTab';

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflowJsonText,
  setWorkflowJsonText,
  workflowParseError,
  parsedWorkflow,
  onSelectVariable,
}) => {
  const { activeTab, setActiveTab } = useWorkflowEditor();

  return (
    <div className="flex flex-col h-full w-full bg-card min-h-0 font-mono text-xs">
      {/* Tab Navigation Toolbar */}
      <div className="flex items-center justify-between bg-muted/60 p-1 border-b border-border shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('json')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              activeTab === 'json'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <FileCode size={13} className={activeTab === 'json' ? 'text-primary' : ''} />
            <span>JSON Source</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('tree')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              activeTab === 'tree'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <ListTree size={13} className={activeTab === 'tree' ? 'text-primary' : ''} />
            <span>Table</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('graph')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              activeTab === 'graph'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <Network size={13} className={activeTab === 'graph' ? 'text-primary' : ''} />
            <span>Design Graph</span>
          </Button>
        </div>

        {activeTab === 'graph' && (
          <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold mr-1">
            <Lock size={10} /> Read-Only
          </span>
        )}
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'json' && (
          <JsonSourceTab
            workflowJsonText={workflowJsonText}
            setWorkflowJsonText={setWorkflowJsonText}
            workflowParseError={workflowParseError}
          />
        )}
        {activeTab === 'tree' && (
          <TreeTableTab parsedWorkflow={parsedWorkflow} onSelectVariable={onSelectVariable} />
        )}
        {activeTab === 'graph' && (
          <GraphDesignTab parsedWorkflow={parsedWorkflow} />
        )}
      </div>
    </div>
  );
};

export default WorkflowEditor;

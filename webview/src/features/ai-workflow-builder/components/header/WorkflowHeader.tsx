import React, { useState } from 'react';
import { Play, RotateCcw, Key, Download, Upload, Loader2, Sparkles, LayoutGrid, Maximize, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { useWorkflowExecution } from '../../hooks/use-workflow-execution';
import { useCytoscapeGraph } from '../../hooks/use-cytoscape-graph';
import { exportCanvasToImage } from '../../utils/canvas-export.utils';
import { ApiKeyDialog } from './ApiKeyDialog';
import { HeaderTemplateSelector } from './HeaderTemplateSelector';

export function WorkflowHeader() {
  const { isRunning, resetWorkflow, nodes, edges, loadWorkflow, addLog } = useWorkflowStore();
  const { runWorkflow } = useWorkflowExecution();
  const { rearrangeLayout, zoomToFit } = useCytoscapeGraph();
  const [isKeyOpen, setIsKeyOpen] = useState(false);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', 'ai-workflow-builder.json');
    dl.click();
    dl.remove();
    addLog('💾 Exported workflow schema to JSON.');
  };

  const handleExportPng = () => {
    exportCanvasToImage('workflow-canvas-container', 'ai-workflow-diagram.png');
    addLog('🖼️ Exported workflow diagram to PNG image.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          loadWorkflow(parsed);
        }
      } catch (err) {
        addLog('❌ Failed to parse workflow JSON schema.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex justify-between items-center bg-muted/20 p-2 border-border border-b h-10 w-full font-mono text-xs shrink-0 select-none">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-bold text-foreground">
          <Sparkles size={15} className="text-primary" /> AI Workflow Builder
        </span>
        <HeaderTemplateSelector />
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={rearrangeLayout}
          className="h-7 text-xs gap-1"
          data-tooltip="Auto Rearrange DAG Layout"
        >
          <LayoutGrid size={13} className="text-indigo-400" /> Rearrange
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={zoomToFit}
          className="h-7 text-xs gap-1"
          data-tooltip="Zoom to Fit Canvas"
        >
          <Maximize size={13} /> Fit
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsKeyOpen(true)}
          className="h-7 text-xs gap-1"
          data-tooltip="Configure LLM API Key"
        >
          <Key size={13} className="text-amber-500" /> API Key
        </Button>

        <label className="cursor-pointer">
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          <span className="inline-flex items-center gap-1 hover:bg-muted px-2 py-1 rounded text-muted-foreground hover:text-foreground text-xs transition-colors">
            <Upload size={13} /> Import
          </span>
        </label>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportJson}
          className="h-7 text-xs gap-1"
          data-tooltip="Export Workflow JSON"
        >
          <Download size={13} /> JSON
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportPng}
          className="h-7 text-xs gap-1"
          data-tooltip="Export Canvas PNG Image"
        >
          <ImageIcon size={13} className="text-emerald-500" /> PNG
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={resetWorkflow}
          className="h-7 text-xs gap-1"
          data-tooltip="Reset to Default Preset"
        >
          <RotateCcw size={13} /> Reset
        </Button>

        <Button
          size="sm"
          disabled={isRunning}
          onClick={runWorkflow}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm h-7 font-bold text-white text-xs gap-1.5 cursor-pointer"
        >
          {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          {isRunning ? 'Running...' : 'Run'}
        </Button>
      </div>

      <ApiKeyDialog open={isKeyOpen} onOpenChange={setIsKeyOpen} />
    </div>
  );
}

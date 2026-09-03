import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Key,
  Download,
  Upload,
  Loader2,
  Sparkles,
  LayoutGrid,
  Maximize,
  Image as ImageIcon,
  Grid,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { useWorkflowExecution } from '../../hooks/use-workflow-execution';
import { useCytoscapeGraph, LayoutOrientation } from '../../hooks/use-cytoscape-graph';
import { generateCanvasImage, RenderedCanvasImageResult } from '../../utils/canvas-export.utils';
import { ApiKeyDialog } from './ApiKeyDialog';
import { HeaderTemplateSelector } from './HeaderTemplateSelector';
import { ExportImageModal } from './ExportImageModal';

export function WorkflowHeader() {
  const {
    isRunning,
    resetWorkflow,
    nodes,
    edges,
    loadWorkflow,
    addLog,
    showGrid,
    toggleGrid,
    collapseAllNodes,
    expandAllNodes,
  } = useWorkflowStore();
  const { runWorkflow } = useWorkflowExecution();
  const { rearrangeLayout, zoomToFit } = useCytoscapeGraph();
  const [isKeyOpen, setIsKeyOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutOrientation>('horizontal-steps');

  // PNG Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [imageData, setImageData] = useState<RenderedCanvasImageResult | null>(null);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', 'ai-workflow-builder.json');
    dl.click();
    dl.remove();
    addLog('💾 Exported workflow schema to JSON.');
  };

  const handleOpenExportPngModal = async () => {
    setIsExporting(true);
    addLog('🖼️ Rendering canvas PNG image...');
    try {
      const result = await generateCanvasImage('workflow-canvas-container');
      if (result) {
        setImageData(result);
        setExportModalOpen(true);
        addLog('✅ Canvas PNG diagram generated.');
      } else {
        addLog('❌ Failed to render canvas PNG image.');
      }
    } catch (err) {
      addLog('❌ Error during canvas PNG image generation.');
    } finally {
      setIsExporting(false);
    }
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

  const handleLayoutSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as LayoutOrientation;
    setLayoutMode(mode);
    rearrangeLayout(mode);
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
        {/* Collapse All / Expand All Buttons */}
        <Button
          size="sm"
          variant="ghost"
          onClick={collapseAllNodes}
          className="h-7 text-xs gap-1"
          data-tooltip="Collapse All Nodes (150x150)"
        >
          <ChevronsDownUp size={13} className="text-amber-400" /> Collapse All
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={expandAllNodes}
          className="h-7 text-xs gap-1"
          data-tooltip="Expand All Nodes"
        >
          <ChevronsUpDown size={13} className="text-emerald-400" /> Expand All
        </Button>

        {/* Step-Satellite Rearrange Combo Selector */}
        <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded">
          <LayoutGrid size={13} className="text-indigo-400 shrink-0" />
          <select
            value={layoutMode}
            onChange={handleLayoutSelect}
            className="bg-transparent font-mono text-[11px] text-foreground focus:outline-none cursor-pointer"
            title="Rearrange DAG Flow Orientation"
          >
            <option value="horizontal-steps">Horizontal Steps (Satellites)</option>
            <option value="vertical-steps">Vertical Steps (Satellites)</option>
            <option value="horizontal-grid">Horizontal Grid</option>
            <option value="vertical-grid">Vertical Grid</option>
          </select>
        </div>

        {/* Grid Toggle Button */}
        <Button
          size="sm"
          variant={showGrid ? 'secondary' : 'ghost'}
          onClick={() => {
            toggleGrid();
            addLog(showGrid ? '👁️ Canvas background grid disabled.' : '👁️ Canvas background grid enabled.');
          }}
          className={`h-7 text-xs gap-1 ${showGrid ? 'bg-primary/20 text-primary font-bold border border-primary/40' : ''}`}
          data-tooltip="Hide/Display Canvas Background Grid"
        >
          <Grid size={13} className={showGrid ? 'text-primary' : 'text-muted-foreground'} /> Grid
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
          disabled={isExporting}
          onClick={handleOpenExportPngModal}
          className="h-7 text-xs gap-1 cursor-pointer"
          data-tooltip="Export Canvas PNG Image"
        >
          {isExporting ? (
            <Loader2 size={13} className="text-emerald-500 animate-spin" />
          ) : (
            <ImageIcon size={13} className="text-emerald-500" />
          )}
          PNG
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
      <ExportImageModal open={exportModalOpen} onOpenChange={setExportModalOpen} imageData={imageData} />
    </div>
  );
}

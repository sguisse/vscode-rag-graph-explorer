import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Folder, FileCode, ChevronRight, ChevronDown, FolderOpen, Ban, Search, X } from 'lucide-react';
import { TreeManifestNode } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { useReportTree } from './hooks/use-report-tree';

export interface ReportTreePanelProps {
  rootNode: TreeManifestNode | null;
  onExcludePattern?: (pattern: string, isExt: boolean) => void;
  onCaptureSelectedPaths?: (paths: string[]) => void;
}

export function ReportTreePanel({ rootNode, onExcludePattern, onCaptureSelectedPaths }: ReportTreePanelProps) {
  const {
    searchQuery,
    setSearchQuery,
    useRegex,
    viewMode,
    expandedKeys,
    checkedKeys,
    toggleExpand,
    toggleCheck,
    handleOpenFile,
    handleRevealNode,
    handleExcludePattern,
    handleToggleViewMode,
    handleCaptureSelected,
  } = useReportTree({ onExcludePattern, onCaptureSelectedPaths });

  const renderNode = (node: TreeManifestNode, depth: number = 0): React.ReactNode => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedKeys[node.absolute_path] ?? depth === 0;
    const isChecked = checkedKeys[node.absolute_path] ?? false;

    if (searchQuery.trim()) {
      const name = node.name || '';
      const matches = useRegex
        ? new RegExp(searchQuery, 'i').test(name)
        : name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matches && !isDir) return null;
    }

    return (
      <div key={node.absolute_path} className="font-mono text-xs select-none">
        <div
          className="flex items-center gap-1.5 hover:bg-muted/40 px-2 py-0.5 rounded transition-colors group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isDir ? (
            <button onClick={() => toggleExpand(node.absolute_path)} className="text-muted-foreground p-0 h-4 w-4 cursor-pointer">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <Checkbox
            checked={isChecked}
            onCheckedChange={() => toggleCheck(node.absolute_path, node)}
          />

          {isDir ? <Folder size={13} className="text-indigo-400 shrink-0" /> : <FileCode size={13} className="text-emerald-500 shrink-0" />}

          <span
            className={`truncate ${!isDir ? 'hover:underline cursor-pointer text-primary' : 'font-medium'}`}
            onClick={() => !isDir && handleOpenFile(node.absolute_path)}
          >
            {node.name}
          </span>

          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => handleRevealNode(node.absolute_path)}
              data-tooltip="Reveal in Explorer"
            >
              <FolderOpen size={11} />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                const rel = node.name;
                handleExcludePattern(isDir ? `.*/${rel}/.*` : `.*/${rel}$`, false);
              }}
              data-tooltip="Exclude Pattern"
            >
              <Ban size={11} className="text-destructive" />
            </Button>
          </div>
        </div>

        {isDir && isExpanded && node.children && (
          <div>{Object.values(node.children).map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (!rootNode) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono text-xs italic border border-border rounded-md bg-card">
        No tree manifest generated. Enable Tree View setting and run export.
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-card border border-border rounded-md p-3 font-mono text-xs h-full flex flex-col min-h-0">
      <div className="font-bold text-foreground text-xs">
        🌳 Tree Manifest
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/30 p-2 border border-border rounded shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              logInfo('[ReportTreePanel] searchQuery changed', [e.target.value]);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search manifest nodes..."
            className="h-7 text-xs font-mono bg-background"
          />
          {searchQuery && (
            <Button size="icon-xs" variant="ghost" onClick={() => {
              logInfo('[ReportTreePanel] searchQuery cleared');
              setSearchQuery('');
            }}>
              <X size={12} />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleViewMode}
            className="h-7 text-[10px] font-mono"
          >
            Mode: {viewMode.toUpperCase()}
          </Button>
          <Button
            size="sm"
            onClick={handleCaptureSelected}
            className="h-7 text-[10px] font-mono"
          >
            Capture Selected
          </Button>
        </div>
      </div>

      <div className="p-2 bg-background border border-border rounded flex-1 min-h-0 overflow-y-auto space-y-0.5">
        {renderNode(rootNode)}
      </div>
    </div>
  );
}

export default ReportTreePanel;

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Folder, FileCode, ChevronRight, ChevronDown, FolderOpen, Ban, Search, X } from 'lucide-react';
import { TreeManifestNode } from '@/shared/services/file-exporter/model/file-exporter-model';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { logInfo } from '../../utils/log-info';

export interface TreeTabProps {
  rootNode: TreeManifestNode | null;
  onExcludePattern: (pattern: string, isExt: boolean) => void;
  onCaptureSelectedPaths: (paths: string[]) => void;
}

export function TreeTab({ rootNode, onExcludePattern, onCaptureSelectedPaths }: TreeTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'extension'>('standard');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (pathKey: string) => {
    logInfo('[TreeTab] toggleExpand handler triggered', pathKey);
    setExpandedKeys((prev) => ({ ...prev, [pathKey]: !prev[pathKey] }));
  };

  const toggleCheck = (pathKey: string, node: TreeManifestNode) => {
    logInfo('[TreeTab] toggleCheck handler triggered', pathKey);
    const isChecked = !checkedKeys[pathKey];
    const newChecked = { ...checkedKeys };

    const updateChildChecks = (n: TreeManifestNode) => {
      newChecked[n.absolute_path] = isChecked;
      if (n.children) {
        Object.values(n.children).forEach(updateChildChecks);
      }
    };

    updateChildChecks(node);
    setCheckedKeys(newChecked);
  };

  const handleOpenFile = (path: string) => {
    logInfo('[TreeTab] handleOpenFile handler triggered', path);
    filesExporterApiService.openPathAtCursor(path);
  };

  const handleRevealNode = (path: string) => {
    logInfo('[TreeTab] handleRevealNode handler triggered', path);
    filesExporterApiService.openPathAtCursor(path);
  };

  const handleExcludePattern = (pattern: string, isExt: boolean) => {
    logInfo('[TreeTab] handleExcludePattern handler triggered', { pattern, isExt });
    onExcludePattern(pattern, isExt);
  };

  const handleToggleViewMode = () => {
    const nextMode = viewMode === 'standard' ? 'extension' : 'standard';
    logInfo('[TreeTab] handleToggleViewMode handler triggered', nextMode);
    setViewMode(nextMode);
  };

  const handleCaptureSelected = () => {
    logInfo('[TreeTab] handleCaptureSelected handler triggered');
    const selected = Object.entries(checkedKeys)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    onCaptureSelectedPaths(selected);
  };

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
          className="flex items-center gap-1.5 hover:bg-muted/40 px-2 py-0.5 rounded transition-colors"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isDir ? (
            <button onClick={() => toggleExpand(node.absolute_path)} className="text-muted-foreground p-0 h-4 w-4">
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
      <div className="p-8 text-center text-muted-foreground font-mono text-xs italic">
        No tree manifest generated. Enable Tree View setting and run export.
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-background p-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-2 border border-border rounded">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              logInfo('[TreeTab] searchQuery changed', e.target.value);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search manifest nodes..."
            className="h-7 text-xs font-mono bg-background"
          />
          {searchQuery && (
            <Button size="icon-xs" variant="ghost" onClick={() => {
              logInfo('[TreeTab] searchQuery cleared');
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

      <div className="p-2 bg-card border border-border rounded max-h-[450px] overflow-y-auto space-y-0.5">
        {renderNode(rootNode)}
      </div>
    </div>
  );
}

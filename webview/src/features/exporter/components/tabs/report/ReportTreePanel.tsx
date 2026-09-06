import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Folder, FileCode, ChevronRight, ChevronDown, FolderOpen, Ban, Search, X, ChevronsUp, ChevronsDown } from 'lucide-react';
import { TreeManifestNode } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import {
  useReportTree,
  ExtensionGroup,
  getRealFileNameAndExtension,
  getNodeCheckState,
  getGroupCheckState,
} from './hooks/use-report-tree';

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
    checkedPaths,
    extensionGroups,
    toggleExpand,
    toggleCheck,
    toggleGroupCheck,
    handleOpenFile,
    handleRevealNode,
    handleExcludePattern,
    handleExcludeExtension,
    handleToggleViewMode,
    handleExpandAll,
    handleCollapseAll,
    handleCaptureSelected,
  } = useReportTree({ rootNode, onExcludePattern, onCaptureSelectedPaths });

  const renderStandardNode = (node: TreeManifestNode, depth: number = 0): React.ReactNode => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedKeys[node.absolute_path] ?? depth === 0;
    const checkState = getNodeCheckState(node, checkedKeys);

    const { fileName } = getRealFileNameAndExtension(node);
    const displayName = isDir ? node.name : fileName;

    if (searchQuery.trim()) {
      const matches = useRegex
        ? new RegExp(searchQuery, 'i').test(displayName)
        : displayName.toLowerCase().includes(searchQuery.toLowerCase());

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
            checked={checkState}
            onCheckedChange={() => toggleCheck(node.absolute_path, node)}
          />

          {isDir ? <Folder size={13} className="text-indigo-400 shrink-0" /> : <FileCode size={13} className="text-emerald-500 shrink-0" />}

          <span
            className={`truncate ${!isDir ? 'hover:underline cursor-pointer text-primary' : 'font-medium'}`}
            onClick={() => !isDir && handleOpenFile(node.absolute_path)}
          >
            {displayName}
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
                const rel = displayName;
                handleExcludePattern(isDir ? `.*/${rel}/.*` : `.*/${rel}$`, false);
              }}
              data-tooltip="Exclude Pattern"
            >
              <Ban size={11} className="text-destructive" />
            </Button>
          </div>
        </div>

        {isDir && isExpanded && node.children && (
          <div>{Object.values(node.children).map((child) => renderStandardNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const renderExtensionGroup = (grp: ExtensionGroup): React.ReactNode => {
    const groupKey = `ext:${grp.ext}`;
    const isExpanded = expandedKeys[groupKey] ?? false;

    const filteredItems = grp.items.filter(({ fileName }) => {
      if (!searchQuery.trim()) return true;
      return useRegex
        ? new RegExp(searchQuery, 'i').test(fileName)
        : fileName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (searchQuery.trim() && filteredItems.length === 0) {
      return null;
    }

    const groupCheckState = getGroupCheckState(grp, checkedKeys);

    return (
      <div key={grp.ext} className="font-mono text-xs select-none space-y-0.5">
        <div className="flex items-center gap-1.5 hover:bg-muted/40 px-2 py-0.5 rounded transition-colors group">
          <button onClick={() => toggleExpand(groupKey)} className="text-muted-foreground p-0 h-4 w-4 cursor-pointer">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          <Checkbox
            checked={groupCheckState}
            onCheckedChange={() => toggleGroupCheck(grp)}
          />

          <Folder size={13} className="text-indigo-400 shrink-0" />

          <span className="font-bold text-foreground">
            {grp.displayLabel}
          </span>

          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => handleExcludeExtension(grp.ext)}
              data-tooltip={`Exclude extension ${grp.ext}`}
            >
              <Ban size={11} className="text-destructive" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="pl-6 space-y-0.5">
            {filteredItems.map(({ node: file, fileName }) => {
              const isChecked = checkedKeys[file.absolute_path] ?? false;
              return (
                <div
                  key={file.absolute_path}
                  className="flex items-center gap-1.5 hover:bg-muted/40 px-2 py-0.5 rounded transition-colors group"
                >
                  <div className="w-4" />
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleCheck(file.absolute_path, file)}
                  />
                  <FileCode size={13} className="text-emerald-500 shrink-0" />
                  <span
                    className="truncate hover:underline cursor-pointer text-primary"
                    onClick={() => handleOpenFile(file.absolute_path)}
                  >
                    {fileName}
                  </span>

                  <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => handleRevealNode(file.absolute_path)}
                      data-tooltip="Reveal in Explorer"
                    >
                      <FolderOpen size={11} />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => handleExcludePattern(`.*/${fileName}$`, false)}
                      data-tooltip="Exclude File Pattern"
                    >
                      <Ban size={11} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!rootNode) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono text-xs italic border border-border rounded-md bg-card">
        No manifest generated. Enable Tree View setting and run export.
      </div>
    );
  }

  const expandCollapseTooltip = checkedPaths.length > 0
    ? 'Affects selected tree items'
    : 'Affects all tree items';

  return (
    <div className="space-y-3 bg-card border border-border rounded-md p-3 font-mono text-xs h-full flex flex-col min-h-0">
      <div className="font-bold text-foreground text-xs">
        🌳 Exported files manifest
      </div>

      {/* Standardized Toolbar */}
      <div className="flex justify-between items-center px-2 py-1 bg-muted/20 border border-border/50 rounded-md font-mono text-xs w-full shrink-0 gap-2">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* 1st position: Toggle button icon Folder -> File */}
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleToggleViewMode}
            className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            data-tooltip={viewMode === 'standard' ? "Switch View Mode: Extension Grouping Mode" : "Switch View Mode: Standard Directory Mode"}
          >
            {viewMode === 'standard' ? (
              <Folder size={12} className="text-indigo-400" />
            ) : (
              <FileCode size={12} className="text-emerald-500" />
            )}
          </Button>

          {/* Expand All / Collapse All Icons */}
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleCollapseAll}
            className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            data-tooltip={`Collapse Groups (${expandCollapseTooltip})`}
          >
            <ChevronsUp size={12} />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleExpandAll}
            className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            data-tooltip={`Expand Groups (${expandCollapseTooltip})`}
          >
            <ChevronsDown size={12} />
          </Button>

          {/* Search Input */}
          <div className="flex items-center gap-1 bg-background border border-border/60 rounded px-1.5 h-6 flex-1 min-w-[120px] max-w-[220px]">
            <Search size={11} className="text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                logInfo('[ReportTreePanel] searchQuery changed', [e.target.value]);
                setSearchQuery(e.target.value);
              }}
              placeholder="Search manifest nodes..."
              className="h-5 p-0 border-0 text-[11px] font-mono bg-transparent focus-visible:ring-0 flex-1 min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  logInfo('[ReportTreePanel] searchQuery cleared');
                  setSearchQuery('');
                }}
                className="text-muted-foreground hover:text-foreground p-0 shrink-0 cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Capture Selected Button */}
        <div className="shrink-0 flex items-center">
          <Button
            size="sm"
            onClick={handleCaptureSelected}
            disabled={checkedPaths.length === 0}
            className="h-6 text-[10px] font-mono px-2 gap-1 cursor-pointer"
            data-tooltip="Inject selected manifest paths into Source Paths configuration"
          >
            <span>Capture Selected</span>
            {checkedPaths.length > 0 && (
              <span className="bg-primary-foreground/20 px-1 rounded text-[9px] font-bold">
                {checkedPaths.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="p-2 bg-background border border-border rounded flex-1 min-h-0 overflow-y-auto space-y-0.5">
        {viewMode === 'standard'
          ? renderStandardNode(rootNode)
          : extensionGroups.map((grp) => renderExtensionGroup(grp))}
      </div>
    </div>
  );
}

export default ReportTreePanel;

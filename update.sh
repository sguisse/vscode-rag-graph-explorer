#!/usr/bin/env bash
set -e

# File Paths
PANEL_UTIL="webview/src/components/app/top-middle-bottom-panel.tsx"
EXPLORER_PANEL="webview/src/features/explorer/wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx"

# 1. Update top-middle-bottom-panel.tsx with robust flexbox constraints
cat << 'EOF' > "${PANEL_UTIL}"
import React from "react";
import { cn } from "../../lib/utils";

export interface TopMiddleBottomPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  top?: React.ReactNode;
  middle?: React.ReactNode;
  bottom?: React.ReactNode;
  topId?: string;
  middleId?: string;
  bottomId?: string;
}

export function TopMiddleBottomPanel({
  id,
  top,
  middle,
  bottom,
  topId,
  middleId,
  bottomId,
  className,
  ...props
}: TopMiddleBottomPanelProps) {
  return (
    <div id={id} className={cn("flex flex-col w-full h-full min-h-0 overflow-hidden", className)} {...props}>
      <div id={topId ?? `${id}-top`} className="empty:hidden shrink-0 w-full">{top}</div>
      <div id={middleId ?? `${id}-middle`} className="empty:hidden flex-1 min-h-0 overflow-auto w-full">{middle}</div>
      <div id={bottomId ?? `${id}-bottom`} className="empty:hidden shrink-0 w-full">{bottom}</div>
    </div>
  );
}
EOF

# 2. Update CodebaseExplorerPanel.tsx to correctly bind top, middle, and bottom slots
cat << 'EOF' > "${EXPLORER_PANEL}"
import React, { useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database, Download, Upload, LayoutList, ChevronsDown, ChevronsUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ImportAstDialog } from './import-ast-dialog';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import { FinderTree } from '@/components/app/core/finder/FinderTree';
import { FinderHtml } from '@/components/app/core/finder/FinderHtml';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { FOLDER_THEME_REGISTRY_CONFIG } from '../constants/graph.constants';
import { useCodebaseExplorerPanel } from './hooks/use-codebase-explorer-panel';
import { useTreeviewFinder } from './hooks/use-treeview-finder';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { CODEBASE_GROUPING_LIST, CODEBASE_GROUPING_ICON_MAP } from './type-codebase-grouping';
import { TriStateCheckbox } from './components/TriStateCheckbox';
import { RecursiveFolderNode } from './components/RecursiveFolderNode';
import { DYNAMIC_COLORS } from './constants/codebase-explorer.constants';
import {
  CodebaseExplorerPanelProps,
  ViewMode,
  ScopeGroup,
  SubFolderGroup
} from './model-ui';

export function CodebaseExplorerPanel({
  codebase,
  searchFilteredFiles,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFolderCheckbox,
  toggleFileCheckbox,
  setSelectedEntity,
  onFocusNode,
  onImportCodebase
}: CodebaseExplorerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    viewMode,
    setViewMode,
    groupedScopes,
    duplicateFileIds,
    handleExpandAll,
    handleCollapseAll,
    handleToggleFolder,
    handleFileClick,
    handleFileDoubleClick,
    handleFolderDoubleClick,
    toggleFileListCheckbox
  } = useCodebaseExplorerPanel(
    codebase,
    expandedFolders,
    toggleFolder,
    toggleFileCheckbox,
    visibleFiles,
    setSelectedEntity,
    onFocusNode
  );

  const finderStateRaw = useTreeviewFinder(codebase, viewMode, groupedScopes, onFocusNode);

  const matchingFileIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    finderStateRaw.matches.forEach((f, idx) => map.set(f.id, idx));
    return map;
  }, [finderStateRaw.matches]);

  const finderState = useMemo(() => ({
    ...finderStateRaw,
    matchingFileIndexMap,
  }), [finderStateRaw, matchingFileIndexMap]);

  // Keyboard shortcut listener (Cmd+F / Ctrl+F) inside Explorer Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        if (panelRef.current && (panelRef.current.contains(document.activeElement) || panelRef.current.contains(e.target as Node))) {
          e.preventDefault();
          e.stopPropagation();
          finderState.openAndFocusFinder();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [finderState.openAndFocusFinder]);

  // 1. TOP SECTION: Toolbar Header + Search Finder Bar
  const topContent = (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center bg-muted/20 p-0.5 border-border border-b shrink-0">
        <div className="flex items-center gap-1.5 pl-2 w-full">
          <LayoutList size={14} className="text-muted-foreground shrink-0" />
          <SelectFromTypeBuilder
            id="select-display-level"
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            className="py-0"
            triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
            options={CODEBASE_GROUPING_LIST.map((key) => ({
              value: key,
              icon: CODEBASE_GROUPING_ICON_MAP[key].icon,
              label: CODEBASE_GROUPING_ICON_MAP[key].label,
            }))}
          />
        </div>

        <div className="flex items-center gap-0.5 pr-1 shrink-0">
          <Button
            id="btn-toggle-treeview-finder"
            className={`hover:bg-muted rounded w-7 h-7 transition-colors ${
              finderState.isFinderOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
            }`}
            variant="ghost"
            size="icon"
            onClick={finderState.toggleFinder}
            data-tooltip="Toggle Treeview Finder (Loupe)"
          >
            <Search size={12} />
          </Button>

          <ToolbarSeparator />

          <Button
            id="btn-collapse-all"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={() => handleCollapseAll()}
            data-tooltip="Collapse All"
          >
            <ChevronsUp size={12} />
          </Button>
          <Button
            id="btn-expand-all"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={() => handleExpandAll()}
            data-tooltip="Expand All"
          >
            <ChevronsDown size={12} />
          </Button>

          <ToolbarSeparator />
          <Button
            id="btn-open-import-ast-dialog"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={() => setIsImportOpen(true)}
            data-tooltip="Open AST Codebase import dialog"
          >
            <Upload size={12} />
          </Button>

          <Button
            id="btn-export-ast-json"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleExportCodebase}
            data-tooltip="Export current session structure as AST Codebase to JSON file"
          >
            <Download size={12} />
          </Button>
        </div>
      </div>

      {finderState.isFinderOpen && (
        <div id="container-treeview-finder" className="p-0 bg-muted/15 shrink-0">
          <FinderTree
            styleView="toolbar"
            focusTrigger={finderState.focusTrigger}
            searchQuery={finderState.searchQuery}
            setSearchQuery={finderState.setSearchQuery}
            caseSensitive={finderState.caseSensitive}
            setCaseSensitive={finderState.setCaseSensitive}
            wholeWord={finderState.wholeWord}
            setWholeWord={finderState.setWholeWord}
            useRegex={finderState.useRegex}
            setUseRegex={finderState.setUseRegex}
            isFilterActive={finderState.isFilterActive}
            setIsFilterActive={finderState.setIsFilterActive}
            collapseNodeSearchNotCompliantEnabled={finderState.collapseNodeSearchNotCompliantEnabled}
            setCollapseNodeSearchNotCompliantEnabled={finderState.setCollapseNodeSearchNotCompliantEnabled}
            currentMatchIndex={finderState.currentMatchIndex}
            totalMatches={finderState.totalMatches}
            onNext={finderState.handleNextMatch}
            onPrev={finderState.handlePrevMatch}
            onClose={() => finderState.setIsFinderOpen(false)}
          />
        </div>
      )}
    </div>
  );

  // 2. MIDDLE SECTION: Scrollable Codebase Tree View
  const middleContent = (
    <div className="w-full p-4 font-mono text-xs">
      {groupedScopes.map((scope: ScopeGroup) => {
        const scopeTheme = FOLDER_THEME_REGISTRY_CONFIG[scope.key] || FOLDER_THEME_REGISTRY_CONFIG.default;
        const isScopeExpanded = expandedFolders[scope.key] ?? true;

        const allScopeFiles = scope.files;
        const displayScopeFiles = finderState.isFilterActive && finderState.searchQuery
          ? scope.files.filter((f) => finderState.matchingFileIds.has(f.id))
          : scope.files;

        if (finderState.isFilterActive && finderState.searchQuery && displayScopeFiles.length === 0 && !scope.folderTree && !scope.subFolders) {
          return null;
        }

        const isScopeAllChecked = allScopeFiles.length > 0 && allScopeFiles.every((f) => visibleFiles[f.id]);
        const isScopeSomeChecked = allScopeFiles.some((f) => visibleFiles[f.id]);
        const isScopeIndeterminate = isScopeSomeChecked && !isScopeAllChecked;

        return (
          <div key={scope.key} className="mb-4">
            <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
              <TriStateCheckbox
                checked={isScopeAllChecked}
                indeterminate={isScopeIndeterminate}
                onChange={() => toggleFileListCheckbox(allScopeFiles)}
              />
              <div
                className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer"
                onClick={() => handleToggleFolder(scope.key, scope.folderPath)}
                onDoubleClick={(e) => handleFolderDoubleClick(scope.folderPath, allScopeFiles, e)}
              >
                {isScopeExpanded ? (
                  <ChevronDown size={14} className="shrink-0" />
                ) : (
                  <ChevronRight size={14} className="shrink-0" />
                )}
                <Folder size={15} className={`${scopeTheme.fill} ${scopeTheme.text} shrink-0`} />
                <span className="font-bold truncate" title={scope.label}>
                  {finderState.isFinderOpen && finderState.searchQuery ? (
                    <FinderHtml
                      text={`${scope.label}/`}
                      searchQuery={finderState.searchQuery}
                      caseSensitive={finderState.caseSensitive}
                      wholeWord={finderState.wholeWord}
                      useRegex={finderState.useRegex}
                      currentMatchIndex={finderState.currentMatchIndex}
                      matchStartIndex={-1}
                    />
                  ) : (
                    `${scope.label}/`
                  )}
                </span>
              </div>
            </div>

            {isScopeExpanded && (
              <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
                {viewMode === 'scope' &&
                  displayScopeFiles.map((file) => {
                    const matchIndex = finderState.matchingFileIndexMap.get(file.id) ?? -1;
                    return (
                      <div
                        key={file.id}
                        id={`tree-file-node-${file.id}`}
                        className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded transition-colors"
                      >
                        <Checkbox
                          checked={!!visibleFiles[file.id]}
                          onCheckedChange={() => toggleFileCheckbox(file.id)}
                          className="w-3.5 h-3.5 shrink-0"
                        />
                        <span
                          className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${
                            visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'
                          }`}
                          onClick={() => handleFileClick(file)}
                          onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                        >
                          {scope.key === 'config' ? (
                            <Database size={13} className="text-amber-500 shrink-0" />
                          ) : (
                            <FileCode
                              size={13}
                              className={
                                file.type === 'interface'
                                  ? 'text-indigo-400 shrink-0'
                                  : scope.key === 'frontend'
                                  ? 'text-emerald-500 shrink-0'
                                  : scope.key === 'backend'
                                  ? 'text-blue-500 shrink-0'
                                  : 'text-slate-400 shrink-0'
                              }
                            />
                          )}
                          <span className="truncate">
                            {finderState.isFinderOpen && finderState.searchQuery ? (
                              <FinderHtml
                                text={file.name}
                                searchQuery={finderState.searchQuery}
                                caseSensitive={finderState.caseSensitive}
                                wholeWord={finderState.wholeWord}
                                useRegex={finderState.useRegex}
                                currentMatchIndex={finderState.currentMatchIndex}
                                matchStartIndex={matchIndex}
                              />
                            ) : (
                              file.name
                            )}
                          </span>
                        </span>
                      </div>
                    );
                  })}

                {viewMode === 'folder' && scope.folderTree && (
                  <>
                    {scope.rootFiles &&
                      (finderState.isFilterActive && finderState.searchQuery
                        ? scope.rootFiles.filter((f) => finderState.matchingFileIds.has(f.id))
                        : scope.rootFiles
                      ).map((file) => {
                        const matchIndex = finderState.matchingFileIndexMap.get(file.id) ?? -1;
                        return (
                          <div
                            key={file.id}
                            id={`tree-file-node-${file.id}`}
                            className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded transition-colors"
                          >
                            <Checkbox
                              checked={!!visibleFiles[file.id]}
                              onCheckedChange={() => toggleFileCheckbox(file.id)}
                              className="w-3.5 h-3.5 shrink-0"
                            />
                            <span
                              className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${
                                visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'
                              }`}
                              onClick={() => handleFileClick(file)}
                              onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                            >
                              <FileCode size={13} className="text-slate-400 shrink-0" />
                              <span className="truncate">
                                {finderState.isFinderOpen && finderState.searchQuery ? (
                                  <FinderHtml
                                    text={file.name}
                                    searchQuery={finderState.searchQuery}
                                    caseSensitive={finderState.caseSensitive}
                                    wholeWord={finderState.wholeWord}
                                    useRegex={finderState.useRegex}
                                    currentMatchIndex={finderState.currentMatchIndex}
                                    matchStartIndex={matchIndex}
                                  />
                                ) : (
                                  file.name
                                )}
                              </span>
                            </span>
                          </div>
                        );
                      })}

                    {scope.folderTree.map((rootNode, rootIdx) => (
                      <RecursiveFolderNode
                        key={rootNode.id}
                        node={rootNode}
                        depth={1}
                        expandedFolders={expandedFolders}
                        visibleFiles={visibleFiles}
                        toggleFolder={handleToggleFolder}
                        toggleFileCheckbox={toggleFileCheckbox}
                        setSelectedEntity={setSelectedEntity}
                        onFocusNode={onFocusNode}
                        theme={DYNAMIC_COLORS[rootIdx % DYNAMIC_COLORS.length]}
                        toggleFileListCheckbox={toggleFileListCheckbox}
                        handleFileDoubleClick={handleFileDoubleClick}
                        handleFolderDoubleClick={handleFolderDoubleClick}
                        handleFileClick={handleFileClick}
                        handleFolderClick={handleToggleFolder}
                        finderState={finderState}
                      />
                    ))}
                  </>
                )}

                {viewMode !== 'scope' &&
                  viewMode !== 'folder' &&
                  scope.subFolders &&
                  scope.subFolders.map((sub: SubFolderGroup, subIdx: number) => {
                    const isSubExpanded = expandedFolders[sub.key] ?? true;
                    const subTheme = DYNAMIC_COLORS[subIdx % DYNAMIC_COLORS.length];

                    const displaySubFiles = finderState.isFilterActive && finderState.searchQuery
                      ? sub.files.filter((f) => finderState.matchingFileIds.has(f.id))
                      : sub.files;

                    if (finderState.isFilterActive && finderState.searchQuery && displaySubFiles.length === 0) {
                      return null;
                    }

                    const isSubAllChecked = sub.files.length > 0 && sub.files.every((f) => visibleFiles[f.id]);
                    const isSubSomeChecked = sub.files.some((f) => visibleFiles[f.id]);
                    const isSubIndeterminate = isSubSomeChecked && !isSubAllChecked;

                    return (
                      <div key={sub.key} className="mb-2">
                        <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
                          <TriStateCheckbox
                            checked={isSubAllChecked}
                            indeterminate={isSubIndeterminate}
                            onChange={() => toggleFileListCheckbox(sub.files)}
                          />
                          <div
                            className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer"
                            onClick={() => handleToggleFolder(sub.key, sub.folderPath)}
                            onDoubleClick={(e) => handleFolderDoubleClick(sub.folderPath, sub.files, e)}
                          >
                            {isSubExpanded ? (
                              <ChevronDown size={14} className="shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="shrink-0" />
                            )}
                            <Folder size={14} className={`${subTheme.fill} ${subTheme.text} shrink-0`} />
                            <span className="font-semibold text-foreground/90 truncate" title={sub.label}>
                              {finderState.isFinderOpen && finderState.searchQuery ? (
                                <FinderHtml
                                  text={`${sub.label}/`}
                                  searchQuery={finderState.searchQuery}
                                  caseSensitive={finderState.caseSensitive}
                                  wholeWord={finderState.wholeWord}
                                  useRegex={finderState.useRegex}
                                  currentMatchIndex={finderState.currentMatchIndex}
                                  matchStartIndex={-1}
                                />
                              ) : (
                                `${sub.label}/`
                              )}
                            </span>
                          </div>
                        </div>

                        {isSubExpanded && (
                          <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
                            {displaySubFiles.map((file) => {
                              const isDuplicate = viewMode === 'tags' && duplicateFileIds.has(file.id);
                              const matchIndex = finderState.matchingFileIndexMap.get(file.id) ?? -1;
                              const textStyle = isDuplicate
                                ? 'text-orange-500 font-bold'
                                : visibleFiles[file.id]
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground line-through';

                              return (
                                <div
                                  key={file.id}
                                  id={`tree-file-node-${file.id}`}
                                  className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded transition-colors"
                                >
                                  <Checkbox
                                    checked={!!visibleFiles[file.id]}
                                    onCheckedChange={() => toggleFileCheckbox(file.id)}
                                    className="w-3.5 h-3.5 shrink-0"
                                  />
                                  <span
                                    className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${textStyle}`}
                                    onClick={() => handleFileClick(file)}
                                    onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                                  >
                                    {file.type === 'config' ? (
                                      <Database size={13} className="text-amber-500 shrink-0" />
                                    ) : (
                                      <FileCode
                                        size={13}
                                        className={
                                          file.type === 'interface'
                                            ? 'text-indigo-400 shrink-0'
                                            : subTheme.iconColor || 'text-slate-400'
                                        }
                                      />
                                    )}
                                    <span className="truncate">
                                      {finderState.isFinderOpen && finderState.searchQuery ? (
                                        <FinderHtml
                                          text={file.name}
                                          searchQuery={finderState.searchQuery}
                                          caseSensitive={finderState.caseSensitive}
                                          wholeWord={finderState.wholeWord}
                                          useRegex={finderState.useRegex}
                                          currentMatchIndex={finderState.currentMatchIndex}
                                          matchStartIndex={matchIndex}
                                        />
                                      ) : (
                                        file.name
                                      )}
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // 3. BOTTOM SECTION: Info Explorer Status Bar
  const bottomContent = (
    <div className="w-full bg-muted/20 p-2 border-border border-t h-9 shrink-0 flex items-center justify-between">
      <div>
        <h3 className="flex items-center gap-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
          <span>Explorer</span>
          <span id="badge-file-count" className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">
            {searchFilteredFiles.length}/{codebase.files.length}
          </span>
        </h3>
      </div>
    </div>
  );

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="flex flex-col w-full h-full min-h-0 overflow-hidden outline-none"
    >
      <TopMiddleBottomPanel
        id="panel-codebase-explorer"
        topId="panel-codebase-explorer-top"
        middleId="tree-codebase-files"
        bottomId="panel-codebase-explorer-bottom"
        className="bg-card w-full h-full min-h-0"
        top={topContent}
        middle={middleContent}
        bottom={bottomContent}
      />
      <ImportAstDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(data) => {
          if (onImportCodebase) onImportCodebase(data);
        }}
      />
    </div>
  );
}
EOF

echo "✅ fix: Resolved tree layout displacement and extra footer space by applying flex-shrink and min-h-0 bounds in TopMiddleBottomPanel!"

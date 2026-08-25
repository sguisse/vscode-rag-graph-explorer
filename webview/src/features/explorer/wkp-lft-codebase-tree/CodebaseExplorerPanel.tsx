import React, { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database, Download, Upload, LayoutList, ChevronsDown, ChevronsUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ImportAstDialog } from './import-ast-dialog';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import { FinderTree } from '@/components/app/core/finder/FinderTree';
import { FinderHtml } from '@/components/app/core/finder/FinderHtml';
import {
  CodebaseFile,
  CodebaseData,
  SelectedEntity
} from '@/shared/services/graph-rag-explorer';
import { FOLDER_THEME_REGISTRY_CONFIG } from '../constants/graph.constants';
import {
  useCodebaseExplorerPanel,
  ViewMode,
  ScopeGroup,
  SubFolderGroup,
  FolderTreeNode,
  getCommonFolderPath
} from './hooks/use-codebase-explorer-panel';
import { useTreeviewFinder } from './hooks/use-treeview-finder';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { CODEBASE_GROUPING_LIST, CODEBASE_GROUPING_ICON_MAP } from './type-codebase-grouping';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface TriStateCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}

function TriStateCheckbox({ checked, indeterminate, onChange, className }: TriStateCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`rounded w-3.5 h-3.5 border-border bg-background text-primary cursor-pointer shrink-0 accent-primary ${className || ''}`}
    />
  );
}

const DYNAMIC_COLORS = [
  { fill: 'fill-blue-500/20', text: 'text-blue-500', iconColor: 'text-blue-500' },
  { fill: 'fill-emerald-500/20', text: 'text-emerald-500', iconColor: 'text-emerald-500' },
  { fill: 'fill-amber-500/20', text: 'text-amber-500', iconColor: 'text-amber-500' },
  { fill: 'fill-purple-500/20', text: 'text-purple-500', iconColor: 'text-purple-500' },
  { fill: 'fill-pink-500/20', text: 'text-pink-500', iconColor: 'text-pink-500' },
  { fill: 'fill-indigo-500/20', text: 'text-indigo-500', iconColor: 'text-indigo-500' },
  { fill: 'fill-rose-500/20', text: 'text-rose-500', iconColor: 'text-rose-500' },
  { fill: 'fill-cyan-500/20', text: 'text-cyan-500', iconColor: 'text-cyan-500' },
];

function getAllFilesFromNode(node: FolderTreeNode): CodebaseFile[] {
  let files = [...node.files];
  node.children.forEach((child) => {
    files = files.concat(getAllFilesFromNode(child));
  });
  return files;
}

interface RecursiveFolderNodeProps {
  node: FolderTreeNode;
  depth: number;
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
  onFocusNode?: (nodeId: string) => void;
  theme: any;
  toggleFileListCheckbox: (files: CodebaseFile[]) => void;
  handleFileDoubleClick: (file: CodebaseFile, e?: React.MouseEvent) => void;
  handleFolderDoubleClick: (folderPath: string, files?: CodebaseFile[], e?: React.MouseEvent) => void;
  handleFileClick: (file: CodebaseFile) => void;
  handleFolderClick: (folderKey: string, folderPath?: string) => void;
  finderState: {
    isFinderOpen: boolean;
    searchQuery: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    useRegex: boolean;
    isFilterActive: boolean;
    currentMatchIndex: number;
    matchingFileIds: Set<string>;
  };
}

function RecursiveFolderNode({
  node,
  depth,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFileCheckbox,
  setSelectedEntity,
  onFocusNode,
  theme,
  toggleFileListCheckbox,
  handleFileDoubleClick,
  handleFolderDoubleClick,
  handleFileClick,
  handleFolderClick,
  finderState,
}: RecursiveFolderNodeProps) {
  const isExpanded = expandedFolders[node.id] ?? true;
  const allNodeFiles = getAllFilesFromNode(node);

  const displayFiles = finderState.isFilterActive && finderState.searchQuery
    ? node.files.filter((f) => finderState.matchingFileIds.has(f.id))
    : node.files;

  if (finderState.isFilterActive && finderState.searchQuery && displayFiles.length === 0 && node.children.length === 0) {
    return null;
  }

  const isAllChecked = allNodeFiles.length > 0 && allNodeFiles.every((f) => visibleFiles[f.id]);
  const isSomeChecked = allNodeFiles.some((f) => visibleFiles[f.id]);
  const isIndeterminate = isSomeChecked && !isAllChecked;

  return (
    <div key={node.id} className="mb-1">
      <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
        <TriStateCheckbox
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          onChange={() => toggleFileListCheckbox(allNodeFiles)}
        />
        <div
          className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer"
          onClick={() => handleFolderClick(node.id, node.folderPath)}
          onDoubleClick={(e) => handleFolderDoubleClick(node.folderPath, allNodeFiles, e)}
        >
          {isExpanded ? (
            <ChevronDown size={14} className="shrink-0" />
          ) : (
            <ChevronRight size={14} className="shrink-0" />
          )}
          <Folder size={14} className={`${theme.fill} ${theme.text} shrink-0`} />
          <span className="font-semibold text-foreground/90 truncate" title={node.name}>
            {finderState.isFinderOpen && finderState.searchQuery ? (
              <FinderHtml
                text={`${node.name}/`}
                searchQuery={finderState.searchQuery}
                caseSensitive={finderState.caseSensitive}
                wholeWord={finderState.wholeWord}
                useRegex={finderState.useRegex}
                currentMatchIndex={finderState.currentMatchIndex}
                matchStartIndex={0}
              />
            ) : (
              `${node.name}/`
            )}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
          {displayFiles.map((file) => (
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
                {file.type === 'config' ? (
                  <Database size={13} className="text-amber-500 shrink-0" />
                ) : (
                  <FileCode
                    size={13}
                    className={
                      file.type === 'interface'
                        ? 'text-indigo-400 shrink-0'
                        : theme.iconColor || 'text-slate-400'
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
                      matchStartIndex={0}
                    />
                  ) : (
                    file.name
                  )}
                </span>
              </span>
            </div>
          ))}

          {node.children.map((childNode, childIdx) => (
            <RecursiveFolderNode
              key={childNode.id}
              node={childNode}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              visibleFiles={visibleFiles}
              toggleFolder={toggleFolder}
              toggleFileCheckbox={toggleFileCheckbox}
              setSelectedEntity={setSelectedEntity}
              onFocusNode={onFocusNode}
              theme={DYNAMIC_COLORS[(depth + childIdx) % DYNAMIC_COLORS.length]}
              toggleFileListCheckbox={toggleFileListCheckbox}
              handleFileDoubleClick={handleFileDoubleClick}
              handleFolderDoubleClick={handleFolderDoubleClick}
              handleFileClick={handleFileClick}
              handleFolderClick={handleFolderClick}
              finderState={finderState}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CodebaseExplorerPanelProps {
  codebase: CodebaseData;
  searchFilteredFiles: CodebaseFile[];
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFolderCheckbox: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
  onFocusNode?: (nodeId: string) => void;
  onImportCodebase?: (importedData: CodebaseData) => void;
}

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
  } = useCodebaseExplorerPanel(codebase, expandedFolders, toggleFolder);

  const finderState = useTreeviewFinder(codebase, onFocusNode);

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

  const handleToggleFolder = (folderKey: string, folderPath?: string) => {
    if (expandedFolders[folderKey] === undefined) {
      toggleFolder(folderKey);
      toggleFolder(folderKey);
    } else {
      toggleFolder(folderKey);
    }
    if (folderPath) {
      logInfo(`Folder single-clicked: ${folderPath}. Revealing in VS Code Explorer and copying to clipboard...`);
      vsCodeApiService.revealInExplorer(folderPath);
      vsCodeApiService.copyToClipboard(folderPath);
    }
  };

  const handleFileClick = (file: CodebaseFile) => {
    if (file.path) {
      logInfo(`File single-clicked: ${file.path}. Revealing in VS Code Explorer and copying to clipboard...`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.copyToClipboard(file.path);
    }
    if (onFocusNode) {
      onFocusNode(file.id);
    } else {
      setSelectedEntity({ type: 'node', nodeId: file.id });
    }
  };

  const handleFileDoubleClick = (file: CodebaseFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (file?.path) {
      logInfo(`Double-clicked file item: ${file.id}. Opening in VS Code: ${file.path}`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.openFile(file.path);
    }
  };

  const handleFolderDoubleClick = (folderPath: string, files?: CodebaseFile[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetPath = folderPath || getCommonFolderPath(files || []);
    if (targetPath) {
      logInfo(`Double-clicked folder item. Revealing directory in VS Code Explorer: ${targetPath}`);
      vsCodeApiService.revealInExplorer(targetPath);
    }
  };

  const toggleFileListCheckbox = (files: CodebaseFile[]) => {
    const isAllChecked = files.length > 0 && files.every((f) => visibleFiles[f.id]);
    const targetState = !isAllChecked;
    files.forEach((f) => {
      if (!!visibleFiles[f.id] !== targetState) {
        toggleFileCheckbox(f.id);
      }
    });
  };

  return (
    <div
      ref={panelRef}
      id="panel-codebase-explorer"
      tabIndex={-1}
      className="flex flex-col bg-card w-full h-full min-h-0 overflow-hidden outline-none"
    >
      {/* 1. Header Toolbar - Fixed Height */}
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

      {/* 2. Finder Bar (Conditional) - Fixed Height */}
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

      <ImportAstDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(data) => {
          if (onImportCodebase) onImportCodebase(data);
        }}
      />

      {/* 3. Tree Area - Takes all remaining vertical space, ONLY scrollbar here */}
      <div id="tree-codebase-files" className="flex-1 min-h-0 p-4 overflow-y-auto font-mono text-xs">
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
                        matchStartIndex={0}
                      />
                    ) : (
                      `${scope.label}/`
                    )}
                  </span>
                </div>
              </div>

              {isScopeExpanded && (
                <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
                  {/* ViewMode: Scope -> direct files list */}
                  {viewMode === 'scope' &&
                    displayScopeFiles.map((file) => (
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
                                matchStartIndex={0}
                              />
                            ) : (
                              file.name
                            )}
                          </span>
                        </span>
                      </div>
                    ))}

                  {/* ViewMode: Folder -> Recursive VS Code-style tree */}
                  {viewMode === 'folder' && scope.folderTree && (
                    <>
                      {scope.rootFiles &&
                        (finderState.isFilterActive && finderState.searchQuery
                          ? scope.rootFiles.filter((f) => finderState.matchingFileIds.has(f.id))
                          : scope.rootFiles
                        ).map((file) => (
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
                                    matchStartIndex={0}
                                  />
                                ) : (
                                  file.name
                                )}
                              </span>
                            </span>
                          </div>
                        ))}

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

                  {/* ViewMode: Tags / Package / Typology -> flat subfolders */}
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
                                    matchStartIndex={0}
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
                                            matchStartIndex={0}
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

      {/* 4. Bottom Explorer Bar - Fixed Height */}
      <div id="panel-codebase-explorer-bottom" className="bg-muted/20 p-2 border-border border-t h-9 shrink-0">
        <div>
          <h3 className="flex items-center gap-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
            <span>Explorer</span>
            <span id="badge-file-count" className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">
              {searchFilteredFiles.length}/{codebase.files.length}
            </span>
          </h3>
        </div>
      </div>
    </div>
  );
}

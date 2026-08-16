import React, { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportAstDialog } from './import-ast-dialog';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import {
  CodebaseFile,
  CodebaseData,
  SelectedEntity
} from '@/shared/services/graph-rag-explorer';
import { FOLDER_THEME_REGISTRY_CONFIG } from '../constants/graph.constants';
import { useCodebaseExplorerPanel } from './hooks/use-codebase-explorer-panel';

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
      className={className}
    />
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
  const {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    registeredFolders,
    allFolderKeys,
  } = useCodebaseExplorerPanel(codebase);

  return (
    <div id="panel-codebase-explorer" className="flex flex-col bg-card h-full">
      <div className="flex justify-end items-center bg-muted/20 p-1 border-border border-b">
        <ToolbarSeparator />

        <Button
          id="btn-open-import-ast-dialog"
          className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
          variant="ghost"
          size="icon"
          onClick={() => setIsImportOpen(true)}
          data-tooltip="Open AST Codebase import dialog"
        >
          <Upload size={12} />
        </Button>

        <Button
          id="btn-export-ast-json"
          className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
          variant="ghost"
          size="icon"
          onClick={handleExportCodebase}
          data-tooltip="Export current session structure as AST Codebase to JSON file"
        >
          <Download size={12} />
        </Button>
      </div>

      <ImportAstDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(data) => {
          if (onImportCodebase) onImportCodebase(data);
        }}
      />

      <div id="tree-codebase-files" className="flex-1 p-4 overflow-y-auto font-mono text-xs">
        {allFolderKeys.map((folder) => {
          const theme = FOLDER_THEME_REGISTRY_CONFIG[folder] || FOLDER_THEME_REGISTRY_CONFIG.default;
          const isRegistered = registeredFolders.includes(folder as any);
          const folderFiles = (isRegistered
            ? codebase.files.filter((f: CodebaseFile) => f.path.startsWith(folder))
            : codebase.files.filter((f: CodebaseFile) => !registeredFolders.some((rf) => f.path.startsWith(rf)))
          ).sort((a: CodebaseFile, b: CodebaseFile) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          );

          if (folderFiles.length === 0 && !isRegistered) return null;

          const isAllChecked = folderFiles.length > 0 && folderFiles.every((f: CodebaseFile) => visibleFiles[f.id]);
          const isSomeChecked = folderFiles.some((f: CodebaseFile) => visibleFiles[f.id]);
          const isIndeterminate = isSomeChecked && !isAllChecked;

          return (
            <div key={folder} className="mb-4">
              <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
                <TriStateCheckbox
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={() => toggleFolderCheckbox(folder)}
                  className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                />
                <div className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => toggleFolder(folder)}>
                  {expandedFolders[folder] ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                  <Folder size={15} className={`${theme.fill} ${theme.text} shrink-0`} />
                  <span className="font-bold truncate">{folder}/</span>
                </div>
              </div>
              {expandedFolders[folder] && (
                <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                  {folderFiles.map((file: CodebaseFile) => (
                    <div key={file.id} className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={!!visibleFiles[file.id]}
                        onChange={() => toggleFileCheckbox(file.id)}
                        className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                      />
                      <span
                        className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`}
                        onClick={() => {
                          if (onFocusNode) {
                            onFocusNode(file.id);
                          } else {
                            setSelectedEntity({ type: 'node', nodeId: file.id });
                          }
                        }}
                      >
                        {folder === 'config' ? (
                          <Database size={13} className="text-amber-500 shrink-0" />
                        ) : (
                          <FileCode size={13} className={file.type === 'interface' ? 'text-indigo-400 shrink-0' : (folder === 'frontend' ? 'text-emerald-500 shrink-0' : folder === 'backend' ? 'text-blue-500 shrink-0' : 'text-slate-400 shrink-0')} />
                        )}
                        <span className="truncate">{file.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div id="panel-codebase-explorer-bottom" className="bg-muted/20 p-3 border-border border-t">
        <div>
          <h3 className="flex items-center gap-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
            <span>Codebase Explorer</span>
            <span id="badge-file-count" className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">
              {searchFilteredFiles.length}/{codebase.files.length}
            </span>
          </h3>
        </div>
      </div>
    </div>
  );
}

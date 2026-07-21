#!/usr/bin/env bash
# ============================================================================
# Codebase Explorer Checkbox Repositioning Script
# Action: Relocates tree checkboxes in CodebaseExplorerPanel.tsx to the left
# of folder and file tree nodes.
# ============================================================================

set -e

mkdir -p src/features/explorer/wkp-lft-codebase-tree

cat << 'EOF' > src/features/explorer/wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx
import React from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database } from 'lucide-react';
import {
  CodebaseFile,
  SelectedEntity,
  codebaseService,
  REGISTERED_FOLDER_KEYS,
  FOLDER_THEME_REGISTRY
} from '@/services/codebase';

interface CodebaseExplorerPanelProps {
  searchFilteredFiles: CodebaseFile[];
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFolderCheckbox: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
}

export function CodebaseExplorerPanel({
  searchFilteredFiles,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFolderCheckbox,
  toggleFileCheckbox,
  setSelectedEntity
}: CodebaseExplorerPanelProps) {
  const codebase = codebaseService.getCodebase();

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="bg-muted/20 p-4 border-border border-b">
        <h3 className="flex justify-between items-center mb-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
          <span>Codebase Explorer</span>
          <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">{searchFilteredFiles.length}/{codebase.files.length}</span>
        </h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
        {REGISTERED_FOLDER_KEYS.map(folder => {
          const theme = FOLDER_THEME_REGISTRY[folder] || FOLDER_THEME_REGISTRY.default;
          return (
            <div key={folder} className="mb-4">
              <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
                <input
                  type="checkbox"
                  checked={codebase.files.filter(f => f.path.startsWith(folder)).every(f => visibleFiles[f.id])}
                  onChange={() => toggleFolderCheckbox(folder)}
                  className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                />
                <div className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0" onClick={() => toggleFolder(folder)}>
                  {expandedFolders[folder] ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                  <Folder size={15} className={`${theme.fill} ${theme.text} shrink-0`} />
                  <span className="font-bold truncate">{folder}/</span>
                </div>
              </div>
              {expandedFolders[folder] && (
                <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                  {codebase.files.filter(f => f.path.startsWith(folder)).map((file: CodebaseFile) => (
                    <div key={file.id} className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={visibleFiles[file.id]}
                        onChange={() => toggleFileCheckbox(file.id)}
                        className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                      />
                      <span
                        className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`}
                        onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}
                      >
                        {folder === 'config' ? (
                          <Database size={13} className="text-amber-500 shrink-0" />
                        ) : (
                          <FileCode size={13} className={file.type === 'interface' ? 'text-indigo-400 shrink-0' : (folder === 'frontend' ? 'text-emerald-500 shrink-0' : 'text-blue-500 shrink-0')} />
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
    </div>
  );
}
EOF

npm run build

echo "✅ feat/ui: Moved tree checkboxes to the left side in CodebaseExplorerPanel!"

#!/usr/bin/env bash
set -e

# Define directories
BASE_DIR="webview/src/features/explorer/wkp-lft-codebase-tree"
COMPONENTS_DIR="${BASE_DIR}/components"
CONSTANTS_DIR="${BASE_DIR}/constants"
HOOKS_DIR="${BASE_DIR}/hooks"
UTILS_DIR="${BASE_DIR}/utils"
APP_COMPONENTS_DIR="webview/src/components/app"

mkdir -p "${COMPONENTS_DIR}"
mkdir -p "${CONSTANTS_DIR}"
mkdir -p "${HOOKS_DIR}"
mkdir -p "${UTILS_DIR}"
mkdir -p "${APP_COMPONENTS_DIR}"

# 1. Layout Container Component
cat << 'EOF' > "${APP_COMPONENTS_DIR}/top-middle-bottom-panel.tsx"
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
    <div id={id} className={cn("flex flex-col w-full h-full min-h-0 overflow-hidden select-none", className)} {...props}>
      <div id={topId ?? `${id}-top`} className="empty:hidden shrink-0 w-full flex flex-col">{top}</div>
      <div id={middleId ?? `${id}-middle`} className="empty:hidden flex-1 min-h-0 overflow-y-auto w-full">{middle}</div>
      <div id={bottomId ?? `${id}-bottom`} className="empty:hidden shrink-0 w-full flex flex-col">{bottom}</div>
    </div>
  );
}
EOF

# 2. UI Models & Interfaces
cat << 'EOF' > "${BASE_DIR}/model-ui.ts"
import { CodebaseFile, CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';

export type ViewMode = 'scope' | 'folder' | 'tags' | 'layer' | 'typology';

export interface FolderTreeNode {
  id: string;
  name: string;
  folderPath: string;
  files: CodebaseFile[];
  children: FolderTreeNode[];
}

export interface SubFolderGroup {
  key: string;
  label: string;
  folderPath: string;
  files: CodebaseFile[];
}

export interface ScopeGroup {
  key: string;
  label: string;
  folderPath: string;
  files: CodebaseFile[];
  rootFiles?: CodebaseFile[];
  subFolders?: SubFolderGroup[];
  folderTree?: FolderTreeNode[];
}

export interface FolderKeyWithDepth {
  key: string;
  level: number;
}

export interface TriStateCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}

export interface RecursiveFolderNodeProps {
  node: FolderTreeNode;
  depth: number;
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
  onFocusNode?: (nodeId: string) => void;
  theme: { fill: string; text: string; iconColor?: string };
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
    matchingFileIndexMap: Map<string, number>;
  };
}

export interface CodebaseExplorerPanelProps {
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

export interface ImportAstDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: CodebaseData) => void;
}
EOF

# 3. Explorer Constants
cat << 'EOF' > "${CONSTANTS_DIR}/codebase-explorer.constants.ts"
export const DYNAMIC_COLORS = [
  { fill: 'fill-blue-500/20', text: 'text-blue-500', iconColor: 'text-blue-500' },
  { fill: 'fill-emerald-500/20', text: 'text-emerald-500', iconColor: 'text-emerald-500' },
  { fill: 'fill-amber-500/20', text: 'text-amber-500', iconColor: 'text-amber-500' },
  { fill: 'fill-purple-500/20', text: 'text-purple-500', iconColor: 'text-purple-500' },
  { fill: 'fill-pink-500/20', text: 'text-pink-500', iconColor: 'text-pink-500' },
  { fill: 'fill-indigo-500/20', text: 'text-indigo-500', iconColor: 'text-indigo-500' },
  { fill: 'fill-rose-500/20', text: 'text-rose-500', iconColor: 'text-rose-500' },
  { fill: 'fill-cyan-500/20', text: 'text-cyan-500', iconColor: 'text-cyan-500' },
] as const;

export const ALLOWED_TAGS = [
  'config', 'api', 'database', 'ui', 'core', 'model',
  'Service', 'Controller', 'Repository', 'Component', 'RestController', 'Config',
  'Model / Entity', 'DTO', 'Utility', 'Helper', 'Test', 'Integration', 'UnitTest',
  'FunctionalTest', 'PerformanceTest', 'SecurityTest', 'AcceptanceTest', 'EndToEndTest',
  'Mock', 'Stub', 'Adapter', 'Decorator', 'Factory', 'Builder', 'Singleton',
  'Observer', 'Strategy', 'Command', 'Mediator', 'Proxy', 'Visitor'
] as const;

export const LAYER_GROUPS = ["domain.model", "application", "infrastructure", "domain"] as const;

export const TYPOLOGY_GROUPS = [
  "Front-Component",
  "Component",
  "Service",
  "RestController",
  "Controller",
  "Repository",
  "Config",
  "Model / Entity"
] as const;
EOF

# 4. Tree Utilities (With scope & node matching helpers)
cat << 'EOF' > "${UTILS_DIR}/codebase-tree.utils.ts"
import { CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { FolderTreeNode, ScopeGroup, FolderKeyWithDepth, ViewMode } from '../model-ui';
import { TYPOLOGY_GROUPS } from '../constants/codebase-explorer.constants';

export function getAllFilesFromNode(node: FolderTreeNode): CodebaseFile[] {
  let files = [...node.files];
  node.children.forEach((child) => {
    files = files.concat(getAllFilesFromNode(child));
  });
  return files;
}

export function nodeHasMatches(node: FolderTreeNode, matchingFileIds: Set<string>): boolean {
  if (node.files.some((f) => matchingFileIds.has(f.id))) return true;
  return node.children.some((child) => nodeHasMatches(child, matchingFileIds));
}

export function scopeHasMatches(
  scope: ScopeGroup,
  viewMode: ViewMode,
  matchingFileIds: Set<string>
): boolean {
  if (viewMode === 'scope') {
    return scope.files.some((f) => matchingFileIds.has(f.id));
  }
  if (viewMode === 'folder') {
    const hasRootMatch = scope.rootFiles?.some((f) => matchingFileIds.has(f.id)) ?? false;
    const hasTreeMatch = scope.folderTree?.some((node) => nodeHasMatches(node, matchingFileIds)) ?? false;
    return hasRootMatch || hasTreeMatch;
  }
  return scope.subFolders?.some((sub) => sub.files.some((f) => matchingFileIds.has(f.id))) ?? false;
}

export function getCommonFolderPath(files: CodebaseFile[]): string {
  if (!files || files.length === 0) return '';

  const fileDirPaths = files
    .map((f) => {
      const p = f.path || '';
      const lastSlash = p.lastIndexOf('/');
      return lastSlash >= 0 ? p.substring(0, lastSlash) : '';
    })
    .filter(Boolean);

  if (fileDirPaths.length === 0) return '';

  const splitDirs = fileDirPaths.map((d) => d.split('/'));
  let commonParts: string[] = [...splitDirs[0]];

  for (let i = 1; i < splitDirs.length; i++) {
    const current = splitDirs[i];
    let j = 0;
    while (j < commonParts.length && j < current.length && commonParts[j] === current[j]) {
      j++;
    }
    commonParts = commonParts.slice(0, j);
    if (commonParts.length === 0) break;
  }

  return commonParts.join('/');
}

export function resolvePhysicalFolderPath(file: CodebaseFile, partName: string, fallbackScope: string): string {
  if (!file || !file.path) return fallbackScope;

  const lastSlash = file.path.lastIndexOf('/');
  const fileDir = lastSlash >= 0 ? file.path.substring(0, lastSlash) : file.path;

  if (!partName || partName === fallbackScope) {
    return fileDir.startsWith(fallbackScope) ? fallbackScope : fileDir;
  }

  const slashPart = partName.replace(/\./g, '/');

  const idx = fileDir.indexOf(slashPart);
  if (idx !== -1) {
    return fileDir.substring(0, idx + slashPart.length);
  }

  const lastSegmentIdx = fileDir.lastIndexOf('/' + partName);
  if (lastSegmentIdx !== -1) {
    return fileDir.substring(0, lastSegmentIdx + partName.length + 1);
  }

  return fileDir;
}

export function getFileFolderKey(file: CodebaseFile): string {
  const tags = file.tags as any;
  if (Array.isArray(tags)) {
    if (tags.some((t: any) => String(t).toLowerCase() === 'frontend')) return 'frontend';
    if (tags.some((t: any) => String(t).toLowerCase() === 'backend')) return 'backend';
    if (tags.some((t: any) => String(t).toLowerCase() === 'config')) return 'config';
  } else if (typeof tags === 'string') {
    const lower = tags.toLowerCase();
    if (lower.includes('frontend')) return 'frontend';
    if (lower.includes('backend')) return 'backend';
    if (lower.includes('config')) return 'config';
  }
  if (file.path?.toLowerCase().startsWith('frontend')) return 'frontend';
  if (file.path?.toLowerCase().startsWith('backend')) return 'backend';
  if (file.path?.toLowerCase().startsWith('config')) return 'config';
  return 'other';
}

export function cleanRelativeFilePath(file: CodebaseFile): string {
  const filePath = file.path || '';
  if (!filePath) return '';

  let relative = filePath;

  const srcMarkers = [
    '/src/main/java/', 'src/main/java/',
    '/src/test/java/', 'src/test/java/',
    '/src/main/kotlin/', 'src/main/kotlin/',
    '/src/test/kotlin/', 'src/test/kotlin/',
    '/src/main/resources/', 'src/main/resources/',
    '/src/test/resources/', 'src/test/resources/',
    '/src/', 'src/'
  ];

  let found = false;
  for (const marker of srcMarkers) {
    const idx = relative.indexOf(marker);
    if (idx !== -1) {
      relative = relative.substring(idx + marker.length);
      found = true;
      break;
    }
  }

  if (!found) {
    const pkgMarkers = ['/com/', 'com/', '/org/', 'org/', '/net/', 'net/', '/io/', 'io/', '/fr/', 'fr/', '/de/', 'de/'];
    for (const marker of pkgMarkers) {
      const idx = relative.indexOf(marker);
      if (idx !== -1) {
        const cleanMarker = marker.startsWith('/') ? marker.substring(1) : marker;
        relative = cleanMarker + relative.substring(idx + marker.length);
        found = true;
        break;
      }
    }
  }

  if (!found) {
    const scopeMarkers = ['/frontend/', 'frontend/', '/backend/', 'backend/', '/config/', 'config/'];
    for (const marker of scopeMarkers) {
      const idx = relative.indexOf(marker);
      if (idx !== -1) {
        relative = relative.substring(idx + marker.length);
        found = true;
        break;
      }
    }
  }

  relative = relative.replace(/^\/+|\/+$/g, '').trim();
  return relative;
}

export function getFileTypology(f: CodebaseFile): string {
  const name = f.name.toLowerCase();
  const path = f.path.toLowerCase();
  const type = (f.type || '').toLowerCase();
  const tags = typeof f.tags === 'string'
    ? [(f.tags as string).toLowerCase()]
    : [];

  if (type === 'config' || path.includes('config') || tags.includes('config') || name.endsWith('.yml') || name.endsWith('.yaml') || name.endsWith('.json') || name.endsWith('.properties')) {
    return 'Config';
  }
  if (name.includes('restcontroller') || tags.includes('restcontroller')) {
    return 'RestController';
  }
  if (name.includes('controller') || path.includes('controller') || tags.includes('controller')) {
    return 'Controller';
  }
  if (name.includes('repository') || path.includes('repository') || name.includes('repo') || tags.includes('repository')) {
    return 'Repository';
  }
  if (name.includes('service') || name.includes('api') || path.includes('service') || tags.includes('service')) {
    return 'Service';
  }
  const isFront = path.startsWith('frontend') || tags.includes('frontend') || name.endsWith('.tsx') || name.endsWith('.jsx') || name.endsWith('.vue');
  if (isFront && (type === 'component' || path.includes('component') || tags.includes('component'))) {
    return 'Front-Component';
  }
  if (type === 'component' || tags.includes('component')) {
    return 'Component';
  }
  if ((type === 'class' || type === 'model' || type === 'entity') && (path.includes('model') || path.includes('domain') || path.includes('entity') || tags.includes('model') || tags.includes('entity'))) {
    return 'Model / Entity';
  }

  const matchedGroup = TYPOLOGY_GROUPS.find((group) => {
    const gLower = group.toLowerCase();
    return name.includes(gLower) || path.includes(gLower) || type === gLower || tags.includes(gLower);
  });

  return matchedGroup || 'Other';
}

export function compactFolderTree(nodes: FolderTreeNode[]): FolderTreeNode[] {
  return nodes.map((node) => {
    let compactedChildren = compactFolderTree(node.children);
    let currentNode: FolderTreeNode = {
      ...node,
      children: compactedChildren,
    };

    while (currentNode.files.length === 0 && currentNode.children.length === 1) {
      const singleChild = currentNode.children[0];
      currentNode = {
        id: singleChild.id,
        name: `${currentNode.name}.${singleChild.name}`,
        folderPath: singleChild.folderPath || currentNode.folderPath,
        files: singleChild.files,
        children: singleChild.children,
      };
    }

    return currentNode;
  });
}

export function buildFolderTreeForScope(scopeKey: string, scopeFiles: CodebaseFile[]): { rootFiles: CodebaseFile[]; folderTree: FolderTreeNode[] } {
  interface TempNode {
    id: string;
    name: string;
    folderPath: string;
    files: CodebaseFile[];
    childrenMap: Map<string, TempNode>;
  }

  const rootChildrenMap = new Map<string, TempNode>();
  const rootFiles: CodebaseFile[] = [];

  scopeFiles.forEach((file) => {
    const relPath = cleanRelativeFilePath(file);
    const lastSlash = relPath.lastIndexOf('/');
    const dirPath = lastSlash >= 0 ? relPath.substring(0, lastSlash) : '';
    const parts = dirPath ? dirPath.split('/').filter(Boolean) : [];

    if (parts.length === 0) {
      rootFiles.push(file);
    } else {
      let currentMap = rootChildrenMap;
      let currentPath = scopeKey;

      parts.forEach((part, idx) => {
        currentPath += `/${part}`;
        if (!currentMap.has(part)) {
          const physicalPath = resolvePhysicalFolderPath(file, part, scopeKey);
          currentMap.set(part, {
            id: currentPath,
            name: part,
            folderPath: physicalPath,
            files: [],
            childrenMap: new Map(),
          });
        }
        const node = currentMap.get(part)!;
        if (idx === parts.length - 1) {
          node.files.push(file);
        } else {
          currentMap = node.childrenMap;
        }
      });
    }
  });

  function convertMapToArray(map: Map<string, TempNode>): FolderTreeNode[] {
    const result: FolderTreeNode[] = [];
    map.forEach((node) => {
      result.push({
        id: node.id,
        name: node.name,
        folderPath: node.folderPath,
        files: node.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
        children: convertMapToArray(node.childrenMap),
      });
    });
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  const uncompressedTree = convertMapToArray(rootChildrenMap);
  const compactedTree = compactFolderTree(uncompressedTree);

  return {
    rootFiles: rootFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
    folderTree: compactedTree,
  };
}

export function collectFolderKeysWithDepth(scopes: ScopeGroup[]): FolderKeyWithDepth[] {
  const result: FolderKeyWithDepth[] = [];

  function traverseTree(nodes: FolderTreeNode[], currentLevel: number) {
    nodes.forEach((node) => {
      result.push({ key: node.id, level: currentLevel });
      if (node.children && node.children.length > 0) {
        traverseTree(node.children, currentLevel + 1);
      }
    });
  }

  scopes.forEach((scope) => {
    result.push({ key: scope.key, level: 1 });
    if (scope.folderTree) {
      traverseTree(scope.folderTree, 2);
    }
    if (scope.subFolders) {
      scope.subFolders.forEach((sub) => {
        result.push({ key: sub.key, level: 2 });
      });
    }
  });

  return result;
}

export function calculateCollapseState(scopes: ScopeGroup[], mode: ViewMode): Record<string, boolean> {
  const keysWithDepth = collectFolderKeysWithDepth(scopes);
  let targetCollapseLevel = 2;

  if (mode === 'folder') {
    targetCollapseLevel = 3;
  } else if (mode === 'scope') {
    targetCollapseLevel = 1;
  }

  const newExpanded: Record<string, boolean> = {};
  keysWithDepth.forEach(({ key, level }) => {
    newExpanded[key] = level < targetCollapseLevel;
  });

  return newExpanded;
}
EOF

# 5. TriStateCheckbox Sub-Component
cat << 'EOF' > "${COMPONENTS_DIR}/TriStateCheckbox.tsx"
import React, { useRef, useEffect } from 'react';
import { TriStateCheckboxProps } from '../model-ui';

export function TriStateCheckbox({ checked, indeterminate, onChange, className }: TriStateCheckboxProps) {
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
EOF

# 6. RecursiveFolderNode Sub-Component (Filters out non-matching tree nodes)
cat << 'EOF' > "${COMPONENTS_DIR}/RecursiveFolderNode.tsx"
import React from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FinderHtml } from '@/components/app/core/finder/FinderHtml';
import { TriStateCheckbox } from './TriStateCheckbox';
import { RecursiveFolderNodeProps } from '../model-ui';
import { DYNAMIC_COLORS } from '../constants/codebase-explorer.constants';
import { getAllFilesFromNode, nodeHasMatches } from '../utils/codebase-tree.utils';

export function RecursiveFolderNode({
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
  const isFilterActiveWithQuery = finderState.isFilterActive && Boolean(finderState.searchQuery.trim());

  if (isFilterActiveWithQuery && !nodeHasMatches(node, finderState.matchingFileIds)) {
    return null;
  }

  const isExpanded = isFilterActiveWithQuery ? true : (expandedFolders[node.id] ?? true);
  const allNodeFiles = getAllFilesFromNode(node);

  const displayFiles = isFilterActiveWithQuery
    ? node.files.filter((f) => finderState.matchingFileIds.has(f.id))
    : node.files;

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
                matchStartIndex={-1}
              />
            ) : (
              `${node.name}/`
            )}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
          {displayFiles.map((file) => {
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
EOF

# 7. Hook: use-codebase-explorer-panel.ts
cat << 'EOF' > "${HOOKS_DIR}/use-codebase-explorer-panel.ts"
import { useState, useMemo, useEffect, useCallback } from 'react';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { FOLDER_KEYS_REGISTERED_CONFIG } from '../../constants/graph.constants';
import { useExplorerStore } from '../../store/useExplorerStore';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

import {
  ViewMode,
  FolderTreeNode,
  SubFolderGroup,
  ScopeGroup,
  FolderKeyWithDepth
} from '../model-ui';

import {
  ALLOWED_TAGS,
  LAYER_GROUPS,
  TYPOLOGY_GROUPS
} from '../constants/codebase-explorer.constants';

import {
  getCommonFolderPath,
  resolvePhysicalFolderPath,
  getFileFolderKey,
  cleanRelativeFilePath,
  getFileTypology,
  compactFolderTree,
  buildFolderTreeForScope,
  collectFolderKeysWithDepth,
  calculateCollapseState
} from '../utils/codebase-tree.utils';

export type { ViewMode, FolderTreeNode, SubFolderGroup, ScopeGroup, FolderKeyWithDepth };
export {
  ALLOWED_TAGS,
  LAYER_GROUPS,
  TYPOLOGY_GROUPS,
  getCommonFolderPath,
  resolvePhysicalFolderPath,
  getFileFolderKey,
  cleanRelativeFilePath,
  getFileTypology,
  compactFolderTree,
  buildFolderTreeForScope,
  collectFolderKeysWithDepth,
  calculateCollapseState
};

export function useCodebaseExplorerPanel(
  codebase: CodebaseData,
  expandedFolders?: Record<string, boolean>,
  toggleFolder?: (folder: string) => void,
  toggleFileCheckbox?: (id: string) => void,
  visibleFiles?: Record<string, boolean>,
  setSelectedEntity?: (entity: SelectedEntity) => void,
  onFocusNode?: (nodeId: string) => void
) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('scope');

  const handleExportCodebase = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codebase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "codebase-ast.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [codebase]);

  const { groupedScopes, duplicateFileIds } = useMemo(() => {
    const duplicates = new Set<string>();
    const scopesList: ScopeGroup[] = [];
    const scopeKeys = [...FOLDER_KEYS_REGISTERED_CONFIG];

    scopeKeys.forEach((scopeKey) => {
      const scopeFiles = codebase.files.filter((f) => getFileFolderKey(f) === scopeKey);
      if (scopeFiles.length === 0) return;

      const scopeFolderPath = getCommonFolderPath(scopeFiles) || scopeKey;

      if (viewMode === 'scope') {
        scopesList.push({
          key: scopeKey,
          label: scopeKey,
          folderPath: scopeFolderPath,
          files: scopeFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
        });
      } else if (viewMode === 'folder') {
        const { rootFiles, folderTree } = buildFolderTreeForScope(scopeKey, scopeFiles);
        scopesList.push({
          key: scopeKey,
          label: scopeKey,
          folderPath: scopeFolderPath,
          files: scopeFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
          rootFiles,
          folderTree,
        });
      } else {
        const subMap = new Map<string, CodebaseFile[]>();

        if (viewMode === 'tags') {
          const dynamicTagsMap = new Map<string, string>();
          ALLOWED_TAGS.forEach((t) => dynamicTagsMap.set(t.toLowerCase(), t));

          codebase.files.forEach((f) => {
            const tags = f.tags as any;
            if (Array.isArray(tags)) {
              tags.forEach((t) => {
                if (typeof t === 'string' && t.trim()) {
                  const raw = t.trim();
                  if (!dynamicTagsMap.has(raw.toLowerCase())) {
                    dynamicTagsMap.set(raw.toLowerCase(), raw);
                  }
                }
              });
            } else if (typeof tags === 'string' && tags.trim()) {
              const raw = tags.trim();
              if (!dynamicTagsMap.has(raw.toLowerCase())) {
                dynamicTagsMap.set(raw.toLowerCase(), raw);
              }
            }
          });

          dynamicTagsMap.forEach((displayTag) => subMap.set(displayTag, []));
          subMap.set('untagged', []);

          const fileTagCounts = new Map<string, number>();

          scopeFiles.forEach((f) => {
            const tags = f.tags as any;
            const fileTagsList: string[] = Array.isArray(tags)
              ? tags.map((t) => String(t).trim())
              : typeof tags === 'string' && tags.trim()
              ? [tags.trim()]
              : [];

            let matchedCount = 0;
            const matchedDisplayTags = new Set<string>();

            fileTagsList.forEach((rawTag) => {
              const lower = rawTag.toLowerCase();
              if (dynamicTagsMap.has(lower)) {
                const displayTag = dynamicTagsMap.get(lower)!;
                if (!matchedDisplayTags.has(displayTag)) {
                  matchedDisplayTags.add(displayTag);
                  subMap.get(displayTag)!.push(f);
                  matchedCount++;
                }
              }
            });

            if (matchedCount > 0) {
              fileTagCounts.set(f.id, (fileTagCounts.get(f.id) || 0) + matchedCount);
            } else {
              subMap.get('untagged')!.push(f);
            }
          });

          fileTagCounts.forEach((count, id) => {
            if (count > 1) duplicates.add(id);
          });
        } else if (viewMode === 'layer') {
          LAYER_GROUPS.forEach((p) => subMap.set(p, []));
          subMap.set('other', []);
          scopeFiles.forEach((f) => {
            const pathLower = f.path.toLowerCase();
            const nameLower = f.name.toLowerCase();
            const matchedPkg = LAYER_GROUPS.find((p) => {
              const pLower = p.toLowerCase();
              return pathLower.includes(pLower) || nameLower.includes(pLower);
            });
            if (matchedPkg) {
              subMap.get(matchedPkg)!.push(f);
            } else {
              subMap.get('other')!.push(f);
            }
          });
        } else if (viewMode === 'typology') {
          TYPOLOGY_GROUPS.forEach((t) => subMap.set(t, []));
          subMap.set('Other', []);
          scopeFiles.forEach((f) => {
            const typo = getFileTypology(f);
            if (!subMap.has(typo)) subMap.set(typo, []);
            subMap.get(typo)!.push(f);
          });
        }

        const subFolders: SubFolderGroup[] = [];
        subMap.forEach((files, subKey) => {
          if (files.length > 0) {
            const subFolderPath = getCommonFolderPath(files) || scopeKey;
            subFolders.push({
              key: `${scopeKey}__${subKey}`,
              label: subKey,
              folderPath: subFolderPath,
              files: files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
            });
          }
        });

        subFolders.sort((a, b) => a.label.localeCompare(b.label));

        scopesList.push({
          key: scopeKey,
          label: scopeKey,
          folderPath: scopeFolderPath,
          files: scopeFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })),
          subFolders,
        });
      }
    });

    return { groupedScopes: scopesList, duplicateFileIds: duplicates };
  }, [codebase.files, viewMode]);

  const handleExpandAll = useCallback(() => {
    const keysWithDepth = collectFolderKeysWithDepth(groupedScopes);
    const newExpanded: Record<string, boolean> = {};
    keysWithDepth.forEach(({ key }) => {
      newExpanded[key] = true;
    });
    useExplorerStore.setState((s) => ({
      expandedFolders: {
        ...s.expandedFolders,
        ...newExpanded,
      },
    }));
  }, [groupedScopes]);

  const handleCollapseAll = useCallback((overrideMode?: ViewMode) => {
    const mode = overrideMode || viewMode;
    const newExpanded = calculateCollapseState(groupedScopes, mode);
    useExplorerStore.setState((s) => ({
      expandedFolders: {
        ...s.expandedFolders,
        ...newExpanded,
      },
    }));
  }, [groupedScopes, viewMode]);

  const handleToggleFolder = useCallback((folderKey: string, folderPath?: string) => {
    if (toggleFolder) {
      if (expandedFolders && expandedFolders[folderKey] === undefined) {
        toggleFolder(folderKey);
        toggleFolder(folderKey);
      } else {
        toggleFolder(folderKey);
      }
    }
    if (folderPath) {
      logInfo(`Folder single-clicked: ${folderPath}. Revealing in VS Code Explorer and copying to clipboard...`);
      vsCodeApiService.revealInExplorer(folderPath);
      vsCodeApiService.copyToClipboard(folderPath);
    }
  }, [toggleFolder, expandedFolders]);

  const handleFileClick = useCallback((file: CodebaseFile) => {
    if (file.path) {
      logInfo(`File single-clicked: ${file.path}. Revealing in VS Code Explorer and copying to clipboard...`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.copyToClipboard(file.path);
    }
    if (onFocusNode) {
      onFocusNode(file.id);
    } else if (setSelectedEntity) {
      setSelectedEntity({ type: 'node', nodeId: file.id });
    }
  }, [onFocusNode, setSelectedEntity]);

  const handleFileDoubleClick = useCallback((file: CodebaseFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (file?.path) {
      logInfo(`Double-clicked file item: ${file.id}. Opening in VS Code: ${file.path}`);
      vsCodeApiService.revealInExplorer(file.path);
      vsCodeApiService.openFile(file.path);
    }
  }, []);

  const handleFolderDoubleClick = useCallback((folderPath: string, files?: CodebaseFile[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetPath = folderPath || getCommonFolderPath(files || []);
    if (targetPath) {
      logInfo(`Double-clicked folder item. Revealing directory in VS Code Explorer: ${targetPath}`);
      vsCodeApiService.revealInExplorer(targetPath);
    }
  }, []);

  const toggleFileListCheckbox = useCallback((files: CodebaseFile[]) => {
    if (!toggleFileCheckbox || !visibleFiles) return;
    const isAllChecked = files.length > 0 && files.every((f) => visibleFiles[f.id]);
    const targetState = !isAllChecked;
    files.forEach((f) => {
      if (!!visibleFiles[f.id] !== targetState) {
        toggleFileCheckbox(f.id);
      }
    });
  }, [toggleFileCheckbox, visibleFiles]);

  useEffect(() => {
    handleCollapseAll(viewMode);
  }, [viewMode, groupedScopes, handleCollapseAll]);

  return {
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
    toggleFileListCheckbox,
  };
}
EOF

# 8. Hook: use-treeview-finder.ts (Strict file-name matching to eliminate parent directory false-positives)
cat << 'EOF' > "${HOOKS_DIR}/use-treeview-finder.ts"
import { useState, useMemo, useCallback, useEffect } from 'react';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '@/features/explorer/store/useExplorerStore';
import {
  ScopeGroup,
  FolderTreeNode,
  ViewMode
} from '../model-ui';
import { cleanRelativeFilePath } from '../utils/codebase-tree.utils';
import { useFinderBase } from '@/components/app/core/finder/useFinderBase';

export function useTreeviewFinder(
  codebase: CodebaseData,
  viewMode: ViewMode,
  groupedScopes: ScopeGroup[],
  onFocusNode?: (nodeId: string) => void
) {
  const finderBase = useFinderBase();
  const {
    isFinderOpen,
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
    currentMatchIndex,
    setCurrentMatchIndex,
  } = finderBase;

  const [isFilterActive, setIsFilterActive] = useState(false);
  const [collapseNodeSearchNotCompliantEnabled, setCollapseNodeSearchNotCompliantEnabled] = useState(false);

  const allSearchableFiles = useMemo(() => codebase.files || [], [codebase]);

  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];

    let pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    try {
      const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      const hasSlash = searchQuery.includes('/') || searchQuery.includes('\\');
      return allSearchableFiles.filter((f) => {
        regex.lastIndex = 0;
        if (hasSlash) {
          return regex.test(cleanRelativeFilePath(f)) || regex.test(f.name);
        }
        return regex.test(f.name);
      });
    } catch (e) {
      return [];
    }
  }, [allSearchableFiles, searchQuery, caseSensitive, wholeWord, useRegex]);

  const matchingFileIds = useMemo(() => new Set(matches.map((f) => f.id)), [matches]);
  const totalMatches = matches.length;

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, caseSensitive, wholeWord, useRegex, setCurrentMatchIndex]);

  const { fileParentFoldersMap, allFolderKeys } = useMemo(() => {
    const fileParentFoldersMap = new Map<string, string[]>();
    const allFolderKeys = new Set<string>();

    groupedScopes.forEach((scope) => {
      allFolderKeys.add(scope.key);

      if (viewMode === 'scope') {
        scope.files.forEach((file) => {
          fileParentFoldersMap.set(file.id, [scope.key]);
        });
      } else if (viewMode === 'folder') {
        if (scope.rootFiles) {
          scope.rootFiles.forEach((file) => {
            fileParentFoldersMap.set(file.id, [scope.key]);
          });
        }

        function traverseTree(nodes: FolderTreeNode[], ancestors: string[]) {
          nodes.forEach((node) => {
            allFolderKeys.add(node.id);
            const currentAncestors = [...ancestors, node.id];

            node.files.forEach((file) => {
              fileParentFoldersMap.set(file.id, currentAncestors);
            });

            if (node.children && node.children.length > 0) {
              traverseTree(node.children, currentAncestors);
            }
          });
        }

        if (scope.folderTree) {
          traverseTree(scope.folderTree, [scope.key]);
        }
      } else {
        if (scope.subFolders) {
          scope.subFolders.forEach((sub) => {
            allFolderKeys.add(sub.key);
            sub.files.forEach((file) => {
              fileParentFoldersMap.set(file.id, [scope.key, sub.key]);
            });
          });
        }
      }
    });

    return { fileParentFoldersMap, allFolderKeys };
  }, [groupedScopes, viewMode]);

  useEffect(() => {
    if (!isFinderOpen || matches.length === 0) return;
    const activeMatch = matches[currentMatchIndex];
    if (!activeMatch) return;

    if (onFocusNode) {
      onFocusNode(activeMatch.id);
    }

    if (collapseNodeSearchNotCompliantEnabled && searchQuery.trim()) {
      const compliantFolderKeys = new Set<string>();
      matches.forEach((file) => {
        const parentKeys = fileParentFoldersMap.get(file.id) || [];
        parentKeys.forEach((key) => compliantFolderKeys.add(key));
      });

      useExplorerStore.setState((s) => {
        const updatedExpanded: Record<string, boolean> = {};
        allFolderKeys.forEach((key) => {
          updatedExpanded[key] = compliantFolderKeys.has(key);
        });
        return {
          expandedFolders: {
            ...s.expandedFolders,
            ...updatedExpanded,
          },
        };
      });
    } else {
      const folderKeysToExpand: Record<string, boolean> = {};
      matches.forEach((file) => {
        const parentKeys = fileParentFoldersMap.get(file.id) || [];
        parentKeys.forEach((key) => {
          folderKeysToExpand[key] = true;
        });
      });

      useExplorerStore.setState((s) => ({
        expandedFolders: {
          ...s.expandedFolders,
          ...folderKeysToExpand,
        },
      }));
    }

    setTimeout(() => {
      const container = document.getElementById('tree-codebase-files');
      const element = document.getElementById(`tree-file-node-${activeMatch.id}`);
      if (container && element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = relativeTop - containerRect.height / 2 + elementRect.height / 2;
        container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
      }
    }, 120);
  }, [
    currentMatchIndex,
    matches,
    isFinderOpen,
    searchQuery,
    collapseNodeSearchNotCompliantEnabled,
    fileParentFoldersMap,
    allFolderKeys,
    onFocusNode,
  ]);

  const handleNextMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev >= totalMatches - 1 ? 0 : prev + 1));
  }, [totalMatches, setCurrentMatchIndex]);

  const handlePrevMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev <= 0 ? totalMatches - 1 : prev - 1));
  }, [totalMatches, setCurrentMatchIndex]);

  return {
    ...finderBase,
    isFilterActive,
    setIsFilterActive,
    collapseNodeSearchNotCompliantEnabled,
    setCollapseNodeSearchNotCompliantEnabled,
    totalMatches,
    matches,
    matchingFileIds,
    handleNextMatch,
    handlePrevMatch,
  };
}
EOF

# 9. Main CodebaseExplorerPanel Component File
cat << 'EOF' > "${BASE_DIR}/CodebaseExplorerPanel.tsx"
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
import { scopeHasMatches } from './utils/codebase-tree.utils';
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

  // 1. TOP SECTION: Fixed Header Toolbar + Search Finder Bar
  const topContent = (
    <div className="flex flex-col w-full shrink-0">
      <div className="flex justify-between items-center bg-muted/20 p-0.5 border-border border-b shrink-0">
        <div className="flex items-center gap-1.5 pl-2 w-full">
          <LayoutList size={14} className="text-muted-foreground shrink-0" />
          <SelectFromTypeBuilder
            id="select-display-level"
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            className="py-0"
            triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono bg-background"
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
        <div id="container-treeview-finder" className="p-0 bg-background border-b border-border shrink-0">
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
        const isFilterActiveWithQuery = finderState.isFilterActive && Boolean(finderState.searchQuery.trim());

        if (isFilterActiveWithQuery && !scopeHasMatches(scope, viewMode, finderState.matchingFileIds)) {
          return null;
        }

        const isScopeExpanded = isFilterActiveWithQuery ? true : (expandedFolders[scope.key] ?? true);

        const allScopeFiles = scope.files;
        const displayScopeFiles = isFilterActiveWithQuery
          ? scope.files.filter((f) => finderState.matchingFileIds.has(f.id))
          : scope.files;

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
                {/* ViewMode: Scope -> direct files list */}
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

                {/* ViewMode: Folder -> Recursive VS Code-style tree */}
                {viewMode === 'folder' && scope.folderTree && (
                  <>
                    {scope.rootFiles &&
                      (isFilterActiveWithQuery
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

                {/* ViewMode: Tags / Layer / Typology -> flat subfolders */}
                {viewMode !== 'scope' &&
                  viewMode !== 'folder' &&
                  scope.subFolders &&
                  scope.subFolders.map((sub: SubFolderGroup, subIdx: number) => {
                    const displaySubFiles = isFilterActiveWithQuery
                      ? sub.files.filter((f) => finderState.matchingFileIds.has(f.id))
                      : sub.files;

                    if (isFilterActiveWithQuery && displaySubFiles.length === 0) {
                      return null;
                    }

                    const isSubExpanded = isFilterActiveWithQuery ? true : (expandedFolders[sub.key] ?? true);
                    const subTheme = DYNAMIC_COLORS[subIdx % DYNAMIC_COLORS.length];

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
        className="bg-card w-full h-full min-h-0 overflow-hidden"
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

echo "✅ fix: Resolved tree filter issue! Search matches file names (or clean relative paths when slashes are present) and strictly hides non-corresponding nodes when filter is active."

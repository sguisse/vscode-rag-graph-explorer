import { useState, useMemo, useEffect, useCallback } from 'react';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { FOLDER_KEYS_REGISTERED_CONFIG } from '@/features/sdlc/domains/codebase-context/components/dependency-graph/constants/graph.constants';
import { useCodebaseDomainState, CodebaseDomainState } from '../../../store/useCodebaseDomainState';
import { useCodebaseActions } from '../../../handlers/useCodebaseActions';

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
  const setExpandedFolders = useCodebaseDomainState((s: CodebaseDomainState) => s.setExpandedFolders);

  const { revealAndCopyFile, openFileInEditor, revealFolder } = useCodebaseActions();

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
      const scopeFiles = (codebase?.files || []).filter((f) => getFileFolderKey(f) === scopeKey);
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

          (codebase?.files || []).forEach((f) => {
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
  }, [codebase?.files, viewMode]);

  const handleExpandAll = useCallback(() => {
    const keysWithDepth = collectFolderKeysWithDepth(groupedScopes);
    const newExpanded: Record<string, boolean> = {};
    keysWithDepth.forEach(({ key }) => {
      newExpanded[key] = true;
    });
    setExpandedFolders(newExpanded);
  }, [groupedScopes, setExpandedFolders]);

  const handleCollapseAll = useCallback((overrideMode?: ViewMode) => {
    const mode = overrideMode || viewMode;
    const newExpanded = calculateCollapseState(groupedScopes, mode);
    setExpandedFolders(newExpanded);
  }, [groupedScopes, viewMode, setExpandedFolders]);

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
      revealFolder(folderPath);
    }
  }, [toggleFolder, expandedFolders, revealFolder]);

  const handleFileClick = useCallback((file: CodebaseFile) => {
    if (file.path) {
      revealAndCopyFile(file);
    }
    if (onFocusNode) {
      onFocusNode(file.id);
    } else if (setSelectedEntity) {
      setSelectedEntity({ type: 'node', nodeId: file.id });
    }
  }, [onFocusNode, setSelectedEntity, revealAndCopyFile]);

  const handleFileDoubleClick = useCallback((file: CodebaseFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (file?.path) {
      openFileInEditor(file);
    }
  }, [openFileInEditor]);

  const handleFolderDoubleClick = useCallback((folderPath: string, files?: CodebaseFile[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetPath = folderPath || getCommonFolderPath(files || []);
    if (targetPath) {
      revealFolder(targetPath);
    }
  }, [revealFolder]);

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

import { useState, useMemo, useEffect } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { FOLDER_KEYS_REGISTERED_CONFIG } from '../../constants/graph.constants';

export type ViewMode = 'scope' | 'folder' | 'tags' | 'layer' | 'typology';

export const ALLOWED_TAGS = [
  'config', 'api', 'database', 'ui', 'core', 'model',
  'Service', 'Controller', 'Repository', 'Component', 'RestController', 'Config',
  'Model / Entity', 'DTO', 'Utility', 'Helper', 'Test', 'Integration', 'UnitTest',
  'FunctionalTest', 'PerformanceTest', 'SecurityTest', 'AcceptanceTest', 'EndToEndTest',
  'Mock', 'Stub', 'Adapter', 'Decorator', 'Factory', 'Builder', 'Singleton',
  'Observer', 'Strategy', 'Command', 'Mediator', 'Proxy', 'Visitor'
];
export const LAYER_GROUPS = ["domain.model", "application", "infrastructure", "domain"];
export const TYPOLOGY_GROUPS = [
  "Front-Component",
  "Component",
  "Service",
  "RestController",
  "Controller",
  "Repository",
  "Config",
  "Model / Entity"
];

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

function compactFolderTree(nodes: FolderTreeNode[]): FolderTreeNode[] {
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

function buildFolderTreeForScope(scopeKey: string, scopeFiles: CodebaseFile[]): { rootFiles: CodebaseFile[]; folderTree: FolderTreeNode[] } {
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

export function useCodebaseExplorerPanel(
  codebase: CodebaseData,
  expandedFolders?: Record<string, boolean>,
  toggleFolder?: (folder: string) => void
) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('scope');

  const handleExportCodebase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codebase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "codebase-ast.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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

  const handleExpandAll = (
    customToggleFolder?: (folder: string) => void,
    customExpandedFolders?: Record<string, boolean>
  ) => {
    const tf = customToggleFolder || toggleFolder;
    const ef = customExpandedFolders || expandedFolders || {};
    if (!tf) return;
    const keysWithDepth = collectFolderKeysWithDepth(groupedScopes);
    keysWithDepth.forEach(({ key }) => {
      if (ef[key] === false) {
        tf(key);
      }
    });
  };

  const handleCollapseAll = (
    customToggleFolder?: (folder: string) => void,
    customExpandedFolders?: Record<string, boolean>,
    overrideViewMode?: ViewMode
  ) => {
    const tf = customToggleFolder || toggleFolder;
    const ef = customExpandedFolders || expandedFolders || {};
    if (!tf) return;

    const mode = overrideViewMode || viewMode;
    const keysWithDepth = collectFolderKeysWithDepth(groupedScopes);
    let targetCollapseLevel = 2;

    if (mode === 'folder') {
      targetCollapseLevel = 3;
    } else if (mode === 'scope') {
      targetCollapseLevel = 1;
    }

    keysWithDepth.forEach(({ key, level }) => {
      if (level >= targetCollapseLevel) {
        if (ef[key] !== false) {
          tf(key);
        }
      } else {
        if (ef[key] === false) {
          tf(key);
        }
      }
    });
  };

  useEffect(() => {
    if (!toggleFolder) return;
    handleCollapseAll(undefined, undefined, viewMode);
  }, [viewMode, groupedScopes]);

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
  };
}

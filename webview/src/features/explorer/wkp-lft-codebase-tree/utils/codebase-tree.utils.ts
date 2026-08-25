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

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
    collapseNotMatchingNodes: boolean;
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

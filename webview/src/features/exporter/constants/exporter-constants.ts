import { ExportConfig, ExportFilter } from '@/shared/services/file-exporter/model/file-exporter-model';

export const DEFAULT_EXPORT_FILTER: ExportFilter = {
  src: '',
  max_file: '50',
  inc_paths: '.*',
  exc_paths: '.*/node_modules/.*|.*/target/.*|.*/\\.git/.*|.*/dist/.*|.*/\\.idea/.*|.*/\\.vscode/.*|.*/exported-files/.*',
  inc_ext: '.*\\.(java|ts|tsx|js|html|css|json|xml|yaml|yml|py|md|properties)$',
  exc_ext: '^[^.]+$|.*\\.(?:log|tmp|lock|zip|tar|png|jpg|gif|pyc|vsix)$',
};

export const DEFAULT_REFERENCE_FILTER: ExportFilter = {
  src: '',
  max_file: '50',
  inc_paths: '.*',
  exc_paths: '.*/node_modules/.*|.*/target/.*|.*/\\.git/.*',
  inc_ext: '.*\\.(md|txt|yaml|yml|json|xml|pdf|doc|docx|html|css|ts|js|java|py)$',
  exc_ext: '^[^.]+$|.*\\.(?:log|tmp|lock|zip|tar|png|jpg|gif|pyc|vsix)$',
};

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  codebase: DEFAULT_EXPORT_FILTER,
  reference: DEFAULT_REFERENCE_FILTER,
  dest: 'exported-files',
  format: 'yaml',
  max_chunk: '0',
  groupByExt: false,
  copyGeneratedFilesToClipboard: true,
  generateTreeView: true,
  logConsole: true,
  logFile: false,
    generatePromptFile: true,
};

export interface FileCategoryGroup {
  label: string;
  includeExtsMenuEnabled?: boolean;
  excludeExtsMenuEnabled?: boolean;
  extensions: string[];
}

export const FILE_EXT_CATEGORY_GROUPS: FileCategoryGroup[] = [
  { label: "CONFIG - YAML", includeExtsMenuEnabled: true, extensions: [".*\\.yaml$", ".*\\.yml$"] },
  { label: "CONFIG - XML", includeExtsMenuEnabled: true, extensions: [".*\\.xml$", ".*\\.xsd$"] },
  { label: "CONFIG - JSON", includeExtsMenuEnabled: true, extensions: [".*\\.json$", ".*\\.jsonc$"] },
  { label: "FE - React Components", includeExtsMenuEnabled: true, extensions: [".*\\.jsx$", ".*\\.tsx$"] },
  { label: "BE - Java & JVM", includeExtsMenuEnabled: true, extensions: [".*\\.java$", ".*\\.kt$", ".*\\.groovy$"] },
  { label: "BE - Python", includeExtsMenuEnabled: true, extensions: [".*\\.py$"] },
  { label: "DOC - Markdown & Tech", includeExtsMenuEnabled: true, extensions: [".*\\.md$", ".*\\.txt$"] },
  { label: "ARCH - Zip & Compressed", excludeExtsMenuEnabled: true, extensions: [".*\\.zip$", ".*\\.tar$", ".*\\.gz$"] },
  { label: "IMG - Web & Media", excludeExtsMenuEnabled: true, extensions: [".*\\.png$", ".*\\.jpg$", ".*\\.svg$", ".*\\.gif$"] },
];

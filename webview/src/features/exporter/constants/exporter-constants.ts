import { ExportConfig } from '../types/exporter.types';

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  src: '',
  dest: 'exported-files',
  format: 'yaml',
  max_file: '50',
  max_chunk: '0',
  groupByExt: false,
  copyGeneratedFilesToClipboard: true,
  generateTreeView: true,
  logConsole: true,
  logFile: false,
  inc_paths: '.*',
  exc_paths: '.*/node_modules/.*|.*/target/.*|.*/\\.git/.*|.*/dist/.*|.*/\\.idea/.*|.*/\\.vscode/.*|.*/exported-files/.*',
  inc_ext: '.*\\.(java|ts|tsx|js|html|css|json|xml|yaml|yml|py|md|properties)$',
  exc_ext: '^[^.]+$|.*\\.(?:log|tmp|lock|zip|tar|png|jpg|gif|pyc|vsix)$',
};

export interface FileCategoryGroup {
  label: string;
  includeExtsMenuEnabled?: boolean;
  excludeExtsMenuEnabled?: boolean;
  extensions: string[];
}

export const FILE_EXT_CATEGORY_GROUPS: FileCategoryGroup[] = [
  {
    label: "CONFIG - YAML",
    includeExtsMenuEnabled: true,
    extensions: [".*\\.yaml$", ".*\\.yml$"],
  },
  {
    label: "CONFIG - XML",
    includeExtsMenuEnabled: true,
    extensions: [".*\\.xml$", ".*\\.xsd$"],
  },
  {
    label: "CONFIG - JSON",
    includeExtsMenuEnabled: true,
    extensions: [".*\\.json$", ".*\\.jsonc$"],
  },
  {
    label: "FE - React Components",
    includeExtsMenuEnabled: true,
    extensions: [".*\\.jsx$", ".*\\.tsx$"],
  },
  {
    label: "BE - Java & JVM",
    includeExtsMenuEnabled: true,
    extensions: [".*\\.java$", ".*\\.kt$", ".*\\.groovy$"],
  },
  {
    label: "BE - Python",
    includeExtsMenuEnabled: true,
    extensions: [".*\\.py$"],
  },
  {
    label: "DOC - Markdown & Tech",
    includeExtsMenuEnabled: true,
    extensions: [".*\\.md$", ".*\\.txt$"],
  },
  {
    label: "ARCH - Zip & Compressed",
    excludeExtsMenuEnabled: true,
    extensions: [".*\\.zip$", ".*\\.tar$", ".*\\.gz$"],
  },
  {
    label: "IMG - Web & Media",
    excludeExtsMenuEnabled: true,
    extensions: [".*\\.png$", ".*\\.jpg$", ".*\\.svg$", ".*\\.gif$"],
  },
];

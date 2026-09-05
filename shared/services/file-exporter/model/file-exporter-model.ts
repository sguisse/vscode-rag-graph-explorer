import { PythonScriptStatus } from "../../_python-scripts";
import { ExportFormat, ExportMode } from "../../codebase-exporter/types";

export interface ExportConfig {
  src: string;
  dest: string;
  format: ExportFormat;
  max_file: string;
  max_chunk: string;
  groupByExt: boolean;
  copyGeneratedFilesToClipboard: boolean;
  generateTreeView: boolean;
  logConsole: boolean;
  logFile: boolean;
  inc_paths: string;
  exc_paths: string;
  inc_ext: string;
  exc_ext: string;
}

export interface HistoryEntry {
  id: string;
  repo: string;
  display: string;
  frozen: boolean;
  config: ExportConfig;
}

export type HistoryViewMode = 'scope-current-repo' | 'scope-all-repo';

export interface HistoryRepoConfig {
  repo: string;
  lastRunConfigId: string;
  historyViewMode: HistoryViewMode;
}

export interface ExportExchangeLink {
  icon: string;
  url: string;
  tooltip: string;
  height?: string;
  width?: string;
  openInVSCode?: boolean;
}

export interface FileExtCategoryGroup {
  label: string;
  includeExtsMenuEnabled?: boolean;
  excludeExtsMenuEnabled?: boolean;
  extensions: string[];
}

export interface HistoryWrapperConfig {
  repo: HistoryRepoConfig[];
  lastRunConfigId?: string;
  historyViewMode?: HistoryViewMode;
  exchange?: ExportExchangeLink[];
}

export interface HistoryWrapper {
  config: HistoryWrapperConfig;
  history: HistoryEntry[];
}

export interface ExtensionMetrics {
  exported: number;
  size_rejected: {
    count: number;
    min: string;
    max: string;
  };
  regex_excluded: number;
}

export interface ExportSummary {
  folders_scanned: number;
  chunks_generated: number;
  total_exported: number;
  total_size_rejected: number;
  total_regex_excluded: number;
}

export interface GeneratedFiles {
  exports: string[];
  logs: string[];
  reports: string[];
}

export interface TreeManifestNode {
  name: string;
  type: 'directory' | 'file';
  absolute_path: string;
  extension?: string;
  children?: Record<string, TreeManifestNode>;
}

export interface TreeManifest {
  timestamp: string;
  root: TreeManifestNode;
}

export interface ExportReportData {
  summary?: ExportSummary;
  metrics_per_extension?: Record<string, ExtensionMetrics>;
  generated_files?: GeneratedFiles;
  estimatedInputTokens?: number;
  tree_manifest?: TreeManifest;
}

export interface ExportReportEnvelope {
  timestamp: string;
  configuration: Record<string, unknown>;
  results: ExportReportData;
}

export interface PricingModelItem {
  label: string;
  model: string;
  price: number;
}

export interface PricingData {
  estimatedInputTokens: number;
  llms: PricingModelItem[];
}

export interface FilesExporterInitialState {
  defaultConfig: ExportConfig;
  currentConfig: ExportConfig;
  history: HistoryEntry[];
  selectedId: string;
  historyViewMode: HistoryViewMode;
  currentRepo: string;
  workspaceRoot: string;
  exchange: ExportExchangeLink[];
  fileExtsCategoryGroups: FileExtCategoryGroup[];
  osHome: string;
  pendingPaths: string[];
}

export interface FilesExporterRunRequest {
  config: ExportConfig;
  currentHistoryId?: string;
  mode?: ExportMode;
  paths?: string[];
}

export interface HistorySaveResult {
  history: HistoryEntry[];
  selectedId: string;
}

export interface FilesExporterRunResponse {
  exportDirectory: string;
  timestamp: string;
  command: string;
  pythonScriptStatus: PythonScriptStatus;
  historyResult?: HistorySaveResult;
}

export interface FilesExporterStatus {
  pythonScriptStatus: PythonScriptStatus;
  stdout: string;
  stderr: string;
}

export interface FilesExporterResult {
  pid: number;
  exportDirectory: string;
  timestamp: string;
  report: ExportReportEnvelope;
  generatedFiles: GeneratedFiles;
  estimatedInputTokens: number;
}

export interface FilterSimulationRequest {
  input: string;
  incPaths: string;
  excPaths: string;
  incExts: string;
  excExts: string;
}

export interface FilterSimulationResult {
  code: number;
  isMatched: boolean;
  reason: string;
  stdout: string;
  stderr: string;
}

export interface GeneratedFilesFilterRequest {
  fileNameRegex?: string;
  fileContentRegex?: string;
  destDir: string;
  files: string[];
}

export interface GeneratedFilesFilterResult {
  files: string[];
}

export interface DestinationActionResult {
  success: boolean;
  message: string;
  files?: string[];
}

export interface ClipboardActionResult extends DestinationActionResult {
  fileCount: number;
  totalSizeBytes?: number;
  requiresConfirmation?: boolean;
}

export interface PathValidationResult {
  invalidPaths: string[];
}

export interface OpenPathRequest {
  path: string;
  lineNum?: number;
}

export interface OpenBrowserRequest {
  url: string;
  openInVSCode?: boolean;
}

export type FilesExporterNotificationType = 'info' | 'warn' | 'error';

export interface NotificationRequest {
  type: FilesExporterNotificationType;
  text: string;
}

export type HistoryClearMode =
  | 'remove-selected-hard'
  | 'remove-selected-soft'
  | 'clear-all-hard'
  | 'clear-all-soft';

export interface HistoryClearRequest {
  selectedId?: string;
  mode: HistoryClearMode;
}

export interface HistoryClearResult {
  history: HistoryEntry[];
  selectedId: string;
  backupPath?: string;
}

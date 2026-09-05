import {
  ClipboardActionResult,
  DestinationActionResult,
  FilesExporterInitialState,
  FilesExporterResult,
  FilesExporterRunRequest,
  FilesExporterRunResponse,
  FilesExporterStatus,
  FilterSimulationRequest,
  FilterSimulationResult,
  GeneratedFilesFilterRequest,
  GeneratedFilesFilterResult,
  NotificationRequest,
  OpenBrowserRequest,
  OpenPathRequest,
  PathValidationResult
} from "../model/file-exporter-model";

export interface IFilesExporterServicePort {
  getInitialState(pendingPaths?: string[]): Promise<FilesExporterInitialState>;
  runExport(request: FilesExporterRunRequest): Promise<FilesExporterRunResponse>;
  getExportStatus(pid: number): Promise<FilesExporterStatus>;
  getExportResult(pid: number, exportDirectory: string, timestamp: string): Promise<FilesExporterResult>;
  killExport(pid: number): Promise<boolean>;
  simulateFilters(request: FilterSimulationRequest): Promise<FilterSimulationResult>;
  getOpenEditorFiles(currentPaths: string[]): Promise<string[]>;
  getGitDiffFiles(currentPaths: string[]): Promise<DestinationActionResult>;
  syncSelectedPaths(paths: string[]): Promise<void>;
  getSelectedPaths(): Promise<string[]>;
  clearSelectedPaths(): Promise<void>;
  appendExternalPaths(paths: string[]): Promise<string[]>;
  validatePaths(paths: string[]): Promise<PathValidationResult>;
  openPathAtCursor(request: OpenPathRequest): Promise<DestinationActionResult>;
  copyLatestExportedFiles(destDir: string): Promise<ClipboardActionResult>;
  copySelectedFilesToClipboard(paths: string[], confirmed?: boolean): Promise<ClipboardActionResult>;
  clearDestDirectory(destDir: string): Promise<DestinationActionResult>;
  applyFileFilter(request: GeneratedFilesFilterRequest): Promise<GeneratedFilesFilterResult>;
  openBrowserTab(request: OpenBrowserRequest): Promise<void>;
  showNotification(request: NotificationRequest): Promise<void>;
}

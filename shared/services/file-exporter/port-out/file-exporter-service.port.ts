import { IBackendService } from '../../../core/backend-service.port';
import { FilesExporterInitialState, FilesExporterRunRequest, FilesExporterRunResponse, FilesExporterStatus, FilesExporterResult, FilterSimulationRequest, FilterSimulationResult, GeneratedFilesFilterRequest, GeneratedFilesFilterResult, DestinationActionResult, ClipboardActionResult, FilesExporterNotificationType } from '../model/file-exporter-model';

export interface IFilesExporterServicePort extends IBackendService {
  getInitialState(pendingPaths?: string[]): Promise<FilesExporterInitialState>;
  runExport(request: FilesExporterRunRequest): Promise<FilesExporterRunResponse>;
  getExportStatus(pid: number): Promise<FilesExporterStatus>;
  getExportResult(pid: number, exportDirectory: string, timestamp: string): Promise<FilesExporterResult>;
  killExport(pid: number): Promise<boolean>;
  simulateFilters(request: FilterSimulationRequest): Promise<FilterSimulationResult>;
  getOpenEditorFiles(currentPaths: string[]): Promise<string[]>;
  getGitDiffFiles(currentPaths: string[]): Promise<string[]>;
  syncSelectedPaths(paths: string[]): Promise<void>;
  getSelectedPaths(): Promise<string[]>;
  clearSelectedPaths(): Promise<void>;
  openPathAtCursor(path: string, lineNum?: number): Promise<void>;
  copyLatestExportedFiles(destDir: string): Promise<DestinationActionResult>;
  copySelectedFilesToClipboard(paths: string[]): Promise<ClipboardActionResult>;
  clearDestDirectory(destDir: string): Promise<DestinationActionResult>;
  applyFileFilter(request: GeneratedFilesFilterRequest): Promise<GeneratedFilesFilterResult>;
  openBrowserTab(url: string, openInVSCode?: boolean): Promise<void>;
  showNotification(type: FilesExporterNotificationType, text: string): Promise<void>;
}

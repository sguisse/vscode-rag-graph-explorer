import { IBackendService } from '../../../core/backend-service.port';
import { HistoryWrapper, HistoryEntry, HistoryViewMode, ExportConfig, HistorySaveResult, HistoryClearRequest, HistoryClearResult } from '../model/file-exporter-model';

export interface IFilesExporterHistoryServicePort extends IBackendService {
  getFullWrapper(currentRepo?: string): Promise<HistoryWrapper>;
  loadHistory(): Promise<HistoryEntry[]>;
  getLastRunConfigId(repo: string): Promise<string>;
  setHistoryViewMode(mode: HistoryViewMode, repo: string): Promise<void>;
  saveHistory(formData: ExportConfig, currentHistoryId: string | undefined, repo: string): Promise<HistorySaveResult>;
  duplicateEntry(id: string, repo: string): Promise<{ history: HistoryEntry[]; newId: string }>;
  addNewEntry(defaultConfig: ExportConfig, workspaceName: string, repo: string, customName?: string): Promise<{ history: HistoryEntry[]; newId: string }>;
  toggleFreeze(id: string, isFrozen: boolean): Promise<HistoryEntry[]>;
  updateEntryDisplay(id: string, newDisplay: string): Promise<HistoryEntry[]>;
  removeEntry(id: string): Promise<HistoryEntry[]>;
  clearHistory(): Promise<void>;
  softClearHistory(): Promise<void>;
  clearHistoryWithMode(request: HistoryClearRequest): Promise<HistoryClearResult>;
  getHistoryFilePath(): Promise<string>;
  openHistoryFile(): Promise<void>;
  revealHistoryFile(): Promise<void>;
}

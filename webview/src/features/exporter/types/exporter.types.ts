import { ExportConfig, HistoryEntry, ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';

export type ExporterTabId = 'report' | 'files' | 'terminal' | 'help' | 'simu' | 'tree';

export interface ExporterModalState {
  isErrorModalOpen: boolean;
  isConflictModalOpen: boolean;
  isGuardrailModalOpen: boolean;
  conflictExtensions: string[];
  conflictSource: string;
  conflictTarget: string;
  guardrailMessage?: string;
  pendingRunAction?: () => void;
  pendingConflictAction?: () => void;
}

export interface FieldValidationState {
  pathListInvalid: boolean;
  destDirInvalid: boolean;
  maxFileInvalid: boolean;
  maxChunkInvalid: boolean;
}

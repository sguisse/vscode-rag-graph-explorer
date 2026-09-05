import { ExportConfig, HistoryEntry, ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';

export type ExporterTabId = 'report' | 'files' | 'terminal' | 'help' | 'simu' | 'tree';

export interface ExporterModalState {
  isErrorModalOpen: boolean;
  isConflictModalOpen: boolean;
  isGuardrailModalOpen: boolean;
  isValidationModalOpen?: boolean;
  isDeleteModalOpen?: boolean;
  isSaveLockedModalOpen?: boolean;
  validationErrors?: string[];
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
  errors: {
    src?: string | null;
    dest?: string | null;
    max_file?: string | null;
    max_chunk?: string | null;
    inc_paths?: string | null;
    exc_paths?: string | null;
    inc_ext?: string | null;
    exc_ext?: string | null;
  };
}

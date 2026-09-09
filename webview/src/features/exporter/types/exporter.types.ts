import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';

export type ExporterTabId = 'codebase-report' | 'reference-report' | 'report' | 'files' | 'terminal' | 'prompt' | 'help' | 'llm-response';

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
  codebasePathListInvalid: boolean;
  referencePathListInvalid?: boolean;
  destDirInvalid: boolean;
  maxFileInvalid: boolean;
  maxChunkInvalid: boolean;
  errors: {
    codebase_src?: string | null;
    reference_src?: string | null;
    dest?: string | null;
    codebase_max_file?: string | null;
    reference_max_file?: string | null;
    max_chunk?: string | null;
    codebase_inc_paths?: string | null;
    codebase_exc_paths?: string | null;
    codebase_inc_ext?: string | null;
    codebase_exc_ext?: string | null;
    reference_inc_paths?: string | null;
    reference_exc_paths?: string | null;
    reference_inc_ext?: string | null;
    reference_exc_ext?: string | null;
    [key: string]: string | null | undefined;
  };
}

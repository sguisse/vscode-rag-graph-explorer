import { create } from 'zustand';
import { ExportFormat } from '@/shared/services/codebase-exporter/domain/model/types';

export interface FilesCtxExportState {
  exportFormat: ExportFormat;
  maxChunk: string;
  splitChunkByFileExtension: boolean;
  copyAsFilesToClipboard: boolean;
  targetFilePaths: string[];
  setExportFormat: (exportFormat: ExportFormat) => void;
  setMaxChunk: (maxChunk: string) => void;
  setSplitChunkByFileExtension: (splitChunkByFileExtension: boolean) => void;
  setCopyAsFilesToClipboard: (copyAsFilesToClipboard: boolean) => void;
  setTargetFilePaths: (targetFilePaths: string[]) => void;
}

export const useFilesCtxExportStore = create<FilesCtxExportState>((set) => ({
  exportFormat: 'yaml',
  maxChunk: '0',
  splitChunkByFileExtension: false,
  copyAsFilesToClipboard: false,
  targetFilePaths: [],
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setMaxChunk: (maxChunk) => set({ maxChunk }),
  setSplitChunkByFileExtension: (splitChunkByFileExtension) =>
    set({ splitChunkByFileExtension }),
  setCopyAsFilesToClipboard: (copyAsFilesToClipboard) =>
    set({ copyAsFilesToClipboard }),
  setTargetFilePaths: (targetFilePaths) => set({ targetFilePaths }),
}));

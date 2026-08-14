import { create } from 'zustand';
import { ExportFormat } from '@/shared/services/codebase-exporter/domain/model/types';

export interface FileCtxExportState {
  exportFormat: ExportFormat;
  maxChunk: string;
  splitChunkByFileExtension: boolean;
  copyAsFilesToClipboard: boolean;
  setExportFormat: (exportFormat: ExportFormat) => void;
  setMaxChunk: (maxChunk: string) => void;
  setSplitChunkByFileExtension: (splitChunkByFileExtension: boolean) => void;
  setCopyAsFilesToClipboard: (copyAsFilesToClipboard: boolean) => void;
}

export const useFileCtxExportStore = create<FileCtxExportState>((set) => ({
  exportFormat: 'yaml',
  maxChunk: '0',
  splitChunkByFileExtension: false,
  copyAsFilesToClipboard: false,
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setMaxChunk: (maxChunk) => set({ maxChunk }),
  setSplitChunkByFileExtension: (splitChunkByFileExtension) =>
    set({ splitChunkByFileExtension }),
  setCopyAsFilesToClipboard: (copyAsFilesToClipboard) =>
    set({ copyAsFilesToClipboard }),
}));

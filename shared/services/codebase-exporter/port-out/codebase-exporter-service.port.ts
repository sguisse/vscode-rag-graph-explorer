import { ExportStatus } from "../model/export-status";
import { ExportFormat } from "../types";
import { ExportArgs } from "../model/export-args";
import { ExportResult } from "../model/export-result";
export interface ICodebaseExporterServicePort {
  exportSelectedFiles(files: string[], format: ExportFormat, maxChunk: number, groupByExt: boolean): Promise<ExportStatus>;
  exportFiles (exportArgs: ExportArgs): Promise<ExportStatus>;

  getExportFilesStatus (pid: number): Promise<ExportStatus>;
  getExportFilesResult (pid: number, exportDirectory: string, timestamp: string): Promise<ExportResult>;

  readExportedFilesContent(pid: number, exportResult: ExportResult): Promise<string>;
  storeExportedFilesInClipboard(pid: number, exportResult: ExportResult): Promise<boolean>;
}

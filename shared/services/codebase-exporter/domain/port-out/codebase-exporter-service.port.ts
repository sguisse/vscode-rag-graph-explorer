import { ExportStatus } from "../model/export-status";
import { ExportFormat } from "../model/types";
import { ExportArgs } from "../model/export-args";
import { ExportResult } from "../model/export-result";
export interface ICodebaseExporterServicePort {
  exportSelectedFiles(files: string[], format: ExportFormat, maxChunk: number, groupByExt: boolean, copyToClipboard: boolean): Promise<ExportStatus>;
  exportFiles (exportArgs: ExportArgs): Promise<ExportStatus>;

  checkExportFilesStatus (pid: number): Promise<ExportStatus>;
  getExportFilesResult (pid: number, exportArgs: ExportArgs): Promise<ExportResult>;

  readExportedFilesContent(pid: number, exportArgs: ExportArgs): Promise<string>;
  storeExportedFilesInClipboard(pid: number, exportArgs: ExportArgs): Promise<boolean>;
}

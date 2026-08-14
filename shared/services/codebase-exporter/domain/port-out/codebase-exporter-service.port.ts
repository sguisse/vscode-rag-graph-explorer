import { ExportStatus } from "../model/export-status";
import { ExportFormat } from "../model/types";

export interface ICodebaseExporterServicePort {
  exportSelectedFiles(files: string[], format: ExportFormat, maxChunk: number, groupByExt: boolean, copyToClipboard: boolean): Promise<ExportStatus>;
  readExportedFileContent(filePath: string): Promise<string>;
  storeExportedFileInClipboard(filePath: string): Promise<boolean>;
}

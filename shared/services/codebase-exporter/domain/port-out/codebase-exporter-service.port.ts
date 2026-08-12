import { ExportFormat } from "../model/types";

export interface ICodebaseExporterServicePort {
  exportSelectedFiles(files: string[], format: ExportFormat): Promise<string>;
  readExportedFileContent(filePath: string): Promise<string>;
  storeExportedFileInClipboard(filePath: string): Promise<boolean>;
}

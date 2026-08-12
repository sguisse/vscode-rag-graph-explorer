import { ExportFormat } from "../model/types";

export interface ICodebaseExporterServicePort {
  exportSelectedFiles(files: string[], format: ExportFormat): Promise<string>;
}

import { ExportFormat } from "./types";
import { ExportMode } from "./types/type-export-mode";
import { ExportReport } from './export-report';

export interface ExportResult {
    pid: number;
    report: ExportReport;
}

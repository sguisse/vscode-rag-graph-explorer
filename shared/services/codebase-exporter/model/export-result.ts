import { ExportFormat } from "../types";
import { ExportReport } from './export-report';

export interface ExportResult {
    pid: number;
    report: ExportReport;
}

import { ExportFormat } from "../../codebase-exporter/types/type-export-format.gen";

export interface ExportConfig {
  src: string;
  dest: string;
  format: ExportFormat;
  max_file: string;
  max_chunk: string;
  groupByExt: boolean;
  copyGeneratedFilesToClipboard: boolean;
  generateTreeView: boolean;
  logConsole: boolean;
  logFile: boolean;
  inc_paths: string;
  exc_paths: string;
  inc_ext: string;
  exc_ext: string;
}

export interface HistoryEntry {
  id: string;
  repo: string;
  display: string;
  frozen: boolean;
  config: ExportConfig;
}

export interface ExtensionMetrics {
  exported: number;
  size_rejected: {
    count: number;
    min: string;
    max: string;
  };
  regex_excluded: number;
}

export interface ExportSummary {
  folders_scanned: number;
  chunks_generated: number;
  total_exported: number;
  total_size_rejected: number;
  total_regex_excluded: number;
}

export interface GeneratedFiles {
  exports: string[];
  logs: string[];
  reports: string[];
}

export interface ExportReportData {
  summary?: ExportSummary;
  metrics_per_extension?: Record<string, ExtensionMetrics>;
  generated_files?: GeneratedFiles;
  estimatedInputTokens?: number;
  tree_manifest?: any;
}

export interface PricingModelItem {
  label: string;
  model: string;
  price: number;
}

export interface PricingData {
  estimatedInputTokens: number;
  llms: PricingModelItem[];
}

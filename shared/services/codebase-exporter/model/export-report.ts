import { ExportFormat } from "../types";

// export-report.ts

export interface ExportFilters {
  inc_paths: string[];
  exc_paths: string[];
  inc_ext: string[];
  exclude_ext: string[];
}

export interface ExportConfiguration {
  source_dirs: string[];
  dest_dir: string;
  format: string;
  max_file_size_kb: number;
  max_output_size_kb: number;
  generate_log_console: boolean;
  generate_log_file: boolean;
  group_export_by_file_extension: boolean;
  generate_tree_view: boolean;
  filters: ExportFilters;
}

export interface SizeRejectedMetrics {
  count: number;
  min: string;
  max: string;
}

export interface ExtensionMetrics {
  exported: number;
  size_rejected: SizeRejectedMetrics;
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

export interface ExportResults {
  summary: ExportSummary;
  metrics_per_extension: Record<string, ExtensionMetrics>;
  generated_files: GeneratedFiles;
}

export interface ExportReport {
  timestamp: string;
  configuration: ExportConfiguration;
  results: ExportResults;
}

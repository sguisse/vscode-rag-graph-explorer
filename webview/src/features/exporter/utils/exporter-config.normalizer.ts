import { DEFAULT_EXPORT_CONFIG, DEFAULT_EXPORT_FILTER, DEFAULT_REFERENCE_FILTER } from '../constants/exporter-constants';
import { ExportConfig, ExportFilter } from '@/shared/services/file-exporter/model/file-exporter-model';

export function normalizeExportFilter(rawFilter: any, fallbackDefault: ExportFilter): ExportFilter {
  if (!rawFilter || typeof rawFilter !== 'object') {
    return { ...fallbackDefault };
  }
  return {
    src: rawFilter.src ?? '',
    max_file: String(rawFilter.max_file ?? fallbackDefault.max_file),
    inc_paths: rawFilter.inc_paths ?? fallbackDefault.inc_paths,
    exc_paths: rawFilter.exc_paths ?? fallbackDefault.exc_paths,
    inc_ext: rawFilter.inc_ext ?? fallbackDefault.inc_ext,
    exc_ext: rawFilter.exc_ext ?? fallbackDefault.exc_ext,
  };
}

export function normalizeExportConfig(rawConfig: any): ExportConfig {
  if (!rawConfig) return DEFAULT_EXPORT_CONFIG;

  const codebaseFilter: ExportFilter = rawConfig.codebase
    ? normalizeExportFilter(rawConfig.codebase, DEFAULT_EXPORT_FILTER)
    : {
        src: rawConfig.codebase_src ?? rawConfig.src ?? '',
        max_file: String(rawConfig.codebase_max_file ?? rawConfig.max_file ?? DEFAULT_EXPORT_FILTER.max_file),
        inc_paths: rawConfig.codebase_inc_paths ?? rawConfig.inc_paths ?? DEFAULT_EXPORT_FILTER.inc_paths,
        exc_paths: rawConfig.codebase_exc_paths ?? rawConfig.exc_paths ?? DEFAULT_EXPORT_FILTER.exc_paths,
        inc_ext: rawConfig.codebase_inc_ext ?? rawConfig.inc_ext ?? DEFAULT_EXPORT_FILTER.inc_ext,
        exc_ext: rawConfig.codebase_exc_ext ?? rawConfig.exc_ext ?? DEFAULT_EXPORT_FILTER.exc_ext,
      };

  const referenceFilter: ExportFilter = rawConfig.reference
    ? normalizeExportFilter(rawConfig.reference, DEFAULT_REFERENCE_FILTER)
    : {
        src: rawConfig.reference_src ?? '',
        max_file: String(rawConfig.reference_max_file ?? DEFAULT_REFERENCE_FILTER.max_file),
        inc_paths: rawConfig.reference_inc_paths ?? DEFAULT_REFERENCE_FILTER.inc_paths,
        exc_paths: rawConfig.reference_exc_paths ?? DEFAULT_REFERENCE_FILTER.exc_paths,
        inc_ext: rawConfig.reference_inc_ext ?? DEFAULT_REFERENCE_FILTER.inc_ext,
        exc_ext: rawConfig.reference_exc_ext ?? DEFAULT_REFERENCE_FILTER.exc_ext,
      };

  return {
    codebase: codebaseFilter,
    reference: referenceFilter,
    dest: rawConfig.dest ?? 'exported-files',
    format: rawConfig.format ?? 'yaml',
    max_chunk: String(rawConfig.max_chunk ?? '0'),
    groupByExt: Boolean(rawConfig.groupByExt),
    copyGeneratedFilesToClipboard: Boolean(rawConfig.copyGeneratedFilesToClipboard),
    generateTreeView: Boolean(rawConfig.generateTreeView),
    logConsole: Boolean(rawConfig.logConsole),
    logFile: Boolean(rawConfig.logFile),
    generatePromptFile: rawConfig.generatePromptFile !== false,
    prompt: rawConfig.prompt ?? '',
  };
}

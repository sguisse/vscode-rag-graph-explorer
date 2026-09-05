import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';

/**
 * Compares current in-memory screen configuration against the saved profile configuration.
 * Returns true if any field value differs.
 */
export function isConfigDirty(current: ExportConfig, target: ExportConfig | null | undefined): boolean {
  if (!target) return false;

  const norm = (s: string | undefined | null) => (s || '').trim().replace(/\r\n/g, '\n');

  return (
    norm(current.src) !== norm(target.src) ||
    norm(current.dest) !== norm(target.dest) ||
    current.format !== target.format ||
    norm(String(current.max_file)) !== norm(String(target.max_file)) ||
    norm(String(current.max_chunk)) !== norm(String(target.max_chunk)) ||
    Boolean(current.groupByExt) !== Boolean(target.groupByExt) ||
    Boolean(current.copyGeneratedFilesToClipboard) !== Boolean(target.copyGeneratedFilesToClipboard) ||
    Boolean(current.generateTreeView) !== Boolean(target.generateTreeView) ||
    Boolean(current.logConsole) !== Boolean(target.logConsole) ||
    Boolean(current.logFile) !== Boolean(target.logFile) ||
    norm(current.inc_paths) !== norm(target.inc_paths) ||
    norm(current.exc_paths) !== norm(target.exc_paths) ||
    norm(current.inc_ext) !== norm(target.inc_ext) ||
    norm(current.exc_ext) !== norm(target.exc_ext)
  );
}

import { useState, useMemo } from 'react';
import {
  ExportReportData,
  SingleScopeReportData,
  ExtensionMetrics,
} from '@/shared/services/file-exporter/model/file-exporter-model';

export type SortColumnKey = 'ext' | 'exported' | 'size' | 'rejected' | 'excluded';
export type SortDirection = 'asc' | 'desc';

export interface SortRule {
  key: SortColumnKey;
  dir: SortDirection;
}

export interface ExtensionMetricRow {
  ext: string;
  exported: number;
  size: number;
  size_rejected: {
    count: number;
    min: string;
    max: string;
  };
  regex_excluded: number;
}

export interface UseReportTableProps {
  reportData: ExportReportData | SingleScopeReportData | null;
  onAppendExtension?: (ext: string, mode: 'inc' | 'exc') => void;
  onSetMaxFileSize?: (kb: number) => void;
}

export function formatBytes(bytes: number = 0): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useReportTable({
  reportData,
  onAppendExtension,
  onSetMaxFileSize,
}: UseReportTableProps) {
  const [sortRules, setSortRules] = useState<SortRule[]>([
    { key: 'exported', dir: 'desc' },
    { key: 'size', dir: 'desc' },
    { key: 'rejected', dir: 'desc' },
    { key: 'excluded', dir: 'desc' },
  ]);

  const metricsList = useMemo<ExtensionMetricRow[]>(() => {
    if (!reportData) return [];

    const rawMetrics: Record<string, ExtensionMetrics | unknown> =
      reportData.metrics_per_extension || {};

    const list: ExtensionMetricRow[] = Object.entries(rawMetrics).map(([ext, val]) => {
      const m = (val || {}) as ExtensionMetrics & { size?: number };
      const exported =
        typeof m.exported === 'number'
          ? m.exported
          : parseInt(String(m.exported || 0), 10) || 0;
      const size =
        typeof m.size === 'number'
          ? m.size
          : parseInt(String(m.size || 0), 10) || 0;
      const excluded =
        typeof m.regex_excluded === 'number'
          ? m.regex_excluded
          : parseInt(String(m.regex_excluded || 0), 10) || 0;

      return {
        ext,
        exported,
        size,
        regex_excluded: excluded,
        size_rejected: m.size_rejected || { count: 0, min: '0', max: '0' },
      };
    });

    if (sortRules.length === 0) return list;

    return [...list].sort((a, b) => {
      for (const rule of sortRules) {
        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (rule.key) {
          case 'ext':
            valA = a.ext.toLowerCase();
            valB = b.ext.toLowerCase();
            break;
          case 'exported':
            valA = a.exported;
            valB = b.exported;
            break;
          case 'size':
            valA = a.size;
            valB = b.size;
            break;
          case 'rejected':
            valA = a.size_rejected.count;
            valB = b.size_rejected.count;
            break;
          case 'excluded':
            valA = a.regex_excluded;
            valB = b.regex_excluded;
            break;
        }

        if (valA < valB) return rule.dir === 'asc' ? -1 : 1;
        if (valA > valB) return rule.dir === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [reportData, sortRules]);

  const totals = useMemo(() => {
    let sumExported = 0;
    let sumSize = 0;
    let sumRejected = 0;
    let sumExcluded = 0;

    for (const item of metricsList) {
      sumExported += item.exported;
      sumSize += item.size;
      sumRejected += item.size_rejected.count;
      sumExcluded += item.regex_excluded;
    }

    return {
      nbExtensions: metricsList.length,
      sumExported,
      sumSize,
      sumRejected,
      sumExcluded,
    };
  }, [metricsList]);

  const handleSortToggle = (key: SortColumnKey, isShiftPressed: boolean) => {
    setSortRules((prev) => {
      const existingIdx = prev.findIndex((r) => r.key === key);

      if (!isShiftPressed) {
        if (existingIdx !== -1) {
          const currentDir = prev[existingIdx].dir;
          return [{ key, dir: currentDir === 'asc' ? 'desc' : 'asc' }];
        }
        return [{ key, dir: 'desc' }];
      }

      if (existingIdx !== -1) {
        const next = [...prev];
        const currentDir = next[existingIdx].dir;
        if (currentDir === 'asc') {
          next[existingIdx] = { key, dir: 'desc' };
        } else {
          next.splice(existingIdx, 1);
        }
        return next;
      }

      return [...prev, { key, dir: 'desc' }];
    });
  };

  const handleExtensionClick = (ext: string, e: React.MouseEvent) => {
    if (!onAppendExtension) return;
    const mode = e.metaKey || e.ctrlKey ? 'exc' : 'inc';
    onAppendExtension(ext, mode);
  };

  const handleMaxFileSizeClick = (maxKb: number) => {
    if (onSetMaxFileSize) {
      onSetMaxFileSize(maxKb);
    }
  };

  return {
    metricsList,
    totals,
    sortRules,
    handleSortToggle,
    handleExtensionClick,
    handleMaxFileSizeClick,
  };
}

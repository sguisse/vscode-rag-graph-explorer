import React, { useState, useMemo } from 'react';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface ExtensionMetricRow {
  ext: string;
  exported: number;
  size_rejected: {
    count: number;
    min: string;
    max: string;
  };
  regex_excluded: number;
}

export type SortColumnKey = 'ext' | 'exported' | 'rejected' | 'excluded';

export interface SortRule {
  key: SortColumnKey;
  dir: 'asc' | 'desc';
}

interface UseReportTableProps {
  reportData: ExportReportData | null;
  onAppendExtension?: (ext: string, mode: 'inc' | 'exc') => void;
  onSetMaxFileSize?: (kb: number) => void;
}

export function useReportTable({ reportData, onAppendExtension, onSetMaxFileSize }: UseReportTableProps) {
  // Default multi-sort priority: Exported, Size Rejected, Excluded
  const [sortRules, setSortRules] = useState<SortRule[]>([
    { key: 'exported', dir: 'desc' },
    { key: 'rejected', dir: 'desc' },
    { key: 'excluded', dir: 'desc' },
  ]);

  const rawData = useMemo<ExtensionMetricRow[]>(() => {
    const metrics = reportData?.metrics_per_extension || {};
    return Object.entries(metrics).map(([ext, m]) => {
      const exported = typeof m.exported === 'number' ? m.exported : parseInt(String(m.exported || 0), 10) || 0;
      const excluded = typeof m.regex_excluded === 'number' ? m.regex_excluded : parseInt(String(m.regex_excluded || 0), 10) || 0;
      return {
        ext,
        exported,
        size_rejected: m.size_rejected || { count: 0, min: '0', max: '0' },
        regex_excluded: excluded,
      };
    });
  }, [reportData]);

  const totals = useMemo(() => {
    const nbExtensions = rawData.length;
    let sumExported = 0;
    let sumRejected = 0;
    let sumExcluded = 0;

    for (const row of rawData) {
      sumExported += row.exported;
      sumRejected += row.size_rejected.count;
      sumExcluded += row.regex_excluded;
    }

    return {
      nbExtensions,
      sumExported,
      sumRejected,
      sumExcluded,
    };
  }, [rawData]);

  const sortedData = useMemo(() => {
    if (sortRules.length === 0) return rawData;

    return [...rawData].sort((a, b) => {
      for (const rule of sortRules) {
        let valA: number | string = 0;
        let valB: number | string = 0;

        if (rule.key === 'ext') {
          valA = a.ext.toLowerCase();
          valB = b.ext.toLowerCase();
        } else if (rule.key === 'exported') {
          valA = a.exported;
          valB = b.exported;
        } else if (rule.key === 'rejected') {
          valA = a.size_rejected.count;
          valB = b.size_rejected.count;
        } else if (rule.key === 'excluded') {
          valA = a.regex_excluded;
          valB = b.regex_excluded;
        }

        if (valA !== valB) {
          if (typeof valA === 'string' && typeof valB === 'string') {
            const comp = valA.localeCompare(valB);
            return rule.dir === 'asc' ? comp : -comp;
          }
          const comp = (valA as number) - (valB as number);
          return rule.dir === 'asc' ? comp : -comp;
        }
      }
      return 0;
    });
  }, [rawData, sortRules]);

  const handleSortToggle = (key: SortColumnKey, isMulti: boolean = false) => {
    setSortRules((prev) => {
      const existingIndex = prev.findIndex((r) => r.key === key);
      if (isMulti) {
        if (existingIndex >= 0) {
          const currentDir = prev[existingIndex].dir;
          if (currentDir === 'asc') {
            const next = [...prev];
            next[existingIndex] = { key, dir: 'desc' };
            return next;
          } else {
            return prev.filter((r) => r.key !== key);
          }
        } else {
          return [...prev, { key, dir: 'asc' }];
        }
      } else {
        if (existingIndex === 0) {
          const currentDir = prev[0].dir;
          return [{ key, dir: currentDir === 'asc' ? 'desc' : 'asc' }];
        }
        return [{ key, dir: 'desc' }];
      }
    });
  };

  const handleExtensionClick = (ext: string, e: React.MouseEvent) => {
    const mode = e.metaKey || e.ctrlKey ? 'exc' : 'inc';
    logInfo('[ReportTablePanel] handleExtensionClick handler triggered', [{ ext, mode }]);
    if (onAppendExtension) {
      onAppendExtension(ext, mode);
    }
  };

  const handleMaxFileSizeClick = (kb: number) => {
    logInfo('[ReportTablePanel] handleMaxFileSizeClick handler triggered', [kb]);
    if (onSetMaxFileSize) {
      onSetMaxFileSize(kb);
    }
  };

  return {
    metricsList: sortedData,
    totals,
    sortRules,
    handleSortToggle,
    handleExtensionClick,
    handleMaxFileSizeClick,
  };
}

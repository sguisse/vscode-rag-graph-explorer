import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { useReportTable, SortColumnKey, ExtensionMetricRow } from './hooks/use-report-table';

interface ReportTablePanelProps {
  reportData: ExportReportData | null;
  onAppendExtension?: (ext: string, mode: 'inc' | 'exc') => void;
  onSetMaxFileSize?: (kb: number) => void;
}

export const ReportTablePanel: React.FC<ReportTablePanelProps> = ({
  reportData,
  onAppendExtension,
  onSetMaxFileSize,
}) => {
  const {
    metricsList,
    totals,
    sortRules,
    handleSortToggle,
    handleExtensionClick,
    handleMaxFileSizeClick,
  } = useReportTable({
    reportData,
    onAppendExtension,
    onSetMaxFileSize,
  });

  const getSortIcon = (key: SortColumnKey) => {
    const ruleIndex = sortRules.findIndex((r) => r.key === key);
    if (ruleIndex === -1) {
      return <ArrowUpDown size={11} className="opacity-40 shrink-0" />;
    }
    const rule = sortRules[ruleIndex];
    const badgeNum = sortRules.length > 1 ? <span className="text-[9px] font-mono leading-none ml-0.5">{ruleIndex + 1}</span> : null;

    return (
      <span className="flex items-center text-primary font-bold">
        {rule.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
        {badgeNum}
      </span>
    );
  };

  const getRowClassName = (row: ExtensionMetricRow, index: number) => {
    const isExcluded = Number(row.regex_excluded) > 0;
    const isRejected = row.size_rejected.count > 0;

    // Prioritization coloration:
    // 3. Excluded rows should be with destructive color (highest priority)
    if (isExcluded) {
      return 'bg-destructive/15 text-destructive font-semibold hover:bg-destructive/25 transition-colors';
    }
    // 2. Rejected rows should be with amber color (medium priority)
    if (isRejected) {
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-500/25 transition-colors';
    }
    // 1. Even/odd zebra color (lowest priority) - enhanced contrast
    return index % 2 === 0
      ? 'bg-card hover:bg-muted/50 transition-colors'
      : 'bg-muted/70 hover:bg-muted transition-colors';
  };

  return (
    <Card className="space-y-2 bg-card p-3 border border-border rounded-md h-full flex flex-col min-h-0 font-mono text-xs select-none">
      <div className="flex items-center justify-between font-bold text-foreground text-xs shrink-0">
        <span>📊 Exported files Metrics ({metricsList.length})</span>
        <span className="text-[10px] text-muted-foreground font-normal">
          Shift+Click column headers to multi-sort
        </span>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 border border-border rounded-md relative">
        <table className="w-full text-[11px] text-left border-collapse">
          <thead className="sticky top-0 bg-muted font-bold text-primary z-10 shadow-xs">
            <tr className="border-b border-border">
              <th
                onClick={(e) => handleSortToggle('ext', e.shiftKey)}
                className="p-1.5 border-r border-border cursor-pointer hover:bg-muted-foreground/10 select-none"
                data-tooltip="Click to sort extension (Shift+Click for multi-sort)"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Extension</span>
                  {getSortIcon('ext')}
                </div>
              </th>
              <th
                onClick={(e) => handleSortToggle('exported', e.shiftKey)}
                className="p-1.5 border-r border-border cursor-pointer hover:bg-muted-foreground/10 select-none"
                data-tooltip="Click to sort exported count (Shift+Click for multi-sort)"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Exported</span>
                  {getSortIcon('exported')}
                </div>
              </th>
              <th
                onClick={(e) => handleSortToggle('rejected', e.shiftKey)}
                className="p-1.5 border-r border-border cursor-pointer hover:bg-muted-foreground/10 select-none"
                data-tooltip="Click to sort rejected count (Shift+Click for multi-sort)"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Size Rejected</span>
                  {getSortIcon('rejected')}
                </div>
              </th>
              <th
                onClick={(e) => handleSortToggle('excluded', e.shiftKey)}
                className="p-1.5 cursor-pointer hover:bg-muted-foreground/10 select-none"
                data-tooltip="Click to sort excluded count (Shift+Click for multi-sort)"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Excluded</span>
                  {getSortIcon('excluded')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {metricsList.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center italic text-muted-foreground">
                  No metrics available per extension.
                </td>
              </tr>
            ) : (
              metricsList.map((row, idx) => (
                <tr key={row.ext} className={getRowClassName(row, idx)}>
                  <td className="p-1.5 border-r border-border/50 font-bold">
                    <span
                      onClick={(e) => handleExtensionClick(row.ext, e)}
                      className="hover:opacity-80 underline cursor-pointer"
                      data-tooltip="Click to Include, Cmd/Ctrl+Click to Exclude"
                    >
                      {row.ext === 'no_ext' ? 'No Extension' : row.ext}
                    </span>
                  </td>
                  <td className="p-1.5 border-r border-border/50">{row.exported || '-'}</td>
                  <td className="p-1.5 border-r border-border/50">
                    {row.size_rejected.count > 0 ? (
                      <span
                        onClick={() =>
                          handleMaxFileSizeClick(
                            Math.ceil(parseFloat(row.size_rejected.max) * 1024)
                          )
                        }
                        className="underline cursor-pointer"
                        data-tooltip="Click to update Max File Size"
                      >
                        {row.size_rejected.count} ({row.size_rejected.min} - {row.size_rejected.max})
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-1.5">{row.regex_excluded || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="sticky bottom-0 bg-muted font-bold text-foreground border-t-2 border-border z-10 shadow-xs">
            <tr>
              <td className="p-1.5 border-r border-border/50">
                Total ({totals.nbExtensions} {totals.nbExtensions === 1 ? 'ext' : 'exts'})
              </td>
              <td className="p-1.5 border-r border-border/50">{totals.sumExported}</td>
              <td className="p-1.5 border-r border-border/50 text-amber-600 dark:text-amber-400">
                {totals.sumRejected}
              </td>
              <td className="p-1.5 text-destructive">{totals.sumExcluded}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
};

export default ReportTablePanel;

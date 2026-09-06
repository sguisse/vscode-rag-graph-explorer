import React from 'react';
import { Card } from '@/components/ui/card';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { useReportTable } from './hooks/use-report-table';

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
  const { handleExtensionClick, handleMaxFileSizeClick } = useReportTable({
    onAppendExtension,
    onSetMaxFileSize,
  });

  const metrics = reportData?.metrics_per_extension || {};

  return (
    <Card className="space-y-2 bg-card p-3 border border-border rounded-md h-full overflow-y-auto font-mono text-xs">
      <div className="font-bold text-foreground text-xs">
        📊 Export Metrics per File Extension
      </div>

      <div className="overflow-x-auto">
        <table className="border border-border w-full text-[11px] text-left border-collapse">
          <thead>
            <tr className="bg-muted font-bold text-primary">
              <th className="p-1.5 border border-border">Extension</th>
              <th className="p-1.5 border border-border">Exported</th>
              <th className="p-1.5 border border-border">Size Rejected</th>
              <th className="p-1.5 border border-border">Excluded</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(metrics).length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center italic text-muted-foreground">
                  No metrics available per extension.
                </td>
              </tr>
            ) : (
              Object.entries(metrics).map(([ext, m]) => (
                <tr key={ext} className="hover:bg-muted/40 transition-colors">
                  <td className="p-1.5 border border-border font-bold">
                    <span
                      onClick={(e) => handleExtensionClick(ext, e)}
                      className="hover:opacity-80 text-primary underline cursor-pointer"
                      data-tooltip="Click to Include, Cmd/Ctrl+Click to Exclude"
                    >
                      {ext === 'no_ext' ? 'No Extension' : ext}
                    </span>
                  </td>
                  <td className="p-1.5 border border-border">{m.exported || '-'}</td>
                  <td className="p-1.5 border border-border text-amber-500">
                    {m.size_rejected.count > 0 ? (
                      <span
                        onClick={() =>
                          handleMaxFileSizeClick(
                            Math.ceil(parseFloat(m.size_rejected.max) * 1024)
                          )
                        }
                        className="underline cursor-pointer"
                        data-tooltip="Click to update Max File Size"
                      >
                        {m.size_rejected.count} ({m.size_rejected.min} - {m.size_rejected.max})
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-1.5 border border-border text-destructive">
                    {m.regex_excluded || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ReportTablePanel;

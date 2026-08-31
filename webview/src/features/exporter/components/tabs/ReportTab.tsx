import React from 'react';
import { PricingService } from '../../utils/pricing-calculator';
import { Card } from '@/components/ui/card';
import { ExportReportData } from '@/shared/services/files-exporter/model/files-exporter-model';

interface ReportTabProps {
  reportData: ExportReportData | null;
  onAppendExtension: (ext: string, mode: 'inc' | 'exc') => void;
  onSetMaxFileSize: (kb: number) => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  reportData,
  onAppendExtension,
  onSetMaxFileSize,
}) => {
  if (!reportData) {
    return (
      <div className="p-8 font-mono text-muted-foreground text-xs text-center italic">
        No export report available. Execute an export run to review metrics.
      </div>
    );
  }

  const tokens = reportData.estimatedInputTokens || 0;
  const pricing = PricingService.calculateTokenCost(tokens);
  const metrics = reportData.metrics_per_extension || {};

  return (
    <div className="space-y-4 bg-background p-4 font-mono text-xs">
      <Card className="space-y-2 bg-card p-3 border border-border">
        <div className="flex justify-between items-center font-bold text-foreground text-xs">
          <span>💰 Token Cost Estimation ({pricing.estimatedInputTokens.toLocaleString()} Tokens)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="border border-border w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="bg-muted font-bold text-primary">
                <th className="p-1.5 border border-border">LLM Vendor</th>
                <th className="p-1.5 border border-border">Model</th>
                <th className="p-1.5 border border-border">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {pricing.llms.map((item) => (
                <tr key={item.model} className="hover:bg-muted/40">
                  <td className="p-1.5 border border-border">{item.label}</td>
                  <td className="p-1.5 border border-border font-semibold">{item.model}</td>
                  <td className="p-1.5 border border-border font-bold text-emerald-500">
                    ${item.price.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-2 bg-card p-3 border border-border">
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
              {Object.entries(metrics).map(([ext, m]) => (
                <tr key={ext} className="hover:bg-muted/40">
                  <td className="p-1.5 border border-border font-bold">
                    <span
                      onClick={(e) =>
                        onAppendExtension(ext, e.metaKey || e.ctrlKey ? 'exc' : 'inc')
                      }
                      className="hover:opacity-80 text-primary underline cursor-pointer"
                      title="Click to Include, Cmd/Ctrl+Click to Exclude"
                    >
                      {ext === 'no_ext' ? 'No Extension' : ext}
                    </span>
                  </td>
                  <td className="p-1.5 border border-border">{m.exported || '-'}</td>
                  <td className="p-1.5 border border-border text-amber-500">
                    {m.size_rejected.count > 0 ? (
                      <span
                        onClick={() =>
                          onSetMaxFileSize(
                            Math.ceil(parseFloat(m.size_rejected.max) * 1024)
                          )
                        }
                        className="underline cursor-pointer"
                        title="Click to update Max File Size"
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

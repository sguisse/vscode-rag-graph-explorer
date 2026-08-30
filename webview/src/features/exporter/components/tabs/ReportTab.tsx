import React from 'react';
import { ExportReportData } from '../../types/exporter.types';
import { PricingService } from '../../utils/pricing-calculator';
import { Card } from '@/components/ui/card';

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
      <div className="p-8 text-center text-muted-foreground font-mono text-xs italic">
        No export report available. Execute an export run to review metrics.
      </div>
    );
  }

  const tokens = reportData.estimatedInputTokens || 0;
  const pricing = PricingService.calculateTokenCost(tokens);
  const metrics = reportData.metrics_per_extension || {};

  return (
    <div className="p-4 space-y-4 font-mono text-xs bg-background">
      <Card className="p-3 border border-border bg-card space-y-2">
        <div className="font-bold text-foreground text-xs flex justify-between items-center">
          <span>💰 Token Cost Estimation ({pricing.estimatedInputTokens.toLocaleString()} Tokens)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border text-[11px]">
            <thead>
              <tr className="bg-muted text-primary font-bold">
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
                  <td className="p-1.5 border border-border text-emerald-500 font-bold">
                    ${item.price.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-3 border border-border bg-card space-y-2">
        <div className="font-bold text-foreground text-xs">
          📊 Export Metrics per File Extension
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-border text-[11px]">
            <thead>
              <tr className="bg-muted text-primary font-bold">
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
                      className="text-primary underline cursor-pointer hover:opacity-80"
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

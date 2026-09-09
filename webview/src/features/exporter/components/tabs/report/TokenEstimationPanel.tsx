import React from 'react';
import { ChevronDown, ChevronRight, Cpu } from 'lucide-react';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useTokenEstimation } from './hooks/use-token-estimation';

interface TokenEstimationPanelProps {
  tokens?: number;
  codebaseFilesCount?: number;
  referenceFilesCount?: number;
}

export const TokenEstimationPanel: React.FC<TokenEstimationPanelProps> = ({
  tokens = 0,
  codebaseFilesCount = 0,
  referenceFilesCount = 0,
}) => {
  const {
    vendorGroups,
    isVendorExpanded,
    toggleVendor,
    estimatedInputTokensFormatted,
  } = useTokenEstimation(tokens);

  return (
    <CollapsibleCard
      id="block-token-estimation"
      title={`💰 Token Cost Estimation : ${estimatedInputTokensFormatted} Tokens for context of ${codebaseFilesCount} codebase and ${referenceFilesCount} reference files`}
      tooltip="Estimated LLM input token usage and costs across major AI providers."
      defaultOpen={false}
      className="w-full min-w-0 shrink-0"
    >
      <div className="overflow-y-auto max-h-[300px] border border-border rounded-md">
        <table className="border-collapse w-full text-[11px] text-left font-mono">
          <thead className="sticky top-0 bg-muted font-bold text-primary z-10 shadow-xs">
            <tr className="border-b border-border">
              <th className="p-1.5 border-r border-border w-1/3">LLM Vendor</th>
              <th className="p-1.5 border-r border-border w-1/3">Model</th>
              <th className="p-1.5 w-1/3">
                ⚠️ Estimation cost (fake for now !!!!), <br/>Cost will be implemented soon !
              </th>
            </tr>
          </thead>
          <tbody>
            {vendorGroups.map((group) => {
              const expanded = isVendorExpanded(group.vendor);
              return (
                <React.Fragment key={group.vendor}>
                  {/* Collapsible Vendor Group Header Row */}
                  <tr
                    onClick={() => toggleVendor(group.vendor)}
                    className="bg-muted/50 hover:bg-muted/80 font-bold border-b border-border/60 cursor-pointer select-none transition-colors"
                  >
                    <td colSpan={3} className="p-1.5">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <span className="text-primary shrink-0">
                          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </span>
                        <Cpu size={13} className="text-primary shrink-0" />
                        <span>{group.vendor}</span>
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">
                          ({group.models.length} {group.models.length === 1 ? 'model' : 'models'})
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Model Rows under Vendor */}
                  {expanded &&
                    group.models.map((item, idx) => (
                      <tr
                        key={item.model}
                        className={`border-b border-border/30 transition-colors ${
                          idx % 2 === 0 ? 'bg-card hover:bg-muted/40' : 'bg-muted/30 hover:bg-muted/60'
                        }`}
                      >
                        <td className="p-1.5 pl-6 border-r border-border/40 text-muted-foreground italic">
                          ↳ {group.vendor}
                        </td>
                        <td className="p-1.5 border-r border-border/40 font-semibold text-foreground">
                          {item.model}
                        </td>
                        <td className="p-1.5 font-bold text-emerald-500">
                          ${item.price.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
};

export default TokenEstimationPanel;

import React from 'react';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useTokenEstimation } from './hooks/use-token-estimation';

interface TokenEstimationPanelProps {
  tokens?: number;
}

export const TokenEstimationPanel: React.FC<TokenEstimationPanelProps> = ({ tokens = 0 }) => {
  const { pricing, estimatedInputTokensFormatted } = useTokenEstimation(tokens);

  return (
    <CollapsibleCard
      id="block-token-estimation"
      title={`💰 Token Cost Estimation (${estimatedInputTokensFormatted} Tokens)`}
      tooltip="Estimated LLM input token usage and costs across major AI providers."
      defaultOpen={false}
      className="w-full min-w-0 shrink-0"
    >
      <div className="overflow-x-auto">
        <table className="border border-border w-full text-[11px] text-left border-collapse font-mono">
          <thead>
            <tr className="bg-muted font-bold text-primary">
              <th className="p-1.5 border border-border">LLM Vendor</th>
              <th className="p-1.5 border border-border">Model</th>
              <th className="p-1.5 border border-border">Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            {pricing.llms.map((item) => (
              <tr key={item.model} className="hover:bg-muted/40 transition-colors">
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
    </CollapsibleCard>
  );
};

export default TokenEstimationPanel;

import { useMemo } from 'react';
import { PricingService } from '../../../../utils/pricing-calculator';

export function useTokenEstimation(tokens: number = 0) {
  const pricing = useMemo(() => {
    return PricingService.calculateTokenCost(tokens);
  }, [tokens]);

  return {
    pricing,
    estimatedInputTokensFormatted: pricing.estimatedInputTokens.toLocaleString(),
  };
}

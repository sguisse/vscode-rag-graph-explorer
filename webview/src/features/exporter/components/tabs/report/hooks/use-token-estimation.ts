import { useState, useMemo } from 'react';
import { PricingService } from '../../../../utils/pricing-calculator';

export interface VendorModelItem {
  model: string;
  price: number;
}

export interface VendorGroup {
  vendor: string;
  models: VendorModelItem[];
}

export function useTokenEstimation(tokens: number = 0) {
  const pricing = useMemo(() => {
    return PricingService.calculateTokenCost(tokens);
  }, [tokens]);

  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({});

  const vendorGroups = useMemo<VendorGroup[]>(() => {
    const map = new Map<string, VendorModelItem[]>();
    for (const item of pricing.llms) {
      if (!map.has(item.label)) {
        map.set(item.label, []);
      }
      map.get(item.label)!.push({ model: item.model, price: item.price });
    }

    const groups: VendorGroup[] = [];
    for (const [vendor, models] of map.entries()) {
      models.sort((a, b) => a.model.localeCompare(b.model));
      groups.push({ vendor, models });
    }
    groups.sort((a, b) => a.vendor.localeCompare(b.vendor));
    return groups;
  }, [pricing.llms]);

  const toggleVendor = (vendor: string) => {
    setExpandedVendors((prev) => ({
      ...prev,
      [vendor]: !(prev[vendor] ?? true),
    }));
  };

  const isVendorExpanded = (vendor: string) => {
    return expandedVendors[vendor] ?? true;
  };

  return {
    pricing,
    vendorGroups,
    isVendorExpanded,
    toggleVendor,
    estimatedInputTokensFormatted: pricing.estimatedInputTokens.toLocaleString(),
  };
}

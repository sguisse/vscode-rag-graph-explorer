import { PricingData } from "@/shared/services/file-exporter/model/file-exporter-model";


export class PricingService {
  public static calculateTokenCost(tokens: number): PricingData {
    const safeTokens = Math.max(0, tokens);

    const models = [
      { label: 'OpenAI', model: 'GPT-4o', rate: 2.50 },
      { label: 'OpenAI', model: 'GPT-4o-mini', rate: 0.15 },
      { label: 'Anthropic', model: 'Claude 3.5 Sonnet', rate: 3.00 },
      { label: 'Google', model: 'Gemini 1.5 Pro', rate: 1.25 },
      { label: 'Google', model: 'Gemini 1.5 Flash', rate: 0.075 },
      { label: 'DeepSeek', model: 'DeepSeek V3', rate: 0.14 },
    ];

    const llms = models.map((m) => ({
      label: m.label,
      model: m.model,
      price: (safeTokens / 1_000_000) * m.rate,
    }));

    return {
      estimatedInputTokens: safeTokens,
      llms,
    };
  }
}

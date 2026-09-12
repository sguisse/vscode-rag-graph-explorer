import { useState, useEffect, useMemo } from 'react';
import { LlmModelInfo, LlmTokenPrices, LlmTokenPriceConfig, LlmProvider } from '@/shared/services/llm-chat';
import { llmChatApiService } from '@/services/api/llm-chat-api.service.gen';

export type SortField =
  | 'enabled'
  | 'provider'
  | 'name'
  | 'cost'
  | 'category'
  | 'contextWindow'
  | 'maxPrompt'
  | 'maxOutput'
  | 'adaptiveThinking'
  | 'reasoningEffort'
  | 'tools'
  | 'vision'
  | 'tokenizer'
  | 'streaming'
  | 'structuredOutputs';

export type SortOrder = 'asc' | 'desc';

export interface SortRule {
  field: SortField;
  order: SortOrder;
}

export const INITIAL_SORT_RULES: SortRule[] = [
  { field: 'enabled', order: 'desc' },
  { field: 'provider', order: 'asc' },
  { field: 'name', order: 'asc' },
];

export interface ModelTableRow extends LlmModelInfo {
  rowType: 'model' | 'detail';
  detailsText: string;
  categoryText: string;
  costRating: number;
  adaptiveThinking: string;
  reasoningEfforts: string[];
  parallelToolCalls: boolean;
  tools: boolean;
  vision: boolean;
  visionTooltipText: string;
  tokenizer: string;
  streaming: boolean;
  structuredOutputs: boolean;
  maxPromptTokens?: number;
  maxOutputTokens?: number;
  promoTooltipText: string;
  hasPromo: boolean;
  subRows?: ModelTableRow[];
}

export function getTokenPrices(m: LlmModelInfo, longContext: boolean): LlmTokenPrices | undefined {
  if (longContext && m.billing?.token_prices?.long_context) {
    return m.billing.token_prices.long_context;
  }
  if (!longContext && m.billing?.token_prices) {
    return m.billing.token_prices;
  }

  return undefined;
}

export function formatBillingRates(rates?: LlmTokenPriceConfig, includeBatchSize = false, batchSize?: number): string {
  if (!rates) {
    return 'inputPrice: - | outputPrice: - | cacheReadPrice: - | cacheWritePrice: -';
  }

  const parts = [
    `inputPrice: ${rates.input_price ?? '-'}`,
    `outputPrice: ${rates.output_price ?? '-'}`,
  ];

  parts.push(`cachePrice: ${rates.cache_price ?? '-'}`);
  parts.push(`cacheReadPrice: ${rates.cache_read_price ?? '-'}`);
  parts.push(`cacheWritePrice: ${rates.cache_write_price ?? '-'}`);
  parts.push(`cacheWrite1hPrice: ${rates.cache_write_1h_price ?? '-'}`);
  parts.push(`contextMax: ${rates.context_max ?? '-'}`);
  parts.push(`maxPromptTokens: ${rates.max_prompt_tokens ?? '-'}`);

  if (includeBatchSize && batchSize !== undefined && batchSize > 0) {
    parts.push(`batchSize: ${batchSize}`);
  }

  return parts.join(' | ');
}

export function computeCostRating(m: LlmModelInfo): number {
  const tp = getTokenPrices(m, false);
  if (tp && tp.input_price !== undefined) {
    const inputPrice = tp.input_price;
    if (inputPrice === 0) return 1;
    if (inputPrice <= 100) return 2;
    if (inputPrice <= 250) return 3;
    if (inputPrice <= 450) return 4;
    return 5;
  }

  if (m.model_picker_price_category === 'low') return 1;
  if (m.model_picker_price_category === 'medium') return 3;
  if (m.model_picker_price_category === 'high') return 5;

  return 2;
}

export function formatPromoTooltip(m: LlmModelInfo): string {
  const p = m.billing?.promo;
  const tp = getTokenPrices(m, false);
  const lines: string[] = [];

  if (p) {
    if (p.id) lines.push(`<b>Promo ID:</b> ${p.id}`);
    if (p.discount_percent !== undefined) lines.push(`<b>Discount:</b> ${p.discount_percent}%`);
    if (p.message) lines.push(`<b>Message:</b> ${p.message}`);
    if (p.ends_at) lines.push(`<b>Ends At:</b> ${p.ends_at}`);
  }

  if (tp?.long_context) {
    const lc = tp.long_context;
    lines.push(`<b>Long Context Max:</b> ${lc.context_max ?? '-'}`);
    lines.push(`<b>Long Context Input:</b> ${lc.input_price ?? '-'}`);
    lines.push(`<b>Long Context Output:</b> ${lc.output_price ?? '-'}`);
  }

  return lines.join('<br/>');
}

export function formatVisionTooltip(m: LlmModelInfo): string {
  const v = m.capabilities?.limits?.vision;
  if (!v) return '';
  const lines: string[] = [];
  if (v.max_prompt_image_size) {
    lines.push(`<b>Max Prompt Image Size:</b> ${v.max_prompt_image_size}`);
  }
  if (v.max_prompt_images !== undefined) {
    lines.push(`<b>Max Prompt Images:</b> ${v.max_prompt_images}`);
  }
  if (v.supported_media_types?.length) {
    lines.push(`<b>Supported Media:</b> ${v.supported_media_types.join(', ')}`);
  }
  return lines.join('<br/>');
}

export function useLlmModelsInfo(initialProvider: LlmProvider | 'all' = 'all') {
  const [selectedProvider, setSelectedProvider] = useState<string>(initialProvider);
  const [models, setModels] = useState<LlmModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sortRules, setSortRules] = useState<SortRule[]>(INITIAL_SORT_RULES);
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState<string>('');

  useEffect(() => {
    if (initialProvider) {
      setSelectedProvider(initialProvider);
    }
  }, [initialProvider]);

  useEffect(() => {
    fetchModels();
  }, [selectedProvider]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const targetProvider = selectedProvider === 'all' ? undefined : (selectedProvider as LlmProvider);
      const res = await llmChatApiService.listAvailableModels(targetProvider);
      setModels(res || []);
    } catch (err) {
      console.error('[useLlmModelsInfo] Error listing models', err);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSort = (field: SortField, isShiftPressed: boolean = false) => {
    setSortRules((prevRules) => {
      const existingIndex = prevRules.findIndex((r) => r.field === field);

      if (isShiftPressed) {
        if (existingIndex !== -1) {
          const currentOrder = prevRules[existingIndex].order;
          if (currentOrder === 'asc') {
            const next = [...prevRules];
            next[existingIndex] = { field, order: 'desc' };
            return next;
          } else {
            return prevRules.filter((_, idx) => idx !== existingIndex);
          }
        } else {
          return [...prevRules, { field, order: 'asc' }];
        }
      } else {
        if (existingIndex !== -1 && prevRules.length === 1) {
          return [{ field, order: prevRules[0].order === 'asc' ? 'desc' : 'asc' }];
        }
        return [{ field, order: 'asc' }];
      }
    });
  };

  const clearSort = () => {
    setSortRules(INITIAL_SORT_RULES);
  };

  const tableData = useMemo<ModelTableRow[]>(() => {
    const rawRows: ModelTableRow[] = models.map((m) => {
      const costRating = computeCostRating(m);
      const sup = m.capabilities?.supports;
      const limits = m.capabilities?.limits;

      const parallelToolCalls = Boolean(sup?.parallel_tool_calls);
      const tools = Boolean(sup?.tool_calls);
      const vision = Boolean(sup?.vision);
      const streaming = Boolean(sup?.streaming);
      const structuredOutputs = Boolean(sup?.structured_outputs);
      const tokenizer = m.capabilities?.tokenizer || '-';
      const maxPromptTokens = limits?.max_prompt_tokens;
      const maxOutputTokens = limits?.max_output_tokens;
      const promoTooltipText = formatPromoTooltip(m);
      const visionTooltipText = formatVisionTooltip(m);
      const hasPromo = Boolean(m.billing?.promo);

      const adaptiveThinkingRaw = sup?.adaptive_thinking;
      const adaptiveThinking: string =
        adaptiveThinkingRaw !== undefined && adaptiveThinkingRaw !== null
          ? typeof adaptiveThinkingRaw === 'boolean'
            ? adaptiveThinkingRaw ? 'supported' : 'unsupported'
            : String(adaptiveThinkingRaw)
          : '';

      const reasoningEfforts = m.supported_reasoning_efforts || sup?.reasoning_effort || [];
      const categoryText = m.model_picker_category || '-';

      const subRows: ModelTableRow[] = [];

      if (m.capabilities?.family) {
        subRows.push({
          ...m,
          subRows: undefined,
          id: `${m.id}-family`,
          name: `Family`,
          provider: m.provider,
          rowType: 'detail',
          categoryText: '-',
          costRating: 0,
          adaptiveThinking: '',
          reasoningEfforts: [],
          parallelToolCalls: false,
          tools: false,
          vision: false,
          visionTooltipText: '',
          tokenizer: '-',
          streaming: false,
          structuredOutputs: false,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: `ID: ${m.id} | Family: ${m.capabilities.family} | Type: ${m.capabilities.type || 'chat'} | Vendor: ${m.vendor || '-'}`,
        });
      }

      if (m.policy?.terms || m.policy?.state) {
        subRows.push({
          ...m,
          subRows: undefined,
          id: `${m.id}-policy`,
          name: `Policy`,
          provider: m.provider,
          rowType: 'detail',
          categoryText: '-',
          costRating: 0,
          adaptiveThinking: '',
          reasoningEfforts: [],
          parallelToolCalls: false,
          tools: false,
          vision: false,
          visionTooltipText: '',
          tokenizer: '-',
          streaming: false,
          structuredOutputs: false,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: `State: ${m.policy.state || 'enabled'} | Terms: ${m.policy.terms || 'Enabled for workspace'}`,
        });
      }

      let tp = getTokenPrices(m, false);
      const formattedTokenPricesText = formatBillingRates(tp, true, tp?.batch_size);

      subRows.push({
        ...m,
        subRows: undefined,
        id: `${m.id}-billing-token-prices`,
        name: `Billing (token_prices)`,
        provider: m.provider,
        rowType: 'detail',
        categoryText: '-',
        costRating: 0,
        adaptiveThinking: '',
        reasoningEfforts: [],
        parallelToolCalls: false,
        tools: false,
        vision: false,
        visionTooltipText: '',
        tokenizer: '-',
        streaming: false,
        structuredOutputs: false,
        promoTooltipText: '',
        hasPromo: false,
        detailsText: formattedTokenPricesText,
      });

      let tpLongContext = getTokenPrices(m, true);
      if (tpLongContext) {
        const formattedLongContextText = formatBillingRates(tpLongContext, false);

        subRows.push({
          ...m,
          subRows: undefined,
          id: `${m.id}-billing-long-context`,
          name: `Billing (longContext)`,
          provider: m.provider,
          rowType: 'detail',
          categoryText: '-',
          costRating: 0,
          adaptiveThinking: '',
          reasoningEfforts: [],
          parallelToolCalls: false,
          tools: false,
          vision: false,
          visionTooltipText: '',
          tokenizer: '-',
          streaming: false,
          structuredOutputs: false,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: formattedLongContextText,
        });
      }

      if (m.billing?.promo) {
        const p = m.billing.promo;
        subRows.push({
          ...m,
          subRows: undefined,
          id: `${m.id}-billing-promo`,
          name: `Promo Offer`,
          provider: m.provider,
          rowType: 'detail',
          categoryText: '-',
          costRating: 0,
          adaptiveThinking: '',
          reasoningEfforts: [],
          parallelToolCalls: false,
          tools: false,
          vision: false,
          visionTooltipText: '',
          tokenizer: '-',
          streaming: false,
          structuredOutputs: false,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: `ID: ${p.id || 'Active'} | Discount: ${p.discount_percent !== undefined ? p.discount_percent + '%' : '-'} | ${p.message || ''} | Ends At: ${p.ends_at || 'N/A'}`,
        });
      }

      return {
        ...m,
        rowType: 'model',
        categoryText,
        costRating,
        adaptiveThinking,
        reasoningEfforts,
        parallelToolCalls,
        tools,
        vision,
        visionTooltipText,
        tokenizer,
        streaming,
        structuredOutputs,
        maxPromptTokens,
        maxOutputTokens,
        promoTooltipText,
        hasPromo,
        detailsText: m.description || `Model ${m.name} (${m.provider})`,
        subRows: subRows.length > 0 ? subRows : undefined,
      };
    });

    const filterTerm = globalFilter.trim().toLowerCase();
    const filteredRows = filterTerm
      ? rawRows.filter(
          (r) =>
            r.name.toLowerCase().includes(filterTerm) ||
            r.provider.toLowerCase().includes(filterTerm) ||
            r.categoryText.toLowerCase().includes(filterTerm) ||
            r.tokenizer.toLowerCase().includes(filterTerm)
        )
      : rawRows;

    if (sortRules.length === 0) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      for (const rule of sortRules) {
        let valA: string | number = '';
        let valB: string | number = '';

        switch (rule.field) {
          case 'enabled':
            valA = a.policy?.state && a.policy.state.toLowerCase() === 'enabled' ? 1 : 0;
            valB = b.policy?.state && b.policy.state.toLowerCase() === 'enabled' ? 1 : 0;
            break;
          case 'provider':
            valA = (a.provider || '').toLowerCase();
            valB = (b.provider || '').toLowerCase();
            break;
          case 'name':
            valA = (a.name || '').toLowerCase();
            valB = (b.name || '').toLowerCase();
            break;
          case 'cost':
            valA = a.costRating ?? 0;
            valB = b.costRating ?? 0;
            break;
          case 'category':
            valA = (a.categoryText || '').toLowerCase();
            valB = (b.categoryText || '').toLowerCase();
            break;
          case 'contextWindow':
            valA = a.context_window ?? 0;
            valB = b.context_window ?? 0;
            break;
          case 'maxPrompt':
            valA = a.maxPromptTokens ?? 0;
            valB = b.maxPromptTokens ?? 0;
            break;
          case 'maxOutput':
            valA = a.maxOutputTokens ?? 0;
            valB = b.maxOutputTokens ?? 0;
            break;
          case 'adaptiveThinking':
            valA = (a.adaptiveThinking || '').toLowerCase();
            valB = (b.adaptiveThinking || '').toLowerCase();
            break;
          case 'reasoningEffort':
            valA = a.reasoningEfforts.length;
            valB = b.reasoningEfforts.length;
            break;
          case 'tools':
            valA = a.parallelToolCalls ? 2 : a.tools ? 1 : 0;
            valB = b.parallelToolCalls ? 2 : b.tools ? 1 : 0;
            break;
          case 'vision':
            valA = a.vision ? 1 : 0;
            valB = b.vision ? 1 : 0;
            break;
          case 'tokenizer':
            valA = (a.tokenizer || '').toLowerCase();
            valB = (b.tokenizer || '').toLowerCase();
            break;
          case 'streaming':
            valA = a.streaming ? 1 : 0;
            valB = b.streaming ? 1 : 0;
            break;
          case 'structuredOutputs':
            valA = a.structuredOutputs ? 1 : 0;
            valB = b.structuredOutputs ? 1 : 0;
            break;
        }

        if (valA < valB) return rule.order === 'asc' ? -1 : 1;
        if (valA > valB) return rule.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [models, globalFilter, sortRules]);

  return {
    selectedProvider,
    setSelectedProvider,
    tableData,
    loading,
    sortRules,
    handleSort,
    clearSort,
    expandedRowIds,
    toggleRowExpanded,
    globalFilter,
    setGlobalFilter,
    refetch: fetchModels,
  };
}

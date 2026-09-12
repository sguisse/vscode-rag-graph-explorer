import { useState, useEffect, useMemo } from 'react';
import { LlmModelInfo, LlmProvider } from '@/shared/services/llm-chat';
import { llmChatApiService } from '@/services/api/llm-chat-api.service.gen';

export type SortField =
  | 'provider'
  | 'name'
  | 'cost'
  | 'category'
  | 'context_window'
  | 'maxPrompt'
  | 'maxOutput'
  | 'adaptiveThinking'
  | 'reasoningEffort'
  | 'tools'
  | 'vision'
  | 'tokenizer'
  | 'streaming'
  | 'structuredOutputs'
  | 'tokenPricing';

export type SortOrder = 'asc' | 'desc';

export interface SortRule {
  field: SortField;
  order: SortOrder;
}

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
  tokenPricingText: string;
  promoTooltipText: string;
  hasPromo: boolean;
  subRows?: ModelTableRow[];
}

export function computeCostRating(m: LlmModelInfo): number {
  if (m.billing?.token_prices) {
    const input_price = m.billing.token_prices.input_price ?? 0;
    if (input_price === 0) return 1;
    if (input_price <= 100) return 2;
    if (input_price <= 250) return 3;
    if (input_price <= 450) return 4;
    return 5;
  }

  if (m.model_picker_price_category === 'low') return 1;
  if (m.model_picker_price_category === 'medium') return 3;
  if (m.model_picker_price_category === 'high') return 5;

  return 2;
}

export function formatTokenPricing(m: LlmModelInfo): string {
  const tp = m.billing?.token_prices;
  if (!tp) return '-';

  const parts = [
    `Input: $${tp.input_price ?? 0}/1M`,
    `Output: $${tp.output_price ?? 0}/1M`,
    `Cache Read: $${tp.cache_read_price ?? 0}/1M`,
    `Cache Write: $${tp.cache_write_price ?? 0}/1M`,
  ];

  return parts.join(' | ');
}

export function formatPromoTooltip(m: LlmModelInfo): string {
  const p = m.billing?.promo;
  const tp = m.billing?.token_prices;
  const lines: string[] = [];

  if (p) {
    if (p.id) lines.push(`<b>Promo ID:</b> ${p.id}`);
    if (p.discount_percent !== undefined) lines.push(`<b>Discount:</b> ${p.discount_percent}%`);
    if (p.message) lines.push(`<b>Message:</b> ${p.message}`);
    if (p.ends_at) lines.push(`<b>Ends At:</b> ${p.ends_at}`);
  }

  if (tp?.long_context) {
    const lc = tp.long_context;
    lines.push(`<b>Long Context Max:</b> ${(lc.context_max ? lc.context_max / 1000 : 0)}k`);
    lines.push(`<b>Long Context Input:</b> $${lc.input_price ?? 0}/1M`);
    lines.push(`<b>Long Context Output:</b> $${lc.output_price ?? 0}/1M`);
  }

  return lines.join('<br/>');
}

export function formatVisionTooltip(m: LlmModelInfo): string {
  const v = m.capabilities?.limits?.vision;
  if (!v) return '';
  const lines: string[] = [];
  if (v.max_prompt_image_size) {
    lines.push(`<b>Max Prompt Image Size:</b> ${(v.max_prompt_image_size / (1024 * 1024)).toFixed(1)} MB`);
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
  const [sortRules, setSortRules] = useState<SortRule[]>([
    { field: 'provider', order: 'asc' },
    { field: 'name', order: 'asc' },
  ]);
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [globalFilter, setGlobalFilter] = useState<string>('');

  // Keep state synchronized with initialProvider when modal opens
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
    setSortRules([{ field: 'name', order: 'asc' }]);
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
      const tokenPricingText = formatTokenPricing(m);
      const promoTooltipText = formatPromoTooltip(m);
      const visionTooltipText = formatVisionTooltip(m);
      const hasPromo = Boolean(m.billing?.promo);

      const adaptiveThinking = sup?.adaptive_thinking || '';
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
          tokenPricingText: `Family: ${m.capabilities.family} | Type: ${m.capabilities.type || 'chat'} | Tokenizer: ${m.capabilities.tokenizer || 'N/A'} | Object: ${m.capabilities.object || '-'}`,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: `Family: ${m.capabilities.family}`,
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
          tokenPricingText: `State: ${m.policy.state || 'enabled'} | Terms: ${m.policy.terms || 'Enabled for workspace'}`,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: m.policy.terms || '',
        });
      }

      if (m.billing?.token_prices) {
        const tp = m.billing.token_prices;
        subRows.push({
          ...m,
          subRows: undefined,
          id: `${m.id}-billing-std`,
          name: `Standard Billing`,
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
          tokenPricingText: `Input: $${tp.input_price ?? 0}/1M | Output: $${tp.output_price ?? 0}/1M | Cache Read: $${tp.cache_read_price ?? 0}/1M | Cache Write: $${tp.cache_write_price ?? 0}/1M`,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: 'Standard token prices',
        });

        if (tp.long_context) {
          const lc = tp.long_context;
          subRows.push({
            ...m,
            subRows: undefined,
            id: `${m.id}-billing-long`,
            name: `Long Context`,
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
            tokenPricingText: `Context Max: ${(lc.context_max ? lc.context_max / 1000 : 0)}k | Input: $${lc.input_price ?? 0}/1M | Output: $${lc.output_price ?? 0}/1M | Cache Write: $${lc.cache_write_price ?? 0}/1M`,
            promoTooltipText: '',
            hasPromo: false,
            detailsText: 'Long context token prices',
          });
        }
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
          tokenPricingText: `ID: ${p.id || 'Active'} | Discount: ${p.discount_percent}% | ${p.message || ''} | Ends At: ${p.ends_at || 'N/A'}`,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: 'Promo details',
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
        tokenPricingText,
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
            r.tokenizer.toLowerCase().includes(filterTerm) ||
            r.tokenPricingText.toLowerCase().includes(filterTerm)
        )
      : rawRows;

    if (sortRules.length === 0) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      for (const rule of sortRules) {
        let valA: string | number = '';
        let valB: string | number = '';

        switch (rule.field) {
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
          case 'context_window':
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
          case 'tokenPricing':
            valA = (a.tokenPricingText || '').toLowerCase();
            valB = (b.tokenPricingText || '').toLowerCase();
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

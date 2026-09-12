#!/usr/bin/env bash
set -e

echo "Fixing JSX syntax error in LLM models info component and updating files..."

mkdir -p shared/services/llm-chat/model/value-objects[cite: 8]
mkdir -p webview/src/features/sdlc/domains/llm-chat/hooks[cite: 8]
mkdir -p webview/src/features/sdlc/domains/llm-chat/components/llm-chat[cite: 8]
mkdir -p backend/src/services/llm-chat/delegate/copilot[cite: 8]

if [ -d "src/features/explorer-old/sdb-rgt-prompt/hooks" ]; then
  mkdir -p src/features/explorer-old/sdb-rgt-prompt/hooks
fi

cat << 'EOF' > shared/services/llm-chat/model/value-objects/llm-model.vo.ts
import { LlmProvider } from '../../types/llm-provider.enum';

export interface LlmModelVisionLimits {
  max_prompt_image_size?: number;
  max_prompt_images?: number;
  supported_media_types?: string[];
}

export interface LlmModelLimits {
  max_context_window_tokens?: number;
  max_non_streaming_output_tokens?: number;
  max_output_tokens?: number;
  max_prompt_tokens?: number;
  vision?: LlmModelVisionLimits;
}

export interface LlmModelSupports {
  adaptive_thinking?: boolean | string;
  max_thinking_budget?: number;
  min_thinking_budget?: number;
  parallel_tool_calls?: boolean;
  reasoning_effort?: string[];
  streaming?: boolean;
  structured_outputs?: boolean;
  tool_calls?: boolean;
  vision?: boolean;
  reasoningEffort?: boolean;
}

export interface LlmModelCapabilities {
  family?: string;
  limits?: LlmModelLimits;
  object?: string;
  supports?: LlmModelSupports;
  tokenizer?: string;
  type?: string;
}

export interface LlmModelPolicy {
  state?: string;
  terms?: string;
}

export interface ILlmTokenPriceConfig {
  input_price?: number;
  output_price?: number;
  cache_price?: number;
  cache_read_price?: number;
  cache_write_price?: number;
  cache_write_1h_price?: number;
  context_max?: number;
  max_prompt_tokens?: number;
}

export interface ILlmLongContextTokenPriceConfig extends ILlmTokenPriceConfig {}

export interface ILlmTokenPrices extends ILlmTokenPriceConfig {
  batch_size?: number;
  long_context?: ILlmLongContextTokenPriceConfig;
}

export interface LlmModelPromo {
  id?: string;
  discount_percent?: number;
  ends_at?: string;
  message?: string;
}

export interface LlmModelBilling {
  discount_percent?: number;
  token_prices?: ILlmTokenPrices;
  promo?: LlmModelPromo;
}

export interface LlmModelInfo {
  id: string;
  name: string;
  provider: LlmProvider;
  object?: string;
  vendor?: string;
  version?: string;
  preview?: boolean;
  model_picker_category?: string;
  model_picker_enabled?: boolean;
  supported_endpoints?: string[];
  context_window?: number;
  description?: string;
  capabilities?: LlmModelCapabilities;
  policy?: LlmModelPolicy;
  billing?: LlmModelBilling;
  supported_reasoning_efforts?: string[];
  model_picker_price_category?: string;
  subRows?: LlmModelInfo[];
}
EOF

cat << 'EOF' > webview/src/features/sdlc/domains/llm-chat/hooks/use-llm-models-info.ts
import { useState, useEffect, useMemo } from 'react';
import { LlmModelInfo, ILlmTokenPrices, ILlmTokenPriceConfig, LlmProvider } from '@/shared/services/llm-chat';
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
  tokenPricingText: string;
  promoTooltipText: string;
  hasPromo: boolean;
  subRows?: ModelTableRow[];
}

export function getTokenPrices(m: LlmModelInfo, longContext: boolean): ILlmTokenPrices | undefined {
  if (longContext && m.billing?.token_prices?.long_context) {
    return m.billing.token_prices.long_context;
  }
  if (!longContext && m.billing?.token_prices) {
    return m.billing.token_prices;
  }

  return undefined;
}

export function formatBillingRates(rates?: ILlmTokenPriceConfig, includeBatchSize = false, batchSize?: number): string {
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

export function formatTokenPricing(m: LlmModelInfo): string {
  const tp = getTokenPrices(m, false);
  return formatBillingRates(tp, true, tp?.batch_size);
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
      const tokenPricingText = formatTokenPricing(m);
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
          tokenPricingText: `ID: ${m.id} | Family: ${m.capabilities.family} | Type: ${m.capabilities.type || 'chat'}`,
          promoTooltipText: '',
          hasPromo: false,
          detailsText: `ID: ${m.id} | Family: ${m.capabilities.family} | Type: ${m.capabilities.type || 'chat'}`,
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
        tokenPricingText: formattedTokenPricesText,
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
          tokenPricingText: formattedLongContextText,
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
          tokenPricingText: `ID: ${p.id || 'Active'} | Discount: ${p.discount_percent !== undefined ? p.discount_percent + '%' : '-'} | ${p.message || ''} | Ends At: ${p.ends_at || 'N/A'}`,
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
EOF

if [ -d "src/features/explorer-old/sdb-rgt-prompt/hooks" ]; then
  cp webview/src/features/sdlc/domains/llm-chat/hooks/use-llm-models-info.ts src/features/explorer-old/sdb-rgt-prompt/hooks/use-llm-models-info.ts
fi

cat << 'EOF' > webview/src/features/sdlc/domains/llm-chat/components/llm-chat/llm-models-info.tsx
import React, { useState } from 'react';
import { LlmProvider } from '@/shared/services/llm-chat';
import {
  useLlmModelsInfo,
  ModelTableRow,
  SortField,
  SortRule,
  INITIAL_SORT_RULES,
} from '@/features/sdlc/domains/llm-chat/hooks/use-llm-models-info';
import { useExplorerStore } from '@/features/sdlc/domains/llm-chat/store/useLlmDomainState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Rating } from '@/components/reui/rating';
import { ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Layers, X, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface LLMModelsInfoProps {
  initialProvider?: LlmProvider | 'all';
  onSelectModel?: (provider: LlmProvider, modelId: string) => void;
}

export interface ModelTableColumnDef {
  key: string;
  field: SortField;
  label: React.ReactNode;
  defaultWidth: number;
}

export { INITIAL_SORT_RULES };

export const MODEL_TABLE_COLUMNS: ModelTableColumnDef[] = [
  { key: 'enabled', field: 'enabled', label: '☐', defaultWidth: 55 },
  { key: 'provider', field: 'provider', label: 'Prov.', defaultWidth: 95 },
  { key: 'name', field: 'name', label: 'Model', defaultWidth: 210 },
  { key: 'cost', field: 'cost', label: 'Cost', defaultWidth: 100 },
  { key: 'category', field: 'category', label: 'Category', defaultWidth: 120 },
  {
    key: 'contextWindow',
    field: 'contextWindow',
    label: (
      <>
        <span className="block">Max</span>
        <span>Context</span>
      </>
    ),
    defaultWidth: 95,
  },
  {
    key: 'maxPrompt',
    field: 'maxPrompt',
    label: (
      <>
        <span className="block">Max</span>
        <span>Prompt</span>
      </>
    ),
    defaultWidth: 95,
  },
  {
    key: 'maxOutput',
    field: 'maxOutput',
    label: (
      <>
        <span className="block">Max</span>
        <span>Output</span>
      </>
    ),
    defaultWidth: 95,
  },
  {
    key: 'adaptiveThinking',
    field: 'adaptiveThinking',
    label: (
      <>
        <span className="block">Adaptive</span>
        <span>Thinking</span>
      </>
    ),
    defaultWidth: 80,
  },
  {
    key: 'reasoningEffort',
    field: 'reasoningEffort',
    label: (
      <>
        <span className="block">Reasoning</span>
        <span>Effort</span>
      </>
    ),
    defaultWidth: 160,
  },
  { key: 'tools', field: 'tools', label: 'Tools', defaultWidth: 65 },
  { key: 'vision', field: 'vision', label: 'Vision', defaultWidth: 65 },
  { key: 'tokenizer', field: 'tokenizer', label: 'Tokenizer', defaultWidth: 105 },
  { key: 'streaming', field: 'streaming', label: 'Streaming', defaultWidth: 75 },
  {
    key: 'structuredOutputs',
    field: 'structuredOutputs',
    label: (
      <>
        <span className="block">Structured</span>
        <span>Outputs</span>
      </>
    ),
    defaultWidth: 85,
  },
];

export const LLMModelsInfo: React.FC<LLMModelsInfoProps> = ({
  initialProvider = 'all',
  onSelectModel,
}) => {
  const {
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
    refetch,
  } = useLlmModelsInfo(initialProvider);

  const setLlmProvider = useExplorerStore((s) => s.setLlmProvider);
  const setLlmSelectedModel = useExplorerStore((s) => s.setLlmSelectedModel);
  const currentSelectedModel = useExplorerStore((s) => s.llmSelectedModel);

  const [colWidths, setColWidths] = useState<Record<string, number>>(() =>
    MODEL_TABLE_COLUMNS.reduce<Record<string, number>>((acc, col) => {
      acc[col.key] = col.defaultWidth;
      return acc;
    }, {})
  );

  const handleColumnResize = (colKey: string, startX: number, startWidth: number) => {
    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      setColWidths((prev) => ({
        ...prev,
        [colKey]: Math.max(50, startWidth + delta),
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleModelSelect = (row: ModelTableRow) => {
    if (row.rowType !== 'model') return;

    setLlmProvider(row.provider);
    setLlmSelectedModel(row.id);

    if (onSelectModel) {
      onSelectModel(row.provider, row.id);
    }
  };

  const renderSortButton = (label: React.ReactNode, field: SortField) => {
    const ruleIndex = sortRules.findIndex((r) => r.field === field);
    const sortRule = ruleIndex !== -1 ? sortRules[ruleIndex] : null;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSort(field, e.shiftKey);
        }}
        data-tooltip="Click to sort, Hold Shift + Click to multi-sort"
        className="flex items-center gap-1 p-0 py-0.5 h-auto font-bold text-xs truncate cursor-pointer select-none"
      >
        <span className="text-left leading-tight">{label}</span>
        {sortRule ? (
          <span className="inline-flex items-center self-center gap-0.5 font-bold text-primary shrink-0">
            {sortRule.order === 'asc' ? (
              <ArrowUp className="stroke-[2.5] w-3 h-3" />
            ) : (
              <ArrowDown className="stroke-[2.5] w-3 h-3" />
            )}
            <span className="bg-primary/20 px-1 py-0.5 border border-primary/30 rounded-full font-mono text-[9px] text-primary leading-none">
              {ruleIndex + 1}
            </span>
          </span>
        ) : (
          <ArrowUpDown className="self-center w-3 h-3 text-muted-foreground/40 shrink-0" />
        )}
      </Button>
    );
  };

  const getStickyHeaderClassAndStyle = (colKey: string) => {
    if (colKey === 'enabled') {
      return {
        className: 'sticky left-0 bg-muted/90 z-20',
        style: {
          width: `${colWidths.enabled}px`,
          minWidth: `${colWidths.enabled}px`,
        },
      };
    }
    if (colKey === 'provider') {
      return {
        className: 'sticky bg-muted/90 z-20',
        style: {
          width: `${colWidths.provider}px`,
          minWidth: `${colWidths.provider}px`,
          left: `${colWidths.enabled}px`,
        },
      };
    }
    if (colKey === 'name') {
      return {
        className: 'sticky bg-muted/90 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]',
        style: {
          width: `${colWidths.name}px`,
          minWidth: `${colWidths.name}px`,
          left: `${colWidths.enabled + colWidths.provider}px`,
        },
      };
    }
    return {
      className: '',
      style: {
        width: `${colWidths[colKey]}px`,
        minWidth: `${colWidths[colKey]}px`,
      },
    };
  };

  const renderHeaderCell = (label: React.ReactNode, field: SortField, colKey: string) => {
    const { className, style } = getStickyHeaderClassAndStyle(colKey);

    return (
      <th
        key={colKey}
        style={style}
        className={`relative p-2 font-bold text-muted-foreground select-none align-middle ${className}`}
      >
        <div className="flex justify-between items-center h-full">
          {renderSortButton(label, field)}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              handleColumnResize(colKey, e.clientX, colWidths[colKey]);
            }}
            className="top-0 right-0 bottom-0 absolute hover:bg-primary/50 w-1.5 transition-colors cursor-col-resize"
          />
        </div>
      </th>
    );
  };

  const formatTokens = (val?: number) => (val ? `${(val / 1000).toFixed(0)}k` : '-');

  const renderTableRow = (row: ModelTableRow, depth = 0) => {
    const isCustomFamily = row.capabilities?.family === 'custom' || row.model_picker_category === 'custom';
    const isExpanded = Boolean(expandedRowIds[row.id]);
    const hasSubRows = Boolean(row.subRows && row.subRows.length > 0);
    const isSelectedModel = row.rowType === 'model' && row.id === currentSelectedModel;
    const isNotEnabled = Boolean(row.policy?.state && row.policy.state.toLowerCase() !== 'enabled');
    const isEnabled = !isNotEnabled;

    if (row.rowType === 'detail') {
      return (
        <React.Fragment key={row.id}>
          <tr className="bg-muted/15 hover:bg-muted/30 transition-colors">
            <td
              style={{ width: `${colWidths.enabled}px`, minWidth: `${colWidths.enabled}px` }}
              className="left-0 z-10 sticky bg-background/95 backdrop-blur p-2 font-mono text-xs text-center align-middle"
            >
              <span className="text-[10px] text-muted-foreground">-</span>
            </td>

            <td
              style={{
                width: `${colWidths.provider}px`,
                minWidth: `${colWidths.provider}px`,
                left: `${colWidths.enabled}px`,
              }}
              className="z-10 sticky bg-background/95 backdrop-blur p-2 font-mono text-xs align-middle"
            >
              <span className="text-[10px] text-muted-foreground">-</span>
            </td>

            <td
              style={{
                width: `${colWidths.name}px`,
                minWidth: `${colWidths.name}px`,
                left: `${colWidths.enabled + colWidths.provider}px`,
              }}
              className="z-10 sticky bg-background/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] backdrop-blur p-2 font-mono text-xs align-middle"
            >
              <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 14}px` }}>
                <span className="w-3.5 shrink-0" />
                <span className="block font-bold text-[10px] text-primary/80 truncate uppercase tracking-wide">
                  {row.name}
                </span>
              </div>
            </td>

            <td colSpan={MODEL_TABLE_COLUMNS.length - 3} className="p-2 font-mono text-[11px] text-foreground align-middle">
              <span className="block font-mono text-[11px] text-muted-foreground truncate">
                {row.tokenPricingText || row.detailsText}
              </span>
            </td>
          </tr>
        </React.Fragment>
      );
    }

    let rowTextStyle = 'text-foreground';
    if (isNotEnabled) {
      rowTextStyle = 'text-muted-foreground';
    } else if (row.hasPromo) {
      rowTextStyle = 'font-bold text-emerald-600 dark:text-emerald-400';
    } else if (isCustomFamily) {
      rowTextStyle = 'font-bold text-blue-600 dark:text-blue-400';
    }

    const stickyCellBg = isNotEnabled
      ? 'bg-destructive/10 backdrop-blur'
      : isSelectedModel
      ? 'bg-primary/10 backdrop-blur'
      : 'bg-background/95 backdrop-blur';

    const isAdaptiveYes = row.adaptiveThinking && row.adaptiveThinking !== 'unsupported';

    return (
      <React.Fragment key={row.id}>
        <tr
          onClick={() => handleModelSelect(row)}
          className={`transition-colors cursor-pointer ${
            isNotEnabled
              ? 'bg-destructive/10 hover:bg-destructive/20'
              : isSelectedModel
              ? 'bg-primary/15 hover:bg-primary/20 ring-1 ring-inset ring-primary/40'
              : 'bg-card/50 hover:bg-muted/40'
          }`}
          data-tooltip={isNotEnabled ? `Disabled by Policy (${row.policy?.state || 'disabled'})` : 'Click to select this model for LLM Chat'}
        >
          <td
            style={{ width: `${colWidths.enabled}px`, minWidth: `${colWidths.enabled}px` }}
            className={`left-0 z-10 sticky ${stickyCellBg} p-2 font-mono text-xs text-center align-middle`}
          >
            <Checkbox checked={isEnabled} disabled className="pointer-events-none" />
          </td>

          <td
            style={{
              width: `${colWidths.provider}px`,
              minWidth: `${colWidths.provider}px`,
              left: `${colWidths.enabled}px`,
            }}
            className={`z-10 sticky ${stickyCellBg} p-2 font-mono text-xs align-middle`}
          >
            <span className={`px-1.5 py-0.5 border rounded font-mono text-[10px] uppercase ${isNotEnabled ? 'border-destructive/30 bg-destructive/15 text-muted-foreground font-semibold' : 'bg-muted border-border ' + rowTextStyle}`}>
              {row.provider || 'N/A'}
            </span>
          </td>

          <td
            style={{
              width: `${colWidths.name}px`,
              minWidth: `${colWidths.name}px`,
              left: `${colWidths.enabled + colWidths.provider}px`,
            }}
            className={`z-10 sticky ${stickyCellBg} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] p-2 font-mono text-xs align-middle`}
          >
            <div className="flex items-center gap-1.5" style={{ paddingLeft: `${depth * 14}px` }}>
              {hasSubRows ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpanded(row.id);
                  }}
                  className="hover:bg-muted p-0.5 rounded cursor-pointer shrink-0"
                  data-tooltip="Toggle Extra Specs"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              ) : (
                depth > 0 && <span className="w-3.5 shrink-0" />
              )}
              {isSelectedModel && (
                <span className="bg-primary p-0.5 rounded-full text-primary-foreground shrink-0" data-tooltip="Selected Model">
                  <Check size={10} className="stroke-[3]" />
                </span>
              )}
              <span
                className={`font-medium truncate block ${rowTextStyle}`}
                data-tooltip={row.id}
              >
                {row.name}
              </span>
            </div>
          </td>

          <td
            style={{ width: `${colWidths.cost}px` }}
            className="group relative p-2 font-mono text-xs align-middle"
            data-tooltip={row.promoTooltipText || undefined}
          >
            <div className="flex items-center cursor-help">
              <Rating rating={row.costRating} maxRating={5} size="sm" />
            </div>
          </td>

          <td style={{ width: `${colWidths.category}px` }} className="p-2 font-mono text-xs align-middle">
            {row.categoryText !== '-' ? (
              <span className={`inline-flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 border border-primary/20 rounded font-mono text-[10px] ${rowTextStyle}`}>
                {row.categoryText}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">-</span>
            )}
          </td>

          <td style={{ width: `${colWidths.contextWindow}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-xs ${rowTextStyle}`}>{formatTokens(row.context_window)}</span>
          </td>

          <td style={{ width: `${colWidths.maxPrompt}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-xs ${rowTextStyle}`}>{formatTokens(row.maxPromptTokens)}</span>
          </td>

          <td style={{ width: `${colWidths.maxOutput}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-xs ${rowTextStyle}`}>{formatTokens(row.maxOutputTokens)}</span>
          </td>

          <td style={{ width: `${colWidths.adaptiveThinking}px` }} className="p-2 font-mono text-xs text-center align-middle">
            {isAdaptiveYes ? (
              <span data-tooltip={`adaptive_thinking: ${row.adaptiveThinking}`} className="text-sm cursor-help">
                {row.adaptiveThinking === 'required' ? '🤔❗' : '🤔'}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">-</span>
            )}
          </td>

          <td style={{ width: `${colWidths.reasoningEffort}px` }} className="p-2 font-mono text-xs align-middle">
            {row.reasoningEfforts.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1">
                {row.reasoningEfforts.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center bg-muted px-1.5 py-0.2 border border-border rounded font-mono text-[9px] text-foreground uppercase"
                  >
                    {e}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">-</span>
            )}
          </td>

          <td style={{ width: `${colWidths.tools}px` }} className="p-2 font-mono text-xs text-center align-middle">
            {row.parallelToolCalls ? (
              <span
                data-tooltip="Parallel Tool Calls Supported"
                className="inline-flex items-center bg-primary/10 px-1.5 py-0.5 border border-primary/20 rounded font-mono font-bold text-[10px] text-primary"
              >
                //
              </span>
            ) : (
              <Checkbox checked={row.tools} disabled className="pointer-events-none" />
            )}
          </td>

          <td
            style={{ width: `${colWidths.vision}px` }}
            className="group relative p-2 font-mono text-xs text-center align-middle"
            data-tooltip={row.visionTooltipText || undefined}
          >
            <Checkbox checked={row.vision} disabled className="pointer-events-none" />
          </td>

          <td style={{ width: `${colWidths.tokenizer}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-[11px] ${rowTextStyle}`}>{row.tokenizer}</span>
          </td>

          <td style={{ width: `${colWidths.streaming}px` }} className="p-2 font-mono text-xs text-center align-middle">
            <Checkbox checked={row.streaming} disabled className="pointer-events-none" />
          </td>

          <td style={{ width: `${colWidths.structuredOutputs}px` }} className="p-2 font-mono text-xs text-center align-middle">
            <Checkbox checked={row.structuredOutputs} disabled className="pointer-events-none" />
          </td>
        </tr>

        {hasSubRows &&
          isExpanded &&
          row.subRows!.map((subRow) => renderTableRow(subRow, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 bg-card p-2.5 border border-border rounded-lg w-full h-full min-h-0 overflow-hidden font-sans text-foreground">
      <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-border border-b shrink-0">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="font-bold text-xs uppercase">LLM Models Registry</span>
          <span className="bg-muted px-2 py-0.5 rounded font-mono text-[11px] text-muted-foreground">
            {tableData.length} models
          </span>

          {sortRules.length > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-border border-l">
              <span className="text-[10px] text-muted-foreground">Sorted by:</span>
              {sortRules.map((r, i) => (
                <span
                  key={r.field}
                  className="inline-flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 border border-primary/20 rounded font-mono text-[10px] text-primary"
                >
                  {i + 1}. {r.field} {r.order === 'asc' ? '↑' : '↓'}
                </span>
              ))}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSort}
                data-tooltip="Reset Sort Order"
                className="p-0 w-4 h-4 text-muted-foreground hover:text-foreground"
              >
                <X size={10} />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedProvider}
            onValueChange={(val) => setSelectedProvider(val || 'all')}
          >
            <SelectTrigger className="w-32 h-7 font-mono text-xs">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent className="z-[10000]">
              <SelectItem value="all">🌐 All Providers</SelectItem>
              <SelectItem value={LlmProvider.COPILOT}>✈️ Copilot</SelectItem>
              <SelectItem value={LlmProvider.OLLAMA}>🦙 Ollama</SelectItem>
              <SelectItem value={LlmProvider.GEMINI}>♊ Gemini</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="Search models or specs..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-40 h-7 font-mono text-xs"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            disabled={loading}
            className="w-7 h-7"
            data-tooltip="Refresh Models List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-background border border-border rounded min-h-0 overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="top-0 z-20 sticky bg-muted/90 backdrop-blur border-border border-b font-mono text-[11px] uppercase">
            <tr>
              {MODEL_TABLE_COLUMNS.map((col) =>
                renderHeaderCell(col.label, col.field, col.key)
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={MODEL_TABLE_COLUMNS.length} className="p-8 text-muted-foreground text-xs text-center italic">
                  Loading LLM Models metadata...
                </td>
              </tr>
            ) : tableData.length === 0 ? (
              <tr>
                <td colSpan={MODEL_TABLE_COLUMNS.length} className="p-8 text-muted-foreground text-xs text-center italic">
                  No models matched your selection.
                </td>
              </tr>
            ) : (
              tableData.map((row) => renderTableRow(row, 0))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LLMModelsInfo;
EOF

cat << 'EOF' > backend/src/services/llm-chat/delegate/copilot/copilot.delegate.ts
import { CopilotClient, approveAll } from '@github/copilot-sdk';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { ILlmProviderDelegate } from '../llm-provider.delegate.interface';
import {
  LlmProvider,
  LlmModelInfo,
  LlmModelBilling,
  ILlmTokenPrices,
  LlmModelPromo,
  LlmConfigVO,
  ChatPromptVO,
  IChatResponseDto,
  IChatStreamChunkDto,
  ILlmHealthResultDto,
} from '../../../../../../shared/services/llm-chat';
import { getCurrentExtensionContext, getWorkspaceRoot } from '../../../../utils/utils-vscode';
import { vsCodeSettingsManager } from '../../../../managers/VsCodeSettings.manager';
import { log, logError, logInfo } from '../../../../utils/utils-log';

import { CopilotAccountInfo } from './copilot-account-info.model';

type ForceResolveMode = 'COPILOT_CLI' | 'DEVELOPMENT_NODE_MODULE' | 'PLUGIN_INSTALL_LOCATION' | null;

const FORCE_RESOLVE_NATIVE_CLI: ForceResolveMode = 'PLUGIN_INSTALL_LOCATION';

const LOG_FULL_MODELS_LIST_INFO = true;

export class CopilotDelegate implements ILlmProviderDelegate {
  readonly provider = LlmProvider.COPILOT;
  private static clientInstance: CopilotClient | null = null;
  private static isStarted = false;
  private static startPromise: Promise<void> | null = null;
  private static cliBinaryPath: string | null = null;

  public constructor() {
    logInfo(`[CopilotDelegate] Initializing CopilotDelegate...`);
    CopilotDelegate.cliBinaryPath = null;
    this.resolveNativeCliPath();
  }

  private resolveNativeCliPath(): string | undefined {
    log('CopilotDelegate', `resolveNativeCliPath start (Force Mode: ${FORCE_RESOLVE_NATIVE_CLI ?? 'None'})...`);

    if (CopilotDelegate.cliBinaryPath && FORCE_RESOLVE_NATIVE_CLI === null) {
      log('CopilotDelegate', `resolveNativeCliPath cached path found: ${CopilotDelegate.cliBinaryPath}`);
      return CopilotDelegate.cliBinaryPath;
    }

    const foundPath = FORCE_RESOLVE_NATIVE_CLI
      ? this.resolvePathByStrategy(FORCE_RESOLVE_NATIVE_CLI)
      : this.resolveWithStandardWorkflow();

    if (foundPath) {
      CopilotDelegate.cliBinaryPath = foundPath;
      process.env.COPILOT_CLI_PATH = foundPath;
      logInfo(`[CopilotDelegate] Resolved Copilot SDK binary path: ${foundPath}`);
      this.verifyCliBinary(foundPath);
    } else {
      logError(`[CopilotDelegate] Copilot SDK binary not found under current resolution settings.`);
    }

    return CopilotDelegate.cliBinaryPath || undefined;
  }

  private resolveWithStandardWorkflow(): string | undefined {
    log('CopilotDelegate', `resolveWithStandardWorkflow ...`);
    return (
      this.resolveSystemCliPath() ||
      this.resolveDevNodeModulesPath() ||
      this.resolvePluginInstallPath()
    );
  }

  private resolvePathByStrategy(mode: ForceResolveMode): string | undefined {
    log('CopilotDelegate', `resolvePathByStrategy with mode: ${mode} ...`);

    switch (mode) {
      case 'COPILOT_CLI':
        return this.resolveSystemCliPath();
      case 'DEVELOPMENT_NODE_MODULE':
        return this.resolveDevNodeModulesPath();
      case 'PLUGIN_INSTALL_LOCATION':
        return this.resolvePluginInstallPath();
      default:
        return undefined;
    }
  }

  private resolveSystemCliPath(): string | undefined {
    const isWin = process.platform === 'win32';
    const checkCommand = isWin ? 'where copilot' : 'which copilot';

    try {
      const systemPath = cp.execSync(checkCommand, { encoding: 'utf-8' }).trim().split('\n')[0];
      logInfo(`[CopilotDelegate] Checking system PATH for Copilot CLI: ${systemPath}`);
      if (systemPath && fs.existsSync(systemPath)) {
        logInfo(`[CopilotDelegate] System CLI found at: ${systemPath}`);
        return systemPath;
      }
    } catch {
      // CLI not found in system PATH
    }
    return undefined;
  }

  private resolveDevNodeModulesPath(): string | undefined {
    const extensionContext = getCurrentExtensionContext();
    if (!extensionContext) return undefined;

    const platformTarget = this.getPlatformTarget();
    const binNames = this.getPossibleBinNames();

    for (const binName of binNames) {
      const devPath = extensionContext.asAbsolutePath(
        path.join('node_modules', '@github', `copilot-sdk-${platformTarget}`, 'prebuilds', platformTarget, binName)
      );

      logInfo(`[CopilotDelegate] Checking dev node_modules path: ${devPath}`);

      if (fs.existsSync(devPath)) {
        return devPath;
      }
    }

    return undefined;
  }

  private resolvePluginInstallPath(): string | undefined {
    const workspaceRoot = getWorkspaceRoot();
    const backendWorkspacePath = vsCodeSettingsManager.getSettings().backendWorkspacePath || '.token-razor';
    const platformTarget = this.getPlatformTarget();
    const binNames = this.getPossibleBinNames();

    for (const binName of binNames) {
      const pluginPath = path.join(
        workspaceRoot,
        backendWorkspacePath,
        'target',
        'graph_rag_explorer',
        'tools',
        'node',
        'node_modules',
        '@github',
        `copilot-sdk-${platformTarget}`,
        'prebuilds',
        platformTarget,
        binName
      );

      logInfo(`[CopilotDelegate] Checking plugin install path: ${pluginPath}`);

      if (fs.existsSync(pluginPath)) {
        return pluginPath;
      }
    }

    return undefined;
  }

  private getPossibleBinNames(): string[] {
    return process.platform === 'win32'
      ? ['copilot.exe', 'copilot']
      : ['copilot-runtime', 'copilot'];
  }

  private getPlatformTarget(): string {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    return `${process.platform}-${arch}`;
  }

  private verifyCliBinary(binPath: string): void {
    if (!binPath.includes('copilot-sdk')) {
      try {
        const versionOutput = cp.execFileSync(binPath, ['-version'], { encoding: 'utf-8' }).trim();
        logInfo(`[CopilotDelegate] Copilot version output: ${versionOutput}`);
      } catch (err: any) {
        logError(`[CopilotDelegate] Failed to execute Copilot version check: ${err?.message || err}`);
      }
    } else {
      try {
        const result = cp.execFileSync(binPath, [], { encoding: 'utf-8' }).trim();
        logInfo(`[CopilotDelegate] Copilot SDK server output: ${result}`);
      } catch (err: any) {
        if (err?.message?.includes('SDK server mode requires --server or --headless')) {
          logInfo(`[CopilotDelegate] Normally failed to execute Copilot SDK version check: ${err?.message || err}`);
        } else {
          logError(`[CopilotDelegate] Unexpected error executing Copilot SDK binary: ${err?.message || err}`);
        }
      }
    }
  }

  private loadCustomModels(): Partial<LlmModelInfo>[] {
    const candidatePaths: string[] = [];

    const extensionContext = getCurrentExtensionContext();
    if (extensionContext) {
      candidatePaths.push(
        extensionContext.asAbsolutePath(
          path.join('backend', 'src', 'services', 'llm-chat', 'delegate', 'copilot-models-custom.json')
        ),
        extensionContext.asAbsolutePath('copilot-models-custom.json')
      );
    }

    try {
      const workspaceRoot = getWorkspaceRoot();
      if (workspaceRoot) {
        candidatePaths.push(path.join(workspaceRoot, '.token-razor', 'config', 'llm', 'copilot', 'copilot-models-custom.json'));
      }
    } catch {
      // Workspace root not available
    }

    candidatePaths.push(path.join(__dirname, 'copilot-models-custom.json'));

    for (const customJsonPath of candidatePaths) {
      try {
        if (fs.existsSync(customJsonPath)) {
          const fileContent = fs.readFileSync(customJsonPath, 'utf-8');
          const parsedModels: Partial<LlmModelInfo>[] = JSON.parse(fileContent);
          logInfo(`[CopilotDelegate] '${parsedModels.length}' Custom models JSON loaded from: ${customJsonPath}`);
          return parsedModels;
        }
      } catch (error: any) {
        logInfo(`[CopilotDelegate] Failed parsing custom models at ${customJsonPath}: ${error?.message || error}`);
      }
    }

    logInfo(`[CopilotDelegate] No custom models found or loaded.`);
    return [];
  }

  private getGithubCopilotToken(): string | undefined {
    const token =
      process.env.GITHUB_COPILOT_TOKEN_RAZOR ||
      process.env.COPILOT_GITHUB_TOKEN ||
      process.env.GITHUB_TOKEN ||
      process.env.GITHUB_COPILOT_TOKEN;
    return token;
  }

  private get client(): CopilotClient {
    if (!CopilotDelegate.clientInstance) {
      const cliPath = this.resolveNativeCliPath();

      if (cliPath) {
        process.env.COPILOT_CLI_PATH = cliPath;
      }

      const token = this.getGithubCopilotToken();
      if (token) {
        this.getGitHubUserAccountInfo(token)
          .then((accountInfo) => {
            logInfo(`[CopilotDelegate] Authenticated GitHub account: ${accountInfo.login} (${accountInfo.copilot_plan || 'Copilot'})`);
          })
          .catch((err) => {
            logError(`[CopilotDelegate] Could not retrieve account info: ${err?.message || err}`);
          });
      }

      const options: Record<string, any> = token
        ? { gitHubToken: token }
        : { useLoggedInUser: true };

      if (cliPath) {
        options.cliPath = cliPath;
      }

      logInfo(`[CopilotDelegate] Initializing CopilotClient with options: ${JSON.stringify(options)}`);
      CopilotDelegate.clientInstance = new CopilotClient(options as any);
    }
    return CopilotDelegate.clientInstance;
  }

  public async getGitHubUserAccountInfo(token: string): Promise<CopilotAccountInfo> {
    if (!token) {
      throw new Error('No GitHub Copilot token found. Please ensure you are logged in and have a valid token.');
    }

    const response = await fetch('https://api.github.com/copilot_internal/user', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'GithubCopilot/1.155.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub Copilot API Error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as CopilotAccountInfo;
    logInfo(`[CopilotDelegate] Authenticated user: ${data.login} (${data.copilot_plan || 'Copilot'})`);

    return data;
  }

  public async fetchModelsFromRestApi(token: string, baseUrl?: string): Promise<LlmModelInfo[]> {
    const targetHost = baseUrl || 'https://api.business.githubcopilot.com';
    const url = `${targetHost}/models`;
    logInfo(`[CopilotDelegate] Querying REST API for models: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Copilot-Integration-Id': 'vscode-chat',
        'User-Agent': 'GithubCopilot/1.155.0',
      },
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Copilot REST API error ${response.status}: ${errorMsg}`);
    }

    const body = (await response.json()) as { data?: any[] };
    const rawModels = body.data || [];

    logInfo(`[CopilotDelegate] Successfully retrieved ${rawModels.length} models via REST API.`, rawModels[0]);

    return this.mapRawModelsToModelInfo(rawModels, 'Model administered via GitHub Copilot REST API');
  }

  public async fetchModelsFromSdk(): Promise<LlmModelInfo[]> {
    await this.ensureStarted();
    const rawModels: any[] = await this.client.listModels();
    logInfo(`[CopilotDelegate] Total models found from SDK: ${rawModels.length}`, rawModels);

    return this.mapRawModelsToModelInfo(rawModels, 'Model administered via GitHub Copilot SDK');
  }

  private mapRawModelsToModelInfo(
    rawModels: any[],
    defaultDescription: string = 'Model administered via GitHub Copilot'
  ): LlmModelInfo[] {
    return rawModels.map((m: any) => {
      const isStateEnabled = m.policy?.state && String(m.policy.state).toLowerCase() === 'enabled';
      const policy = {
        ...(m.policy || {}),
        state: isStateEnabled ? 'enabled' : 'disabled',
      };

      const rawBilling = m.billing;
      let billing: LlmModelBilling | undefined = undefined;

      if (rawBilling) {
        const rawTp = rawBilling.token_prices || rawBilling.tokenPrices;
        let tokenPrices: ILlmTokenPrices | undefined = undefined;

        if (rawTp) {
          const rawDefault = rawTp.default || rawTp;
          const rawLc = rawTp.long_context || rawTp.longContext;

          tokenPrices = {
            input_price: rawDefault.input_price ?? rawDefault.inputPrice,
            output_price: rawDefault.output_price ?? rawDefault.outputPrice,
            cache_price: rawDefault.cache_price ?? rawDefault.cachePrice,
            cache_read_price: rawDefault.cache_read_price ?? rawDefault.cacheReadPrice,
            cache_write_price: rawDefault.cache_write_price ?? rawDefault.cacheWritePrice,
            cache_write_1h_price: rawDefault.cache_write_1h_price ?? rawDefault.cacheWrite1hPrice,
            context_max: rawDefault.context_max ?? rawDefault.contextMax,
            max_prompt_tokens: rawDefault.max_prompt_tokens ?? rawDefault.maxPromptTokens,
            batch_size: rawTp.batch_size ?? rawTp.batchSize,
            long_context: rawLc ? {
              input_price: rawLc.input_price ?? rawLc.inputPrice,
              output_price: rawLc.output_price ?? rawLc.outputPrice,
              cache_price: rawLc.cache_price ?? rawLc.cachePrice,
              cache_read_price: rawLc.cache_read_price ?? rawLc.cacheReadPrice,
              cache_write_price: rawLc.cache_write_price ?? rawLc.cacheWritePrice,
              cache_write_1h_price: rawLc.cache_write_1h_price ?? rawLc.cacheWrite1hPrice,
              context_max: rawLc.context_max ?? rawLc.contextMax,
              max_prompt_tokens: rawLc.max_prompt_tokens ?? rawLc.maxPromptTokens,
            } : undefined,
          };
        }

        const rawPromo = rawBilling.promo;
        const promo: LlmModelPromo | undefined = rawPromo ? {
          id: rawPromo.id,
          discount_percent: rawPromo.discount_percent ?? rawPromo.discountPercent,
          ends_at: rawPromo.ends_at ?? rawPromo.endsAt,
          message: rawPromo.message,
        } : undefined;

        billing = {
          discount_percent: rawBilling.discount_percent ?? rawBilling.discountPercent,
          token_prices: tokenPrices,
          promo,
        };
      }

      const model: LlmModelInfo = {
        id: m.id || m.name,
        name: m.name || m.id,
        provider: this.provider,
        object: m.object,
        vendor: m.vendor,
        version: m.version,
        preview: m.preview,
        model_picker_category: m.model_picker_category || m.modelPickerCategory,
        model_picker_enabled: m.model_picker_enabled ?? m.modelPickerEnabled,
        supported_endpoints: m.supported_endpoints,
        context_window: m.capabilities?.limits?.max_context_window_tokens ?? m.context_window ?? m.contextWindow ?? 128000,
        description: m.description || defaultDescription,
        capabilities: m.capabilities || { family: 'custom' },
        policy,
        billing,
        supported_reasoning_efforts: m.supported_reasoning_efforts || m.supportedReasoningEfforts || m.capabilities?.supports?.reasoning_effort,
        model_picker_price_category: m.model_picker_price_category || m.modelPickerPriceCategory,
      };

      if (LOG_FULL_MODELS_LIST_INFO) {
        logInfo(`[CopilotDelegate] Model result mapped: ${model.id} - ${model.name} | Details: ${JSON.stringify(model)}`);
      }
      return model;
    });
  }

  private async ensureStarted(): Promise<void> {
    if (CopilotDelegate.isStarted) {
      return;
    }

    if (!CopilotDelegate.startPromise) {
      CopilotDelegate.startPromise = (async () => {
        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout starting Copilot SDK (10s)')), 10000)
          );

          await Promise.race([this.client.start(), timeout]);
          CopilotDelegate.isStarted = true;
        } catch (error) {
          CopilotDelegate.startPromise = null;
          throw error;
        }
      })();
    }

    return CopilotDelegate.startPromise;
  }

  async listModels(config?: LlmConfigVO): Promise<LlmModelInfo[]> {
    let fetchedModels: LlmModelInfo[] = [];
    const token = this.getGithubCopilotToken();

    if (token) {
      try {
        let baseUrl: string | undefined;
        try {
          const accountInfo = await this.getGitHubUserAccountInfo(token);
          baseUrl = accountInfo.endpoints?.api;
        } catch (accountErr: any) {
          logError(`[CopilotDelegate] Failed to resolve account endpoint URL, using default: ${accountErr?.message || accountErr}`);
        }

        fetchedModels = [];
      } catch (restErr: any) {
        logError(`[CopilotDelegate] Direct REST API fetch failed, falling back to SDK: ${restErr?.message || restErr}`);
      }
    }

    if (fetchedModels.length === 0) {
      try {
        fetchedModels = await this.fetchModelsFromSdk();
      } catch (sdkErr: any) {
        logError(`[CopilotDelegate] Error fetching models from Copilot SDK: ${sdkErr?.message || sdkErr}`);
      }
    }

    const customModels = this.loadCustomModels();

    if (customModels.length > 0) {
      const existingModelIds = new Set(fetchedModels.map((m) => m.id.toLowerCase()));

      const newCustomModels = customModels.filter((fallback) => {
        if (!fallback.id || existingModelIds.has(fallback.id.toLowerCase())) {
          return false;
        }
        existingModelIds.add(fallback.id.toLowerCase());
        logInfo(`[CopilotDelegate] Custom model added: ${fallback.id}`);
        return true;
      });

      if (newCustomModels.length > 0) {
        const mappedCustomModels = this.mapRawModelsToModelInfo(
          newCustomModels,
          'Custom user-defined Copilot model'
        );
        fetchedModels.push(...mappedCustomModels);
      }
    } else {
      logInfo(`[CopilotDelegate] No custom models found or loaded.`);
    }

    fetchedModels.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );

    return fetchedModels;
  }

  async executeChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const model = config?.model || 'mai-code-1.1-flash';
    const lastUserMsg = prompt.getLastUserMessage()?.content || '';

    try {
      await this.ensureStarted();
      const session = await this.client.createSession({
        sessionId,
        model,
        onPermissionRequest: approveAll,
      });

      let content = '';

      const done = new Promise<void>((resolve, reject) => {
        session.on('assistant.message', (event: any) => {
          if (event?.data?.content) {
            content = event.data.content;
          }
        });

        session.on('session.idle', () => {
          resolve();
        });

        session.on('error' as any, (err: any) => {
          reject(err);
        });
      });

      await session.send({ prompt: lastUserMsg });
      await done;

      return {
        sessionId,
        messageId: `msg-${Date.now()}`,
        provider: this.provider,
        model,
        content,
        done: true,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        sessionId,
        messageId: `msg-err-${Date.now()}`,
        provider: this.provider,
        model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: error?.message || 'Error while receiving Copilot response',
      };
    }
  }

  async streamChat(
    sessionId: string,
    prompt: ChatPromptVO,
    config: LlmConfigVO,
    onChunk: (chunk: IChatStreamChunkDto) => void
  ): Promise<IChatResponseDto> {
    const startTime = Date.now();
    const model = config?.model || 'mai-code-1-flash-picker';
    const lastUserMsg = prompt.getLastUserMessage()?.content || '';

    try {
      await this.ensureStarted();
      const session = await this.client.createSession({
        sessionId,
        model,
        onPermissionRequest: approveAll,
      });

      let fullContent = '';

      const done = new Promise<void>((resolve, reject) => {
        session.on('assistant.message_delta', (event: any) => {
          const delta = event?.data?.deltaContent || '';
          fullContent += delta;
          onChunk({ sessionId, delta, done: false });
        });

        session.on('session.idle', () => {
          resolve();
        });

        session.on('error' as any, (err: any) => {
          reject(err);
        });
      });

      await session.send({ prompt: lastUserMsg });
      await done;

      onChunk({ sessionId, delta: '', done: true });

      return {
        sessionId,
        messageId: `msg-${Date.now()}`,
        provider: this.provider,
        model,
        content: fullContent,
        done: true,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      const errorDetails = error?.message || 'Error while streaming Copilot';
      onChunk({ sessionId, delta: '', done: true, error: errorDetails });

      return {
        sessionId,
        messageId: `msg-err-${Date.now()}`,
        provider: this.provider,
        model,
        content: '',
        done: true,
        executionTimeMs: Date.now() - startTime,
        error: errorDetails,
      };
    }
  }

  async healthCheck(baseUrl?: string): Promise<ILlmHealthResultDto> {
    try {
      await this.ensureStarted();
      const models = await this.listModels();
      return {
        status: 'ok',
        details: `Copilot service operational (${models.length} models detected)`,
      };
    } catch (error: any) {
      return {
        status: 'error',
        details: `Copilot HealthCheck error: ${error?.message}`,
      };
    }
  }
}
EOF

echo "✅ fix: Cleaned up JSX syntax error in llm-models-info.tsx and synchronized all files."
echo "To test compilation and build, run: tsc -p tsconfig.json && vite build"

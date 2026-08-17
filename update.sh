#!/usr/bin/env bash
set -e

# Ensure target directory exists
mkdir -p webview/src/features/explorer/sdb-rgt-prompt/llm-chat

# 1. Update LLMModelsInfo to handle row click, update store provider/model, and highlight active model
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/llm-chat/llm-models-info.tsx
import React, { useState } from 'react';
import { LlmProvider } from '@/shared/services/llm-chat';
import { useLlmModelsInfo, ModelTableRow, SortField } from '../hooks/use-llm-models-info';
import { useExplorerStore } from '../../store/useExplorerStore';
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

  // Resizable column widths state
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    provider: 95,
    name: 210,
    cost: 100,
    category: 120,
    contextWindow: 95,
    maxPrompt: 95,
    maxOutput: 95,
    adaptiveThinking: 80,
    reasoningEffort: 160,
    tools: 65,
    vision: 65,
    tokenizer: 105,
    streaming: 75,
    structuredOutputs: 85,
    tokenPricing: 420,
  });

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
    if (colKey === 'provider') {
      return {
        className: 'sticky left-0 bg-muted/90 z-20',
        style: {
          width: `${colWidths.provider}px`,
          minWidth: `${colWidths.provider}px`,
        },
      };
    }
    if (colKey === 'name') {
      return {
        className: 'sticky bg-muted/90 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]',
        style: {
          width: `${colWidths.name}px`,
          minWidth: `${colWidths.name}px`,
          left: `${colWidths.provider}px`,
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
    const isCustomFamily = row.capabilities?.family === 'custom';
    const isExpanded = Boolean(expandedRowIds[row.id]);
    const hasSubRows = Boolean(row.subRows && row.subRows.length > 0);
    const isSelectedModel = row.rowType === 'model' && row.id === currentSelectedModel;

    // Detail Sub-Row: Merge Columns across remaining 13 cells
    if (row.rowType === 'detail') {
      return (
        <React.Fragment key={row.id}>
          <tr className="bg-muted/15 hover:bg-muted/30 transition-colors">
            <td
              style={{ width: `${colWidths.provider}px`, minWidth: `${colWidths.provider}px` }}
              className="left-0 z-10 sticky bg-background/95 backdrop-blur p-2 font-mono text-xs align-middle"
            >
              <span className="text-[10px] text-muted-foreground">-</span>
            </td>

            <td
              style={{
                width: `${colWidths.name}px`,
                minWidth: `${colWidths.name}px`,
                left: `${colWidths.provider}px`,
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

            <td colSpan={13} className="p-2 font-mono text-[11px] text-foreground align-middle">
              <span className="block font-mono text-[11px] text-muted-foreground truncate">
                {row.tokenPricingText || row.detailsText}
              </span>
            </td>
          </tr>
        </React.Fragment>
      );
    }

    // Main Model Row
    let rowTextStyle = 'text-foreground';
    if (row.hasPromo) {
      rowTextStyle = 'font-bold text-emerald-600 dark:text-emerald-400';
    } else if (isCustomFamily) {
      rowTextStyle = 'font-bold text-blue-600 dark:text-blue-400';
    }

    const isAdaptiveYes = row.adaptiveThinking && row.adaptiveThinking !== 'unsupported';

    return (
      <React.Fragment key={row.id}>
        <tr
          onClick={() => handleModelSelect(row)}
          className={`transition-colors cursor-pointer ${
            isSelectedModel
              ? 'bg-primary/15 hover:bg-primary/20 ring-1 ring-inset ring-primary/40'
              : 'bg-card/50 hover:bg-muted/40'
          }`}
          title="Click to select this model for LLM Chat"
        >
          {/* 1st Column: Provider (Fixed Sticky 1) */}
          <td
            style={{ width: `${colWidths.provider}px`, minWidth: `${colWidths.provider}px` }}
            className="left-0 z-10 sticky bg-background/95 backdrop-blur p-2 font-mono text-xs align-middle"
          >
            <span className={`bg-muted px-1.5 py-0.5 border border-border rounded font-mono text-[10px] uppercase ${rowTextStyle}`}>
              {row.provider || 'N/A'}
            </span>
          </td>

          {/* 2nd Column: Model Name (Fixed Sticky 2 + Tree expand toggle) */}
          <td
            style={{
              width: `${colWidths.name}px`,
              minWidth: `${colWidths.name}px`,
              left: `${colWidths.provider}px`,
            }}
            className="z-10 sticky bg-background/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] backdrop-blur p-2 font-mono text-xs align-middle"
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
                <span className="bg-primary text-primary-foreground p-0.5 rounded-full shrink-0" title="Selected Model">
                  <Check size={10} className="stroke-[3]" />
                </span>
              )}
              <span className={`font-medium truncate block ${rowTextStyle}`}>
                {row.name}
              </span>
            </div>
          </td>

          {/* 3rd Column: Cost Rating */}
          <td
            style={{ width: `${colWidths.cost}px` }}
            className="group relative p-2 font-mono text-xs align-middle"
            data-tooltip={row.promoTooltipText || undefined}
          >
            <div className="flex items-center cursor-help">
              <Rating rating={row.costRating} maxRating={5} size="sm" />
            </div>
          </td>

          {/* 4th Column: Category */}
          <td style={{ width: `${colWidths.category}px` }} className="p-2 font-mono text-xs align-middle">
            {row.categoryText !== '-' ? (
              <span className={`inline-flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 border border-primary/20 rounded font-mono text-[10px] ${rowTextStyle}`}>
                {row.categoryText}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">-</span>
            )}
          </td>

          {/* Max Context */}
          <td style={{ width: `${colWidths.contextWindow}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-xs ${rowTextStyle}`}>{formatTokens(row.contextWindow)}</span>
          </td>

          {/* Max Prompt */}
          <td style={{ width: `${colWidths.maxPrompt}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-xs ${rowTextStyle}`}>{formatTokens(row.maxPromptTokens)}</span>
          </td>

          {/* Max Output */}
          <td style={{ width: `${colWidths.maxOutput}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-xs ${rowTextStyle}`}>{formatTokens(row.maxOutputTokens)}</span>
          </td>

          {/* Adaptive Thinking */}
          <td style={{ width: `${colWidths.adaptiveThinking}px` }} className="p-2 font-mono text-xs text-center align-middle">
            {isAdaptiveYes ? (
              <span data-tooltip={`adaptive_thinking: ${row.adaptiveThinking}`} className="text-sm cursor-help">
                {row.adaptiveThinking === 'required' ? '🤔❗' : '🤔'}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">-</span>
            )}
          </td>

          {/* Reasoning Effort */}
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

          {/* Tools */}
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

          {/* Vision */}
          <td
            style={{ width: `${colWidths.vision}px` }}
            className="group relative p-2 font-mono text-xs text-center align-middle"
            data-tooltip={row.visionTooltipText || undefined}
          >
            <Checkbox checked={row.vision} disabled className="pointer-events-none" />
          </td>

          {/* Tokenizer */}
          <td style={{ width: `${colWidths.tokenizer}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-[11px] ${rowTextStyle}`}>{row.tokenizer}</span>
          </td>

          {/* Streaming */}
          <td style={{ width: `${colWidths.streaming}px` }} className="p-2 font-mono text-xs text-center align-middle">
            <Checkbox checked={row.streaming} disabled className="pointer-events-none" />
          </td>

          {/* Structured Outputs */}
          <td style={{ width: `${colWidths.structuredOutputs}px` }} className="p-2 font-mono text-xs text-center align-middle">
            <Checkbox checked={row.structuredOutputs} disabled className="pointer-events-none" />
          </td>

          {/* Token Pricing */}
          <td style={{ width: `${colWidths.tokenPricing}px` }} className="p-2 font-mono text-xs align-middle">
            <span className={`font-mono text-[11px] truncate block ${rowTextStyle}`}>
              {row.tokenPricingText}
            </span>
          </td>
        </tr>

        {/* Render TreeTable Sub-Rows when expanded */}
        {hasSubRows &&
          isExpanded &&
          row.subRows!.map((subRow) => renderTableRow(subRow, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 bg-card p-2.5 border border-border rounded-lg w-full h-full min-h-0 overflow-hidden font-sans text-foreground">
      {/* Filters & Control Bar */}
      <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-border border-b shrink-0">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="font-bold text-xs uppercase">LLM Models Registry</span>
          <span className="bg-muted px-2 py-0.5 rounded font-mono text-[11px] text-muted-foreground">
            {tableData.length} models
          </span>

          {/* Active Sort Rules Badges */}
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
          {/* Provider Select with z-[10000] for Portal Overlay */}
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

      {/* Flat Table Display with Fixed First 2 Columns and Merged Sub-Rows */}
      <div className="flex-1 bg-background border border-border rounded min-h-0 overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="top-0 z-20 sticky bg-muted/90 backdrop-blur border-border border-b font-mono text-[11px] uppercase">
            <tr>
              {renderHeaderCell('Provider', 'provider', 'provider')}
              {renderHeaderCell('Model Name', 'name', 'name')}
              {renderHeaderCell('Cost', 'cost', 'cost')}
              {renderHeaderCell('Category', 'category', 'category')}
              {renderHeaderCell(<><span className="block">Max</span><span>Context</span></>, 'contextWindow', 'contextWindow')}
              {renderHeaderCell(<><span className="block">Max</span><span>Prompt</span></>, 'maxPrompt', 'maxPrompt')}
              {renderHeaderCell(<><span className="block">Max</span><span>Output</span></>, 'maxOutput', 'maxOutput')}
              {renderHeaderCell(<><span className="block">Adaptive</span><span>Thinking</span></>, 'adaptiveThinking', 'adaptiveThinking')}
              {renderHeaderCell(<><span className="block">Reasoning</span><span>Effort</span></>, 'reasoningEffort', 'reasoningEffort')}
              {renderHeaderCell('Tools', 'tools', 'tools')}
              {renderHeaderCell('Vision', 'vision', 'vision')}
              {renderHeaderCell('Tokenizer', 'tokenizer', 'tokenizer')}
              {renderHeaderCell('Streaming', 'streaming', 'streaming')}
              {renderHeaderCell(<><span className="block">Structured</span><span>Outputs</span></>, 'structuredOutputs', 'structuredOutputs')}
              {renderHeaderCell('Token Pricing', 'tokenPricing', 'tokenPricing')}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={15} className="p-8 text-muted-foreground text-xs text-center italic">
                  Loading LLM Models metadata...
                </td>
              </tr>
            ) : tableData.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-8 text-muted-foreground text-xs text-center italic">
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

# 2. Update LLMModelsInfoModal to accept onSelectModel prop and close modal on selection
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/llm-chat/llm-models-info-modal.tsx
import React from 'react';
import { LlmProvider } from '@/shared/services/llm-chat';
import { LLMModelsInfo } from './llm-models-info';
import { useDraggablePopup } from '../hooks/use-llm-models-info-modal';
import { X, Sparkles, Move, Maximize2, Minus, Square, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LLMModelsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider?: LlmProvider | 'all';
  onSelectModel?: (provider: LlmProvider, modelId: string) => void;
}

export const LLMModelsInfoModal: React.FC<LLMModelsInfoModalProps> = ({
  isOpen,
  onClose,
  currentProvider = 'all',
  onSelectModel,
}) => {
  const {
    modalRef,
    isMaximized,
    isMinimized,
    toggleMaximize,
    toggleMinimize,
    startDrag,
    startResize,
  } = useDraggablePopup(isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: '16px',
        top: '16px',
        width: '1000px',
        height: '800px',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
      className={`z-40 flex flex-col bg-card border border-border shadow-2xl overflow-hidden ${
        isMaximized ? 'rounded-none border-none' : 'rounded-xl'
      }`}
    >
      {/* Draggable Header Bar (Double click to Maximize/Restore) */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={toggleMaximize}
        className="flex justify-between items-center bg-muted/50 px-3 py-2 border-b border-border shrink-0 cursor-move select-none rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          {!isMaximized && <Move className="w-3.5 h-3.5 text-muted-foreground" />}
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-wide text-foreground">
            LLM Model Capabilities & Specifications
          </h3>
        </div>

        {/* Window Control Buttons */}
        <div className="flex items-center gap-1">
          {/* Minimize Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            className="w-6 h-6 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
            title={isMinimized ? "Restore Window" : "Minimize Window"}
          >
            <Minus size={13} />
          </Button>

          {/* Maximize / Restore Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize();
            }}
            className="w-6 h-6 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
            title={isMaximized ? "Restore Size" : "Maximize Window"}
          >
            {isMaximized ? <Copy size={12} className="rotate-180" /> : <Square size={11} />}
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-6 h-6 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
            title="Close Window"
          >
            <X size={13} />
          </Button>
        </div>
      </div>

      {/* Main Content Panel (Hidden when minimized) */}
      {!isMinimized && (
        <div className="flex-1 p-2.5 min-h-0 overflow-hidden bg-background rounded-b-xl select-text">
          <LLMModelsInfo
            initialProvider={currentProvider}
            onSelectModel={(prov, modelId) => {
              if (onSelectModel) {
                onSelectModel(prov, modelId);
              }
              onClose();
            }}
          />
        </div>
      )}

      {/* Resize Bottom-Right Handle (Disabled when maximized or minimized) */}
      {!isMaximized && !isMinimized && (
        <div
          onMouseDown={startResize}
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors z-20"
          title="Resize Window"
        >
          <Maximize2 size={10} className="rotate-90" />
        </div>
      )}
    </div>
  );
};

export default LLMModelsInfoModal;
EOF

# 3. Update LLMChat to pass onSelectModel callback to close modal and update selection
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/llm-chat/llm-chat.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronsDown, ChevronsUp, ArrowUp, ArrowDown, X, Plus, Info } from 'lucide-react';
import { LlmProvider } from '@/shared/services/llm-chat';
import { useLlmChat } from '../hooks/use-llm-chat';
import { useLlmModelsInfoModal } from '../hooks/use-llm-models-info-modal';
import { UserMessageBlock } from './components/UserMessageBlock';
import { AssistantMessageBlock } from './components/AssistantMessageBlock';
import { LLMModelsInfoModal } from './llm-models-info-modal';

export const LLMChat: React.FC = () => {
  const {
    provider,
    setProvider,
    models,
    selectedModel,
    setSelectedModel,
    messages,
    inputPrompt,
    setInputPrompt,
    temperature,
    setTemperature,
    attachedFiles,
    filePathInput,
    setFilePathInput,
    isReadingFile,
    isLoading,
    globalExpanded,
    scrollContainerRef,
    messagesEndRef,
    handleAddFileContext,
    handleRemoveFileContext,
    handleSend,
    handleScrollToTop,
    handleScrollToBottom,
    handleExpandAll,
    handleCollapseAll,
  } = useLlmChat();

  const { isOpen: isModalOpen, openModal, closeModal } = useLlmModelsInfoModal();

  return (
    <div className="relative flex flex-col gap-2.5 bg-background p-0 w-full h-full min-h-0 overflow-hidden font-sans text-foreground">
      {/* Standard Panel Top Toolbar */}
      <div className="flex justify-between items-center bg-muted/20 px-1 border-border border-b font-mono text-xs shrink-0">
        <div className="flex items-center gap-1">
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleExpandAll}
            data-tooltip="Expand All Message Panels"
          >
            <ChevronsDown size={13} />
          </Button>
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleCollapseAll}
            data-tooltip="Collapse All Message Panels"
          >
            <ChevronsUp size={13} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleScrollToTop}
            data-tooltip="Scroll to Top"
          >
            <ArrowUp size={13} />
          </Button>
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleScrollToBottom}
            data-tooltip="Scroll to Bottom"
          >
            <ArrowDown size={13} />
          </Button>
        </div>
      </div>

      {/* Message History */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col flex-1 gap-2.5 p-2 min-h-0 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="opacity-60 mt-8 font-mono text-xs text-center italic">
            No conversation started. Attach files as context and type your instruction below.
          </div>
        ) : (
          messages.map((msg) =>
            msg.role === 'user' ? (
              <UserMessageBlock
                key={msg.id}
                msg={msg}
                globalExpanded={globalExpanded}
              />
            ) : (
              <AssistantMessageBlock
                key={msg.id}
                msg={msg}
                fallbackProvider={provider}
                fallbackModel={selectedModel}
                globalExpanded={globalExpanded}
              />
            )
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Controls */}
      <footer className="flex flex-col gap-2 p-2 pt-2 border-border border-t text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2 pb-2 border-border border-b text-xs shrink-0">
          <span className="font-bold">Provider:</span>
          <Select
            value={provider}
            onValueChange={(val) => val && setProvider(val as LlmProvider)}
          >
            <SelectTrigger className="w-28 h-7 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LlmProvider.OLLAMA}>🦙 Ollama</SelectItem>
              <SelectItem value={LlmProvider.GEMINI}>♊ Gemini</SelectItem>
              <SelectItem value={LlmProvider.COPILOT}>✈️ Copilot</SelectItem>
            </SelectContent>
          </Select>

          <span className="ml-1 font-bold">Model:</span>
          <Select
            value={selectedModel}
            onValueChange={(val) => val && setSelectedModel(val)}
          >
            <SelectTrigger className="flex-1 max-w-[150px] h-7 font-mono text-xs">
              <SelectValue placeholder="Select model..." />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="ml-1 font-medium">Temp ({temperature}):</span>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="bg-transparent p-0 border-0 w-16 h-5 cursor-pointer"
          />

          {/* Tool icon for toggling model info popup */}
          <div className="ml-auto flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={openModal}
              className="w-7 h-7 hover:bg-primary/10 border-border text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              data-tooltip="View Model Capabilities & Info"
            >
              <Info size={14} />
            </Button>
          </div>
        </div>

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="opacity-80 font-bold text-[11px]">Context Files:</span>
            {attachedFiles.map((file) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 border border-primary/20 rounded-full font-mono text-[10px] text-primary"
              >
                📄 {file.path}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFileContext(file.path)}
                  data-tooltip="Remove file context"
                  className="hover:bg-transparent p-0 w-3.5 h-3.5 text-primary hover:text-destructive"
                >
                  <X size={10} />
                </Button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={filePathInput}
            onChange={(e) => setFilePathInput(e.target.value)}
            placeholder="Add file path as context (e.g. src/services/user.service.ts)..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFileContext();
              }
            }}
            className="flex-1 h-8 font-mono text-xs"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddFileContext}
            disabled={isReadingFile || !filePathInput.trim()}
            className="gap-1 h-8 font-mono text-xs cursor-pointer"
          >
            <Plus size={12} />
            {isReadingFile ? 'Reading...' : 'Add Context'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Type your instruction for LLM..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 min-h-[50px] font-mono text-xs resize-none"
          />
          <Button
            variant="default"
            onClick={handleSend}
            disabled={isLoading}
            className="h-auto font-bold text-xs cursor-pointer"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </Button>
        </div>
      </footer>

      {/* Non-Modal Models Metadata Info Popup */}
      <LLMModelsInfoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        currentProvider={provider}
        onSelectModel={(prov, modelId) => {
          setProvider(prov);
          setSelectedModel(modelId);
        }}
      />
    </div>
  );
};

export default LLMChat;
EOF

# 4. Build project to verify

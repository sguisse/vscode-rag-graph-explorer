import React from 'react';
import {
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsRight,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { useAppContextStore } from '@/store/useAppContextStore';
import { TriStateCheckbox } from './TriStateCheckbox';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';
import {
  RefSortField,
  RefSortRule,
  ProjectReferencesViewMode,
} from '../model/prj-model-ui';

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono ${className || ''}`}>
      {children}
    </span>
  );
}

function getUpdateIconStyle(changePercent?: number): { iconClass: string; tooltipText: string } {
  if (!changePercent || changePercent <= 1) {
    return {
      iconClass: 'text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10',
      tooltipText: 'Reload stored doc from URL (Up to date)',
    };
  }
  if (changePercent <= 10) {
    return {
      iconClass: 'text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 animate-pulse',
      tooltipText: `Minor change detected (${changePercent}%) - Click to reload`,
    };
  }
  if (changePercent <= 20) {
    return {
      iconClass: 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 animate-pulse',
      tooltipText: `Moderate change detected (${changePercent}%) - Click to reload`,
    };
  }
  return {
    iconClass: 'text-red-500 hover:text-red-600 hover:bg-red-500/10 animate-pulse',
    tooltipText: `Major change detected (${changePercent}%) - Click to reload`,
  };
}

function formatDate(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

interface ReferencesTableProps {
  isGrouped: boolean;
  groupedReferences: Record<string, ReferenceItem[]>;
  sortedReferences: ReferenceItem[];
  categorySelectionStates: Record<string, boolean | 'indeterminate'>;
  globalSelectionState: boolean | 'indeterminate';
  expandedCategories: Record<string, boolean>;
  onToggleCategoryExpand: (cat: string) => void;
  onExpandAllCategories: () => void;
  onCollapseAllCategories: () => void;
  onToggleCategorySelectAll: (cat: string) => void;
  onToggleReferenceSelect: (id: string) => void;
  onToggleAllSelect: () => void;
  onResetSelection: () => void;
  onReloadReference: (id: string) => void;
  onReloadSelectedReferences: () => void;
  onRemoveReference: (id: string) => void;
  onRemoveSelectedReferences: () => void;
  loading: boolean;
  importing: boolean;
  sortRules: RefSortRule[];
  onHandleSort: (field: RefSortField, isShift: boolean) => void;
  onClearSort: () => void;
  hideDescription: boolean;
  hideUrl: boolean;
  totalSelectedCount: number;
  totalAllCount: number;
  totalSelectedSizeKb: number;
  totalSelectedTransfoSizeKb: number;
  totalAllSizeKb: number;
  totalAllTransfoSizeKb: number;
  viewMode: ProjectReferencesViewMode;
  onTransformReference?: (reference: ReferenceItem) => void;
}

export function ReferencesTable({
  isGrouped,
  groupedReferences,
  sortedReferences,
  categorySelectionStates,
  globalSelectionState,
  expandedCategories,
  onToggleCategoryExpand,
  onExpandAllCategories,
  onCollapseAllCategories,
  onToggleCategorySelectAll,
  onToggleReferenceSelect,
  onToggleAllSelect,
  onResetSelection,
  onReloadReference,
  onReloadSelectedReferences,
  onRemoveReference,
  onRemoveSelectedReferences,
  loading,
  importing,
  sortRules,
  onHandleSort,
  onClearSort,
  hideDescription,
  hideUrl,
  totalSelectedCount,
  totalAllCount,
  totalSelectedSizeKb,
  totalSelectedTransfoSizeKb,
  totalAllSizeKb,
  totalAllTransfoSizeKb,
  viewMode,
  onTransformReference,
}: ReferencesTableProps) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const showDescSourceCol = !(hideDescription && hideUrl);
  const totalColumns = showDescSourceCol ? 8 : 7;

  const handleOpenUrl = (e: React.MouseEvent<HTMLAnchorElement>, rawUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rawUrl) return;

    const fullUrl =
      rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('file://')
        ? rawUrl
        : `https://${rawUrl}`;

    const api = vsCodeApiService as any;
    if (typeof api.openExternal === 'function') {
      api.openExternal(fullUrl);
      return;
    }
    if (typeof api.openUrl === 'function') {
      api.openUrl(fullUrl);
      return;
    }
    if (typeof api.postMessage === 'function') {
      api.postMessage({ command: 'openExternal', url: fullUrl, payload: fullUrl });
      return;
    }

    try {
      if (typeof (window as any).vscode !== 'undefined' && typeof (window as any).vscode.postMessage === 'function') {
        (window as any).vscode.postMessage({ command: 'openExternal', url: fullUrl, payload: fullUrl });
        return;
      }
      if (typeof (window as any).acquireVsCodeApi === 'function') {
        const vscode = (window as any).acquireVsCodeApi();
        vscode.postMessage({ command: 'openExternal', url: fullUrl, payload: fullUrl });
        return;
      }
    } catch {
      // Fallback
    }

    try {
      const w = window.open(fullUrl, '_blank', 'noopener,noreferrer');
      if (!w) {
        window.location.href = fullUrl;
      }
    } catch (err) {
      console.error('[ReferencesTable] Failed to open external URL:', err);
    }
  };

  const renderSortButton = (label: string, field: RefSortField) => {
    const ruleIndex = sortRules.findIndex((r) => r.field === field);
    const sortRule = ruleIndex !== -1 ? sortRules[ruleIndex] : null;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onHandleSort(field, e.shiftKey);
        }}
        data-tooltip="Click to sort, Shift + Click for multi-sort"
        className="flex items-center gap-1 p-0.5 h-auto font-bold text-[10px] text-muted-foreground hover:text-foreground cursor-pointer select-none"
      >
        <span>{label}</span>
        {sortRule ? (
          <span className="inline-flex items-center gap-0.5 font-bold text-indigo-400 shrink-0">
            {sortRule.order === 'asc' ? (
              <ArrowUp className="stroke-[2.5] w-2.5 h-2.5" />
            ) : (
              <ArrowDown className="stroke-[2.5] w-2.5 h-2.5" />
            )}
            <span className="bg-indigo-500/20 px-1 py-0.2 border border-indigo-500/30 rounded-full font-mono text-[8px] leading-none">
              {ruleIndex + 1}
            </span>
          </span>
        ) : (
          <ArrowUpDown className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
        )}
      </Button>
    );
  };

  const renderRow = (item: ReferenceItem) => {
    const { iconClass, tooltipText } = getUpdateIconStyle(item.changeDetected);
    const hasTransfoSize =
      item.sizeKbAfterTransformation !== undefined &&
      item.sizeKbAfterTransformation !== null &&
      item.sizeKbAfterTransformation > 0;

    return (
      <tr
        key={item.id}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            onToggleReferenceSelect(item.id);
          }
        }}
        className={`transition-colors cursor-pointer select-none ${
          item.preSelected
            ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
            : 'hover:bg-muted/30 opacity-70'
        }`}
        data-tooltip="⌘/Ctrl + Click row to invert selection"
      >
        <td className="p-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={item.preSelected}
            onChange={() => onToggleReferenceSelect(item.id)}
            className="border-border rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-500 accent-indigo-500 cursor-pointer"
          />
        </td>

        <td className="p-2 align-middle whitespace-nowrap">
          <Badge className="bg-muted border-border">
            {item.category}
          </Badge>
        </td>

        <td className="p-2 align-middle whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs shrink-0">{item.emoji}</span>
            <span className="font-medium text-foreground text-xs">{item.name}</span>
          </div>
        </td>

        {showDescSourceCol && (
          <td className="p-2 max-w-0 align-middle">
            <div className="space-y-0.5 w-full">
              {!hideDescription && item.description && (
                <div className="text-[10px] text-muted-foreground truncate" title={item.description}>
                  {item.description}
                </div>
              )}
              {!hideUrl && item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleOpenUrl(e, item.url)}
                  className="inline-flex items-center gap-1 w-full text-[9px] text-indigo-400 hover:text-indigo-300 hover:underline truncate transition-colors cursor-pointer"
                  data-tooltip={`Open in external browser: ${item.url}`}
                >
                  <LinkIcon size={9} className="shrink-0" />
                  <span className="truncate">{item.url}</span>
                </a>
              )}
            </div>
          </td>
        )}

        <td className="p-2 font-mono text-[11px] text-right align-middle whitespace-nowrap">
          {item.sizeKb ? `${item.sizeKb} KB` : '-'}
        </td>

        <td className="p-2 text-center align-middle whitespace-nowrap">
          {hasTransfoSize ? (
            <span className="font-mono text-[11px] text-indigo-400">{item.sizeKbAfterTransformation} KB</span>
          ) : (
            <Badge className="bg-muted/50 border-border/60 text-[9px] text-muted-foreground">
              (no Transfo)
            </Badge>
          )}
        </td>

        <td className="p-2 font-mono text-[10px] text-muted-foreground align-middle whitespace-nowrap">
          {formatDate(item.updatedAt)}
        </td>

        <td className="p-2 text-center align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReloadReference(item.id)}
              data-tooltip={tooltipText}
              className={`h-6 w-6 transition-colors ${iconClass}`}
            >
              <RefreshCw size={11} className={importing ? 'animate-spin' : ''} />
            </Button>

            {viewMode === 'Administrator' && (
                <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    if (onTransformReference) {
                    onTransformReference(item);
                    } else {
                    setNotification('Transformer will be implemented soon !');
                    }
                }}
                data-tooltip="Transform reference"
                className="hover:bg-indigo-500/10 w-6 h-6 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                <Wand2 size={11} />
                </Button>
            )}

            {viewMode === 'Administrator' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveReference(item.id)}
                data-tooltip="Remove reference (Admin)"
                className="hover:bg-red-500/10 w-6 h-6 text-red-500 hover:text-red-600"
              >
                <Trash2 size={11} />
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col space-y-2 p-1 h-full min-h-0 font-mono text-xs">
      <div className="flex justify-between items-center bg-muted/40 px-2 py-1 rounded text-[10px] shrink-0">
        <div className="flex items-center gap-2">
          {isGrouped && (
            <div className="flex items-center gap-0.5 pr-2 border-border/60 border-r">
              <Button
                variant="ghost"
                size="icon"
                onClick={onExpandAllCategories}
                data-tooltip="Expand all categories"
                className="hover:bg-indigo-500/10 w-5 h-5 text-muted-foreground hover:text-indigo-400"
              >
                <ChevronsDown size={12} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapseAllCategories}
                data-tooltip="Collapse all categories"
                className="hover:bg-indigo-500/10 w-5 h-5 text-muted-foreground hover:text-indigo-400"
              >
                <ChevronsRight size={12} />
              </Button>
            </div>
          )}

          {sortRules.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Multi-sort active:</span>
              {sortRules.map((r, i) => (
                <Badge key={r.field} className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                  {i + 1}. {r.field} ({r.order === 'asc' ? '↑' : '↓'})
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Reset Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetSelection}
            data-tooltip="Reset selection to default preSelected references"
            className="p-0 h-auto text-[9px] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Reset Selection
          </Button>

          {sortRules.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSort}
              className="p-0 h-auto text-[9px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Reset Sort
            </Button>
          )}
        </div>
      </div>

      <div className="relative flex-1 bg-background border border-border rounded min-h-0 max-h-[380px] md:max-h-[500px] overflow-x-hidden overflow-y-auto">
        <table className="w-full font-mono text-xs text-left border-collapse table-auto">
          <thead className="top-0 z-10 sticky bg-muted/95 shadow-xs backdrop-blur border-border border-b font-bold text-[10px] text-muted-foreground uppercase select-none">
            <tr>
              <th className="p-2 w-10 text-center">
                <div className="flex justify-center items-center">
                  <TriStateCheckbox
                    state={globalSelectionState}
                    onChange={onToggleAllSelect}
                  />
                </div>
              </th>
              <th className="p-2 whitespace-nowrap">{renderSortButton('Category', 'category')}</th>
              <th className="p-2 whitespace-nowrap">{renderSortButton('Name & Emoji', 'name')}</th>
              {showDescSourceCol && (
                <th className="p-2 w-full">Description / Source</th>
              )}
              <th className="p-2 text-right whitespace-nowrap">{renderSortButton('Size (KB)', 'sizeKb')}</th>
              <th className="p-2 text-center whitespace-nowrap">{renderSortButton('Transfo Size (KB)', 'sizeKbAfterTransformation')}</th>
              <th className="p-2 whitespace-nowrap">{renderSortButton('Updated Date', 'updatedAt')}</th>
              <th className="p-2 w-24 text-center whitespace-nowrap">
                <div className="flex justify-center items-center gap-1">
                  <span>Actions</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReloadSelectedReferences}
                    disabled={totalSelectedCount === 0 || importing}
                    data-tooltip={`Reload all ${totalSelectedCount} selected references`}
                    className="hover:bg-indigo-500/20 disabled:opacity-40 w-5 h-5 text-indigo-400 hover:text-indigo-300"
                  >
                    <RefreshCw size={11} className={importing ? 'animate-spin' : ''} />
                  </Button>
                  {viewMode === 'Administrator' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onRemoveSelectedReferences}
                      disabled={totalSelectedCount === 0 || loading}
                      data-tooltip={`Remove all ${totalSelectedCount} selected references (Admin)`}
                      className="hover:bg-red-500/20 disabled:opacity-40 w-5 h-5 text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={11} />
                    </Button>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={totalColumns} className="p-4 text-muted-foreground text-xs text-center italic">
                  Loading project references...
                </td>
              </tr>
            ) : isGrouped ? (
              Object.keys(groupedReferences).length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="p-4 text-muted-foreground text-xs text-center italic">
                    No references match your current filters.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedReferences).map(([category, items]) => {
                  const isExpanded = expandedCategories[category] ?? true;
                  const catState = categorySelectionStates[category] ?? false;

                  return (
                    <React.Fragment key={category}>
                      <tr
                        className="bg-muted/30 hover:bg-muted/50 font-bold transition-colors cursor-pointer select-none"
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey) {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleCategorySelectAll(category);
                          } else {
                            onToggleCategoryExpand(category);
                          }
                        }}
                        data-tooltip="Click to expand/collapse. ⌘/Ctrl + Click to toggle category selection."
                      >
                        <td className="p-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <TriStateCheckbox
                            state={catState}
                            onChange={() => onToggleCategorySelectAll(category)}
                          />
                        </td>
                        <td colSpan={totalColumns - 2} className="p-2 truncate align-middle">
                          <div className="flex items-center gap-2 truncate cursor-pointer select-none">
                            {isExpanded ? (
                              <ChevronDown size={13} className="text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                            )}
                            <span className="font-bold text-foreground text-xs truncate uppercase">{category}</span>
                            <Badge className="bg-muted border-border shrink-0">
                              {items.length} {items.length === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2 text-center align-middle">
                          <span className="text-[10px] text-muted-foreground italic">
                            {items.filter((i) => i.preSelected).length}/{items.length}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && items.map((item) => renderRow(item))}
                    </React.Fragment>
                  );
                })
              )
            ) : sortedReferences.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="p-4 text-muted-foreground text-xs text-center italic">
                  No references match your current filters.
                </td>
              </tr>
            ) : (
              sortedReferences.map((item) => renderRow(item))
            )}
          </tbody>

          {/* Always display total references on the right side of / */}
          <tfoot className="bottom-0 z-10 sticky bg-muted/95 shadow-xs backdrop-blur border-border border-t-2 font-bold text-[10px] text-foreground uppercase">
            <tr>
              <td colSpan={showDescSourceCol ? 3 : 2} className="p-2 whitespace-nowrap">
                Total Selected: <span className="text-indigo-400">{totalSelectedCount}</span> / {totalAllCount} References
              </td>
              <td colSpan={1} className="p-2 text-right whitespace-nowrap">
                Total Selected Size:
              </td>
              <td colSpan={1} className="p-2 font-mono text-indigo-400 text-right whitespace-nowrap">
                {totalSelectedSizeKb} KB
              </td>
              <td colSpan={1} className="p-2 font-mono text-indigo-400 text-center whitespace-nowrap">
                {totalSelectedTransfoSizeKb} KB
              </td>
              <td colSpan={2} className="p-2 text-[9px] text-muted-foreground text-center whitespace-nowrap">
                (All: {totalAllSizeKb} KB / {totalAllTransfoSizeKb} KB)
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

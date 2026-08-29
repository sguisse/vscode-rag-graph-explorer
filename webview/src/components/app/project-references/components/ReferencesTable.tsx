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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { TriStateCheckbox } from './TriStateCheckbox';
import {
  ReferenceItem,
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
  expandedCategories: Record<string, boolean>;
  onToggleCategoryExpand: (cat: string) => void;
  onExpandAllCategories: () => void;
  onCollapseAllCategories: () => void;
  onToggleCategorySelectAll: (cat: string) => void;
  onToggleReferenceSelect: (id: string) => void;
  onReloadReference: (id: string) => void;
  onReloadSelectedReferences: () => void;
  onRemoveReference: (id: string) => void;
  onRemoveSelectedReferences: () => void;
  loading: boolean;
  importing: boolean;
  sortRules: RefSortRule[];
  onHandleSort: (field: RefSortField, isShift: boolean) => void;
  onClearSort: () => void;
  totalSelectedCount: number;
  totalCount: number;
  totalSelectedSizeKb: number;
  totalSizeKb: number;
  viewMode: ProjectReferencesViewMode;
}

export function ReferencesTable({
  isGrouped,
  groupedReferences,
  sortedReferences,
  categorySelectionStates,
  expandedCategories,
  onToggleCategoryExpand,
  onExpandAllCategories,
  onCollapseAllCategories,
  onToggleCategorySelectAll,
  onToggleReferenceSelect,
  onReloadReference,
  onReloadSelectedReferences,
  onRemoveReference,
  onRemoveSelectedReferences,
  loading,
  importing,
  sortRules,
  onHandleSort,
  onClearSort,
  totalSelectedCount,
  totalCount,
  totalSelectedSizeKb,
  totalSizeKb,
  viewMode,
}: ReferencesTableProps) {
  const handleOpenUrl = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url) return;

    try {
      if (vsCodeApiService && typeof (vsCodeApiService as any).openExternal === 'function') {
        (vsCodeApiService as any).openExternal(url);
      } else if (vsCodeApiService && typeof (vsCodeApiService as any).openUrl === 'function') {
        (vsCodeApiService as any).openUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
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
              <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-2.5 h-2.5 stroke-[2.5]" />
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
            className="rounded border-border text-indigo-500 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-500"
          />
        </td>

        <td className="p-2 align-middle">
          <Badge className="border-border bg-muted">
            {item.category}
          </Badge>
        </td>

        <td className="p-2 align-middle">
          <div className="flex items-center gap-1.5">
            <span className="text-xs shrink-0">{item.emoji}</span>
            <span className="font-medium text-xs text-foreground truncate">{item.name}</span>
          </div>
        </td>

        <td className="p-2 align-middle">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground truncate">{item.description}</div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleOpenUrl(e, item.url)}
                className="inline-flex items-center gap-1 text-[9px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer transition-colors max-w-full truncate"
                data-tooltip={`Open in external browser: ${item.url}`}
              >
                <LinkIcon size={9} className="shrink-0" />
                <span className="truncate">{item.url}</span>
              </a>
            )}
          </div>
        </td>

        <td className="p-2 align-middle font-mono text-[10px] text-muted-foreground whitespace-nowrap">
          {formatDate(item.updatedAt)}
        </td>

        <td className="p-2 text-right align-middle font-mono text-[11px]">
          {item.sizeKb ? `${item.sizeKb} KB` : '-'}
        </td>

        <td className="p-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
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
                onClick={() => onRemoveReference(item.id)}
                data-tooltip="Remove reference (Admin)"
                className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
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
    <div className="p-1 space-y-2 font-mono text-xs">
      {(isGrouped || sortRules.length > 0) && (
        <div className="flex items-center justify-between px-2 py-1 bg-muted/40 rounded text-[10px]">
          <div className="flex items-center gap-2">
            {isGrouped && (
              <div className="flex items-center gap-0.5 pr-2 border-r border-border/60">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExpandAllCategories}
                  data-tooltip="Expand all categories"
                  className="h-5 w-5 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10"
                >
                  <ChevronsDown size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCollapseAllCategories}
                  data-tooltip="Collapse all categories"
                  className="h-5 w-5 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10"
                >
                  <ChevronsRight size={12} />
                </Button>
              </div>
            )}

            {sortRules.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Multi-sort active:</span>
                {sortRules.map((r, i) => (
                  <Badge key={r.field} className="text-indigo-400 bg-indigo-500/10 border-indigo-500/20">
                    {i + 1}. {r.field} ({r.order === 'asc' ? '↑' : '↓'})
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {sortRules.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSort}
              className="p-0 h-auto text-[9px] text-muted-foreground hover:text-foreground"
            >
              Reset Sort
            </Button>
          )}
        </div>
      )}

      <div className="border border-border rounded overflow-x-auto bg-background">
        <table className="w-full text-left border-collapse table-auto font-mono text-xs">
          <thead className="bg-muted/80 border-b border-border text-[10px] uppercase text-muted-foreground font-bold select-none">
            <tr>
              <th className="p-2 w-10 text-center">Sel</th>
              <th className="p-2">{renderSortButton('Category', 'category')}</th>
              <th className="p-2">{renderSortButton('Name & Emoji', 'name')}</th>
              <th className="p-2">Description / Source</th>
              <th className="p-2">{renderSortButton('Updated Date', 'updatedAt')}</th>
              <th className="p-2 text-right">{renderSortButton('Size (KB)', 'sizeKb')}</th>
              <th className="p-2 text-center w-24">
                <div className="flex items-center justify-center gap-1">
                  <span>Actions</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReloadSelectedReferences}
                    disabled={totalSelectedCount === 0 || importing}
                    data-tooltip={`Reload all ${totalSelectedCount} selected references`}
                    className="h-5 w-5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-40"
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
                      className="h-5 w-5 text-red-500 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-40"
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
                <td colSpan={7} className="p-4 text-center text-muted-foreground italic text-xs">
                  Loading project references...
                </td>
              </tr>
            ) : isGrouped ? (
              Object.keys(groupedReferences).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground italic text-xs">
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
                        className="bg-muted/30 hover:bg-muted/50 transition-colors font-bold select-none cursor-pointer"
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
                        <td colSpan={5} className="p-2 align-middle">
                          <div className="flex items-center gap-2 cursor-pointer select-none">
                            {isExpanded ? (
                              <ChevronDown size={13} className="text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                            )}
                            <span className="font-bold text-xs text-foreground uppercase">{category}</span>
                            <Badge className="border-border bg-muted">
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
                <td colSpan={7} className="p-4 text-center text-muted-foreground italic text-xs">
                  No references match your current filters.
                </td>
              </tr>
            ) : (
              sortedReferences.map((item) => renderRow(item))
            )}
          </tbody>

          <tfoot className="bg-muted/90 border-t-2 border-border font-bold text-[10px] uppercase text-foreground">
            <tr>
              <td colSpan={3} className="p-2">
                Total Selected: <span className="text-indigo-400">{totalSelectedCount}</span> / {totalCount} References
              </td>
              <td colSpan={2} className="p-2 text-right">
                Total Selected Size:
              </td>
              <td className="p-2 text-right text-indigo-400 font-mono">
                {totalSelectedSizeKb} KB
              </td>
              <td className="p-2 text-center text-muted-foreground text-[9px]">
                (All: {totalSizeKb} KB)
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

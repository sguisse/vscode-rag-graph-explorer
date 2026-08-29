import React from 'react';
import { Search, User, ShieldAlert, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectReferencesViewMode } from '../model/prj-model-ui';

interface ReferencesFilterBarProps {
  isGrouped: boolean;
  onToggleGrouped: (val: boolean) => void;
  categories: string[];
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  emojis: string[];
  emojiFilter: string;
  onEmojiFilterChange: (val: string) => void;
  preSelectedOnly: boolean;
  onPreSelectedOnlyChange: (val: boolean) => void;
  globalFilter: string;
  onGlobalFilterChange: (val: string) => void;
  viewMode: ProjectReferencesViewMode;
  onViewModeToggle: (mode: ProjectReferencesViewMode) => void;
}

export function ReferencesFilterBar({
  isGrouped,
  onToggleGrouped,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  emojis,
  emojiFilter,
  onEmojiFilterChange,
  preSelectedOnly,
  onPreSelectedOnlyChange,
  globalFilter,
  onGlobalFilterChange,
  viewMode,
  onViewModeToggle,
}: ReferencesFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/30 border border-border rounded-md font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Grouping Checkbox */}
        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-foreground uppercase select-none shrink-0">
          <input
            type="checkbox"
            checked={isGrouped}
            onChange={(e) => onToggleGrouped(e.target.checked)}
            className="rounded border-border text-indigo-500 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-500"
          />
          <span>Group by Category</span>
        </label>

        <div className="h-4 w-px bg-border shrink-0" />

        {/* Category Select Filter */}
        <div className="flex items-center gap-1">
          <Filter size={11} className="text-muted-foreground shrink-0" />
          <Select
            value={categoryFilter}
            onValueChange={(val: string | null) => onCategoryFilterChange(val || 'all')}
          >
            <SelectTrigger className="bg-background h-7 text-[11px] w-36 font-mono">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Emoji Select Filter */}
        <Select
          value={emojiFilter}
          onValueChange={(val: string | null) => onEmojiFilterChange(val || 'all')}
        >
          <SelectTrigger className="bg-background h-7 text-[11px] w-28 font-mono">
            <SelectValue placeholder="All Emojis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">😃 All Emojis</SelectItem>
            {emojis.map((e) => (
              <SelectItem key={e} value={e}>
                {e} Emoji
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Pre-selected Only Checkbox */}
        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase select-none shrink-0">
          <input
            type="checkbox"
            checked={preSelectedOnly}
            onChange={(e) => onPreSelectedOnlyChange(e.target.checked)}
            className="rounded border-border text-indigo-500 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-500"
          />
          <span>Pre-selected Only</span>
        </label>
      </div>

      {/* Right Aligned Area: Search & View Mode Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative w-44">
          <Search size={12} className="absolute left-2 top-2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search column..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="h-7 pl-7 text-[11px] font-mono bg-background"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onViewModeToggle(viewMode === 'User' ? 'Administrator' : 'User')}
          data-tooltip={`Switch view mode (Current: ${viewMode})`}
          className={`h-7 text-[10px] font-bold font-mono gap-1 shrink-0 ${
            viewMode === 'Administrator'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-background text-muted-foreground'
          }`}
        >
          {viewMode === 'Administrator' ? <ShieldAlert size={12} /> : <User size={12} />}
          <span>{viewMode} Mode</span>
        </Button>
      </div>
    </div>
  );
}

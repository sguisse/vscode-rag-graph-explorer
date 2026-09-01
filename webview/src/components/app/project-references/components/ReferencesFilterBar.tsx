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
  selectedOnly: boolean;
  onSelectedOnlyChange: (val: boolean) => void;
  globalFilter: string;
  onGlobalFilterChange: (val: string) => void;
  hideDescription: boolean;
  onHideDescriptionChange: (val: boolean) => void;
  hideUrl: boolean;
  onHideUrlChange: (val: boolean) => void;
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
  selectedOnly,
  onSelectedOnlyChange,
  globalFilter,
  onGlobalFilterChange,
  hideDescription,
  onHideDescriptionChange,
  hideUrl,
  onHideUrlChange,
  viewMode,
  onViewModeToggle,
}: ReferencesFilterBarProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-2 bg-muted/30 p-2 border border-border rounded-md font-mono text-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex items-center gap-1.5 font-bold text-[10px] text-foreground uppercase cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={isGrouped}
            onChange={(e) => onToggleGrouped(e.target.checked)}
            className="border-border rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-500 accent-indigo-500 cursor-pointer"
          />
          <span>Group by Category</span>
        </label>

        <div className="bg-border w-px h-4 shrink-0" />

        <div className="flex items-center gap-1">
          <Filter size={11} className="text-muted-foreground shrink-0" />
          <Select
            value={categoryFilter}
            onValueChange={(val: string | null) => onCategoryFilterChange(val || 'all')}
          >
            <SelectTrigger className="bg-background w-65 h-7 font-mono text-[11px]">
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

        <Select
          value={emojiFilter}
          onValueChange={(val: string | null) => onEmojiFilterChange(val || 'all')}
        >
          <SelectTrigger className="bg-background w-28 h-7 font-mono text-[11px]">
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

        {/* Renamed "Pre Selected Only" to "Selected" */}
        <label className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground hover:text-foreground uppercase cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(e) => onSelectedOnlyChange(e.target.checked)}
            className="border-border rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-500 accent-indigo-500 cursor-pointer"
          />
          <span>Selected</span>
        </label>

        <div className="bg-border w-px h-4 shrink-0" />

        <label className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground hover:text-foreground uppercase cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={hideDescription}
            onChange={(e) => onHideDescriptionChange(e.target.checked)}
            className="border-border rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-500 accent-indigo-500 cursor-pointer"
          />
          <span>Hide Description</span>
        </label>

        <label className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground hover:text-foreground uppercase cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={hideUrl}
            onChange={(e) => onHideUrlChange(e.target.checked)}
            className="border-border rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-500 accent-indigo-500 cursor-pointer"
          />
          <span>Hide URL</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-44">
          <Search size={12} className="top-2 left-2 absolute text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search column..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="bg-background pl-7 h-7 font-mono text-[11px]"
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

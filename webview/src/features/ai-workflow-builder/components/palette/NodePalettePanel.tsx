import React, { useState } from 'react';
import {
  Search,
  Type,
  FileText,
  Bot,
  LayoutTemplate,
  Layers,
  GripVertical,
  Info,
  Terminal,
  Variable,
  GitFork,
  Image as ImageIcon,
  FileJson,
  Globe,
  Cpu,
  Replace,
  ShieldCheck,
  FileCode,
  ChevronDown,
  ChevronRight,
  Database,
  Workflow,
} from 'lucide-react';
import { PALETTE_ITEMS } from '../../constants/node-registry.constants';
import { PaletteItemDefinition } from '../../model-ui';

const ICON_MAP: Record<string, any> = {
  Type,
  FileText,
  Bot,
  Search,
  LayoutTemplate,
  Info,
  Terminal,
  Variable,
  GitFork,
  Image: ImageIcon,
  FileJson,
  Globe,
  Cpu,
  Replace,
  ShieldCheck,
  FileCode,
};

export function NodePalettePanel() {
  const [query, setQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [collapsedSubGroups, setCollapsedSubGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleSubGroup = (subGroupKey: string) => {
    setCollapsedSubGroups((prev) => ({ ...prev, [subGroupKey]: !prev[subGroupKey] }));
  };

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      item.subGroup.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const topLevelGroups: ('Data Node' | 'Step Node')[] = ['Data Node', 'Step Node'];

  const handleDragStart = (e: React.DragEvent, item: PaletteItemDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: item.type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 font-mono text-xs border-border border-r select-none">
      {/* Search Input Bar */}
      <div className="p-2 border-border border-b shrink-0">
        <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 border border-border rounded-md">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent font-mono text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Collapsible Palette Groups Container */}
      <div className="flex-1 space-y-3 p-2.5 overflow-y-auto">
        {topLevelGroups.map((groupName) => {
          const groupItems = filteredItems.filter((i) => i.group === groupName);
          if (groupItems.length === 0) return null;

          const isGroupCollapsed = !query && Boolean(collapsedGroups[groupName]);
          const subGroups = Array.from(new Set(groupItems.map((i) => i.subGroup)));
          const GroupIcon = groupName === 'Data Node' ? Database : Workflow;

          return (
            <div key={groupName} className="border border-border/70 rounded-lg overflow-hidden bg-muted/10">
              {/* Top-Level Group Collapsible Header */}
              <button
                type="button"
                onClick={() => toggleGroup(groupName)}
                className="flex justify-between items-center w-full px-2.5 py-1.5 bg-muted/40 hover:bg-muted/70 font-bold text-xs text-foreground transition-colors cursor-pointer border-b border-border/40"
              >
                <span className="flex items-center gap-1.5">
                  <GroupIcon size={14} className={groupName === 'Data Node' ? 'text-sky-400' : 'text-amber-400'} />
                  <span>{groupName}s</span>
                  <span className="text-[10px] text-muted-foreground font-normal">({groupItems.length})</span>
                </span>
                {isGroupCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>

              {/* Top-Level Group Content */}
              {!isGroupCollapsed && (
                <div className="p-1.5 space-y-2">
                  {subGroups.map((subName) => {
                    const subItems = groupItems.filter((i) => i.subGroup === subName);
                    if (subItems.length === 0) return null;

                    const subKey = `${groupName}:${subName}`;
                    const isSubCollapsed = !query && Boolean(collapsedSubGroups[subKey]);

                    return (
                      <div key={subKey} className="space-y-1">
                        {/* Sub-Group Collapsible Header */}
                        <button
                          type="button"
                          onClick={() => toggleSubGroup(subKey)}
                          className="flex justify-between items-center w-full px-2 py-1 hover:bg-muted/50 rounded font-semibold text-[10px] text-muted-foreground uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1">
                            {isSubCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                            <span>{subName}</span>
                          </span>
                          <span className="text-[9px] opacity-70">({subItems.length})</span>
                        </button>

                        {/* Sub-Group Node Items */}
                        {!isSubCollapsed && (
                          <div className="space-y-1.5 pl-1.5">
                            {subItems.map((item) => {
                              const IconComp = ICON_MAP[item.iconName] || Layers;
                              return (
                                <div
                                  key={item.type}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  className="group flex items-center gap-2 bg-background hover:bg-muted/60 p-2 border border-border hover:border-primary/50 rounded-lg transition-all cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical size={13} className="text-muted-foreground/50 group-hover:text-foreground shrink-0" />
                                  <div className="p-1.5 bg-primary/10 rounded text-primary shrink-0">
                                    <IconComp size={15} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-1">
                                      <span className="font-semibold text-foreground text-xs truncate">{item.label}</span>
                                      {item.badge && (
                                        <span className="bg-primary/15 px-1 py-0.2 rounded font-bold text-[9px] text-primary uppercase shrink-0">
                                          {item.badge}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

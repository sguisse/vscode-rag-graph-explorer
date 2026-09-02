import React, { useState } from 'react';
import { Search, Type, FileText, Bot, LayoutTemplate, Layers, GripVertical, Info, Terminal, Variable, GitFork } from 'lucide-react';
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
};

export function NodePalettePanel() {
  const [query, setQuery] = useState('');

  const filteredItems = PALETTE_ITEMS.filter(
    (item) => item.label.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase())
  );

  const categories = Array.from(new Set(filteredItems.map((i) => i.category)));

  const handleDragStart = (e: React.DragEvent, item: PaletteItemDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: item.type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 font-mono text-xs border-border border-r select-none">
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

      <div className="flex-1 space-y-4 p-2.5 overflow-y-auto">
        {categories.map((category) => (
          <div key={category} className="space-y-1.5">
            <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
              {category}
            </span>

            <div className="space-y-1.5">
              {filteredItems
                .filter((i) => i.category === category)
                .map((item) => {
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
          </div>
        ))}
      </div>
    </div>
  );
}

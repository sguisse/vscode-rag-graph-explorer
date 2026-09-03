import React, { useState } from 'react';
import { WorkflowEdge, EdgeStyle } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';
import { Button } from '@/components/ui/button';
import { Trash2, Link2, Palette, Type, Sliders, ChevronDown, ChevronRight } from 'lucide-react';

const LINK_COLOR_SWATCHES = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Sky', value: '#0284c7' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Transparent', value: 'transparent' },
  { label: 'White', value: '#ffffff' },
  { label: 'Dark Slate', value: '#1e293b' },
];

export function EdgeConfigForm({ edge }: { edge: WorkflowEdge }) {
  const { nodes, updateEdge, removeEdge } = useWorkflowStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(true);

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  return (
    <div className="space-y-3 font-mono text-xs select-none">
      <div className="flex items-center gap-1.5 font-bold text-primary text-xs uppercase">
        <Link2 size={14} /> Link Relationship
      </div>

      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Source Point</label>
        <div className="mt-0.5 p-1.5 bg-muted/40 border border-border rounded-lg text-xs truncate">
          {sourceNode ? `${sourceNode.data.label} (${edge.sourcePort})` : edge.source}
        </div>
      </div>

      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Target Entry</label>
        <div className="mt-0.5 p-1.5 bg-muted/40 border border-border rounded-lg text-xs truncate">
          {targetNode ? `${targetNode.data.label} (${edge.targetPort})` : edge.target}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
          <Type size={11} /> Relationship Title
        </label>
        <input
          type="text"
          value={edge.label || ''}
          placeholder="e.g. Tokens used: 3"
          onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
          className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="pt-2 border-border/80 border-t">
        <button
          type="button"
          onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
          className="flex justify-between items-center w-full font-bold text-[10px] text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Palette size={12} className="text-primary" /> Relationship Appearance
          </span>
          {isAppearanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isAppearanceOpen && (
          <div className="space-y-3 mt-2.5 pl-1">
            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                <Sliders size={11} /> Line Style
              </label>
              <select
                value={edge.style || 'solid'}
                onChange={(e) => updateEdge(edge.id, { style: e.target.value as EdgeStyle })}
                className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs cursor-pointer"
              >
                <option value="solid">━━ Solid Line</option>
                <option value="dashed">╌╌ Dashed Line</option>
                <option value="dotted">┈ ┈ Dotted Line</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                Line Color
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={edge.color || '#6366f1'}
                  onChange={(e) => updateEdge(edge.id, { color: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {LINK_COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateEdge(edge.id, { color: c.value })}
                      className="w-4 h-4 rounded-full border border-background shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.value === 'transparent' ? 'rgba(0,0,0,0.1)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                Label Text Color
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={edge.labelTextColor || '#000000'}
                  onChange={(e) => updateEdge(edge.id, { labelTextColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {LINK_COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateEdge(edge.id, { labelTextColor: c.value })}
                      className="w-4 h-4 rounded-full border border-background shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.value === 'transparent' ? 'rgba(0,0,0,0.1)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                Badge Background Color
              </label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={edge.labelColor || '#000000'}
                  onChange={(e) => updateEdge(edge.id, { labelColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {LINK_COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateEdge(edge.id, { labelColor: c.value })}
                      className="w-4 h-4 rounded-full border border-background shadow-2xs hover:scale-125 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.value === 'transparent' ? 'rgba(0,0,0,0.1)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => removeEdge(edge.id)}
        className="w-full mt-2 h-8 font-semibold text-xs gap-1.5 cursor-pointer"
      >
        <Trash2 size={13} /> Delete Relationship Link
      </Button>
    </div>
  );
}

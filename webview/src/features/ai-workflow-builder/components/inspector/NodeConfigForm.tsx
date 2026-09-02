import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Palette, Type, Sliders } from 'lucide-react';
import { WorkflowNode, NodeFontFamily } from '../../model-ui';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

const COLOR_SWATCHES = [
  { label: 'Default', value: '' },
  { label: 'Soft Blue', value: '#e0f2fe' },
  { label: 'Soft Purple', value: '#f3e8ff' },
  { label: 'Soft Teal', value: '#ccfbf1' },
  { label: 'Soft Yellow', value: '#fef9c3' },
  { label: 'Soft Pink', value: '#ffe4e6' },
  { label: 'Soft Gray', value: '#f1f5f9' },
];

const STROKE_TEXT_SWATCHES = [
  { label: 'Default', value: '' },
  { label: 'Primary Dark', value: '#0f172a' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Sky Blue', value: '#0284c7' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#eab308' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Slate', value: '#64748b' },
];

export function NodeConfigForm({ node }: { node: WorkflowNode }) {
  const { updateNodeData } = useWorkflowStore();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(true);

  return (
    <div className="space-y-3 font-mono text-xs select-none">
      {/* Node Info & Fields */}
      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Title</label>
        <input
          type="text"
          value={node.data.label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
          className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block font-bold text-[9px] text-muted-foreground uppercase">Description</label>
        <input
          type="text"
          value={node.data.description || ''}
          onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
          placeholder="Short description..."
          className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {node.type === 'textInput' && (
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Prompt</label>
          <textarea
            value={node.data.promptText || ''}
            onChange={(e) => updateNodeData(node.id, { promptText: e.target.value })}
            className="mt-1 p-2 bg-background border border-border rounded-lg w-full h-24 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {node.type === 'markdownFile' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Markdown File</label>
            <input
              type="text"
              value={node.data.markdownFile || ''}
              onChange={(e) => updateNodeData(node.id, { markdownFile: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Instruction</label>
            <textarea
              value={node.data.instructionText || ''}
              onChange={(e) => updateNodeData(node.id, { instructionText: e.target.value })}
              className="mt-1 p-2 bg-background border border-border rounded-lg w-full h-20 text-xs resize-none"
            />
          </div>
        </>
      )}

      {node.type === 'aiAgent' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Model</label>
            <select
              value={node.data.model || 'Mock - Offline'}
              onChange={(e) => updateNodeData(node.id, { model: e.target.value })}
              className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs"
            >
              <option value="Mock - Offline">Mock - Offline</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-muted-foreground uppercase">Token Budget</span>
              <span className="font-bold text-primary">{node.data.tokenBudget || 1000}</span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={node.data.tokenBudget || 1000}
              onChange={(e) => updateNodeData(node.id, { tokenBudget: Number(e.target.value) })}
              className="mt-1 w-full accent-primary cursor-pointer"
            />
          </div>
        </>
      )}

      {node.type === 'searchTool' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Subreddit</label>
            <input
              type="text"
              value={node.data.subreddit || ''}
              onChange={(e) => updateNodeData(node.id, { subreddit: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs"
            />
          </div>
          <div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-muted-foreground uppercase">Topic Limit</span>
              <span className="font-bold text-primary">{node.data.topicLimit || 10}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={node.data.topicLimit || 10}
              onChange={(e) => updateNodeData(node.id, { topicLimit: Number(e.target.value) })}
              className="mt-1 w-full accent-primary cursor-pointer"
            />
          </div>
        </>
      )}

      {node.type === 'script' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Script Type</label>
            <select
              value={node.data.scriptType || 'python'}
              onChange={(e) => updateNodeData(node.id, { scriptType: e.target.value as 'python' | 'bash' })}
              className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs cursor-pointer font-mono"
            >
              <option value="python">python</option>
              <option value="bash">bash</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Script Location</label>
            <input
              type="text"
              value={node.data.scriptLocation || ''}
              onChange={(e) => updateNodeData(node.id, { scriptLocation: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
            />
          </div>
        </>
      )}

      {node.type === 'argument' && (
        <>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Argument Name</label>
            <input
              type="text"
              value={node.data.argumentName || ''}
              onChange={(e) => updateNodeData(node.id, { argumentName: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-[9px] text-muted-foreground uppercase">Argument Value</label>
            <input
              type="text"
              value={node.data.argumentValue || ''}
              onChange={(e) => updateNodeData(node.id, { argumentValue: e.target.value })}
              className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
            />
          </div>
        </>
      )}

      {node.type === 'outputAnalyzer' && (
        <div>
          <label className="block font-bold text-[9px] text-muted-foreground uppercase">Condition Rule</label>
          <input
            type="text"
            value={node.data.analyzerCondition || ''}
            onChange={(e) => updateNodeData(node.id, { analyzerCondition: e.target.value })}
            placeholder="e.g. exit_code == 0"
            className="mt-1 px-2.5 py-1.5 bg-background border border-border rounded-lg w-full text-xs font-mono"
          />
        </div>
      )}

      {/* Collapsible Appearance Block */}
      <div className="pt-2 border-border/80 border-t">
        <button
          type="button"
          onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
          className="flex justify-between items-center w-full font-bold text-[10px] text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Palette size={12} className="text-primary" /> Appearance
          </span>
          {isAppearanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isAppearanceOpen && (
          <div className="space-y-3 mt-2.5 pl-1">
            {/* Fill Color */}
            <div>
              <label className="block font-bold text-[9px] text-muted-foreground uppercase">Fill Color</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={node.data.fillColor || '#ffffff'}
                  onChange={(e) => updateNodeData(node.id, { fillColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {COLOR_SWATCHES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => updateNodeData(node.id, { fillColor: s.value })}
                      style={{ backgroundColor: s.value || 'var(--card)' }}
                      className={`w-4 h-4 rounded-full border shadow-2xs hover:scale-125 transition-transform cursor-pointer ${
                        node.data.fillColor === s.value ? 'ring-2 ring-primary' : 'border-border'
                      }`}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block font-bold text-[9px] text-muted-foreground uppercase">Text Color</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={node.data.textColor || '#000000'}
                  onChange={(e) => updateNodeData(node.id, { textColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {STROKE_TEXT_SWATCHES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => updateNodeData(node.id, { textColor: s.value })}
                      style={{ backgroundColor: s.value || 'var(--foreground)' }}
                      className={`w-4 h-4 rounded-full border shadow-2xs hover:scale-125 transition-transform cursor-pointer ${
                        node.data.textColor === s.value ? 'ring-2 ring-primary' : 'border-border'
                      }`}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Border Color */}
            <div>
              <label className="block font-bold text-[9px] text-muted-foreground uppercase">Border Color</label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={node.data.borderColor || '#000000'}
                  onChange={(e) => updateNodeData(node.id, { borderColor: e.target.value })}
                  className="w-6 h-6 bg-transparent border border-border rounded-full cursor-pointer shrink-0"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {STROKE_TEXT_SWATCHES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => updateNodeData(node.id, { borderColor: s.value })}
                      style={{ backgroundColor: s.value || 'var(--border)' }}
                      className={`w-4 h-4 rounded-full border shadow-2xs hover:scale-125 transition-transform cursor-pointer ${
                        node.data.borderColor === s.value ? 'ring-2 ring-primary' : 'border-border'
                      }`}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Font Selector */}
            <div>
              <label className="flex items-center gap-1 font-bold text-[9px] text-muted-foreground uppercase">
                <Type size={11} /> Font
              </label>
              <select
                value={node.data.fontFamily || 'Sans'}
                onChange={(e) => updateNodeData(node.id, { fontFamily: e.target.value as NodeFontFamily })}
                className="mt-1 p-1.5 bg-background border border-border rounded-lg w-full text-xs cursor-pointer"
              >
                <option value="Sans">Sans-Serif</option>
                <option value="Mono">Monospace</option>
                <option value="Serif">Serif</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

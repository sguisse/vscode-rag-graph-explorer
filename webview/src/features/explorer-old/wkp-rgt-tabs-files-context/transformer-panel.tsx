import React from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Lock,
  Unlock,
  Sliders,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useTransformerPanel } from './hooks/use-transformer-panel';

interface ContextTransformerPanelProps {
  initialCodebase: CodebaseData;
  handleCopy: (text: string, message: string) => void;
}

export function ContextTransformerPanel({
  initialCodebase,
  handleCopy,
}: ContextTransformerPanelProps) {
  const {
    rules,
    editingRuleId,
    newRuleName,
    setNewRuleName,
    newRulePattern,
    setNewRulePattern,
    newRuleReplacement,
    setNewRuleReplacement,
    newRuleInverse,
    setNewRuleInverse,
    llmResponseInput,
    setLlmResponseInput,
    anonymizedResult,
    deanonymizedResult,
    substitutionMap,
    toggleRule,
    handleStartEditRule,
    handleCancelEdit,
    handleSaveRule,
    handleDeleteRule,
    handleAnonymize,
    handleDeanonymize,
  } = useTransformerPanel(initialCodebase);

  return (
    <div className="space-y-4 font-mono text-xs animate-in duration-200 fade-in">
      <div className="bg-primary/5 p-3.5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h4 className="font-bold text-foreground text-sm uppercase">
              Context Anonymizer & Transformer
            </h4>
            <p className="text-[10px] text-muted-foreground">
              Configure regex replacement rules to anonymize single-file context before sending to LLMs, and maintain inverse rules for output de-anonymization.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Sliders size={13} className="text-primary" /> Anonymization Regex Rules
          </span>
          <span className="bg-primary/10 px-2 py-0.5 rounded font-bold text-[10px] text-primary">
            {rules.filter((r) => r.enabled).length}/{rules.length} Active
          </span>
        </div>

        <div className="border border-border/70 rounded-md overflow-x-auto">
          <table className="w-full font-mono text-[11px] text-left">
            <thead className="bg-muted/60 border-border/70 border-b text-[10px] text-muted-foreground uppercase">
              <tr>
                <th className="p-2 w-10 text-center">Active</th>
                <th className="p-2">Rule Name</th>
                <th className="p-2">Match Pattern (Regex)</th>
                <th className="p-2">Replacement</th>
                <th className="p-2">Inverse Pattern</th>
                <th className="p-2 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className={`transition-colors ${
                    editingRuleId === rule.id ? 'bg-primary/10' : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="rounded text-primary cursor-pointer shrink-0"
                    />
                  </td>
                  <td className="p-2 max-w-[120px] font-semibold text-foreground truncate">
                    {rule.name}
                  </td>
                  <td className="p-2 max-w-[150px] font-mono text-amber-500 truncate">
                    {rule.pattern}
                  </td>
                  <td className="p-2 max-w-[140px] font-mono text-emerald-500 truncate">
                    {rule.replacement}
                  </td>
                  <td className="p-2 max-w-[140px] font-mono text-indigo-400 truncate">
                    {rule.inversePattern}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEditRule(rule)}
                        title="Edit Rule"
                        className={`w-6 h-6 ${
                          editingRuleId === rule.id
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        title="Delete Rule"
                        className="w-6 h-6 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 bg-muted/20 p-2.5 border border-border/50 rounded-md">
          <span className="block font-bold text-[10px] text-muted-foreground uppercase">
            {editingRuleId ? '✏️ Edit Regex Rule' : 'Add Custom Regex Rule'}
          </span>
          <div className="gap-2 grid grid-cols-2">
            <Input
              placeholder="Rule Name (e.g. Domain Anonymizer)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="bg-background h-7 font-semibold text-xs text-foreground"
            />
            <Input
              placeholder="Regex Pattern (e.g. \\bcorp\\.com)"
              value={newRulePattern}
              onChange={(e) => setNewRulePattern(e.target.value)}
              className="bg-background h-7 font-mono text-xs text-amber-500"
            />
            <Input
              placeholder="Replacement (e.g. anon.org)"
              value={newRuleReplacement}
              onChange={(e) => setNewRuleReplacement(e.target.value)}
              className="bg-background h-7 font-mono text-xs text-emerald-500"
            />
            <Input
              placeholder="Inverse Pattern (for de-anonymization)"
              value={newRuleInverse}
              onChange={(e) => setNewRuleInverse(e.target.value)}
              className="bg-background h-7 font-mono text-xs text-indigo-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            {editingRuleId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="flex items-center gap-1 h-7 text-xs"
              >
                <X size={12} /> Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveRule}
              disabled={!newRulePattern || !newRuleReplacement}
              className="flex items-center gap-1 h-7 text-xs"
            >
              {editingRuleId ? <Check size={12} /> : <Plus size={12} />}
              {editingRuleId ? 'Update Rule' : 'Add Rule'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Lock size={13} className="text-orange-500" /> 1. Anonymize Unified Context
          </span>
          <Button
            size="sm"
            onClick={handleAnonymize}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 h-7 text-white text-xs"
          >
            <Sparkles size={12} /> Transform & Anonymize
          </Button>
        </div>

        {anonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] text-emerald-500 uppercase">
                ✅ Anonymized Context ({Object.keys(substitutionMap).length} Substitutions Mapped)
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleCopy(anonymizedResult, 'Anonymized context copied to clipboard!')
                }
                className="gap-1 h-6 text-[10px]"
              >
                <Copy size={10} /> Copy Anonymized Context
              </Button>
            </div>
            <Textarea
              readOnly
              value={anonymizedResult}
              className="bg-slate-950 border-slate-800 h-36 font-mono text-[10px] text-slate-200 resize-none"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Unlock size={13} className="text-indigo-400" /> 2. De-anonymize LLM Response
          </span>
          <Button
            size="sm"
            onClick={handleDeanonymize}
            disabled={!llmResponseInput}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 h-7 text-white text-xs"
          >
            Restore Original Terms
          </Button>
        </div>

        <Textarea
          placeholder="Paste raw LLM response here to reverse substitution rules..."
          value={llmResponseInput}
          onChange={(e) => setLlmResponseInput(e.target.value)}
          className="bg-muted/30 h-20 font-mono text-[10px] resize-none"
        />

        {deanonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] text-indigo-400 uppercase">
                🔓 De-anonymized Output
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleCopy(deanonymizedResult, 'De-anonymized output copied to clipboard!')
                }
                className="gap-1 h-6 text-[10px]"
              >
                <Copy size={10} /> Copy Restored Output
              </Button>
            </div>
            <Textarea
              readOnly
              value={deanonymizedResult}
              className="bg-slate-950 border-slate-800 h-32 font-mono text-[10px] text-slate-200 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ContextTransformerPanel;

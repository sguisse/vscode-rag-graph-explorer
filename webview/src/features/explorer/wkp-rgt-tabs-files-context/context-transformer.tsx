import React from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Lock,
  Unlock,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useContextTransformer } from './use-context-transformer';

interface ContextTransformerPanelProps {
  initialCodebase: CodebaseData;
  handleCopy: (text: string, message: string) => void;
}

export function ContextTransformerPanel({
  initialCodebase,
  handleCopy
}: ContextTransformerPanelProps) {
  const {
    rules,
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
    handleAddRule,
    handleDeleteRule,
    handleAnonymize,
    handleDeanonymize,
  } = useContextTransformer(initialCodebase);

  return (
    <div className="space-y-4 animate-in duration-200 fade-in font-mono text-xs">
      <div className="bg-primary/5 p-3.5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h4 className="font-bold text-foreground text-sm uppercase">Context Anonymizer & Transformer</h4>
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
          <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px] text-primary font-bold">
            {rules.filter((r) => r.enabled).length}/{rules.length} Active
          </span>
        </div>

        <div className="border border-border/70 rounded-md overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-muted/60 text-[10px] text-muted-foreground uppercase border-b border-border/70">
              <tr>
                <th className="p-2 w-10 text-center">Active</th>
                <th className="p-2">Rule Name</th>
                <th className="p-2">Match Pattern (Regex)</th>
                <th className="p-2">Replacement</th>
                <th className="p-2">Inverse Pattern</th>
                <th className="p-2 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="rounded text-primary cursor-pointer shrink-0"
                    />
                  </td>
                  <td className="p-2 font-semibold text-foreground truncate max-w-[120px]">{rule.name}</td>
                  <td className="p-2 text-amber-500 font-mono truncate max-w-[150px]">{rule.pattern}</td>
                  <td className="p-2 text-emerald-500 font-mono truncate max-w-[140px]">{rule.replacement}</td>
                  <td className="p-2 text-indigo-400 font-mono truncate max-w-[140px]">{rule.inversePattern}</td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="w-6 h-6 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-2.5 bg-muted/20 border border-border/50 rounded-md space-y-2">
          <span className="block font-bold text-[10px] text-muted-foreground uppercase">Add Custom Regex Rule</span>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Rule Name (e.g. Domain Anonymizer)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="bg-background h-7 text-xs"
            />
            <Input
              placeholder="Regex Pattern (e.g. \\bcorp\\.com)"
              value={newRulePattern}
              onChange={(e) => setNewRulePattern(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
            <Input
              placeholder="Replacement (e.g. anon.org)"
              value={newRuleReplacement}
              onChange={(e) => setNewRuleReplacement(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
            <Input
              placeholder="Inverse Pattern (for de-anonymization)"
              value={newRuleInverse}
              onChange={(e) => setNewRuleInverse(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={handleAddRule}
              disabled={!newRulePattern || !newRuleReplacement}
              className="flex items-center gap-1 h-7 text-xs"
            >
              <Plus size={12} /> Add Rule
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
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
          >
            <Sparkles size={12} /> Transform & Anonymize
          </Button>
        </div>

        {anonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-emerald-500 font-bold uppercase">
                ✅ Anonymized Context ({Object.keys(substitutionMap).length} Substitutions Mapped)
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(anonymizedResult, "Anonymized context copied to clipboard!")}
                className="h-6 text-[10px] gap-1"
              >
                <Copy size={10} /> Copy Anonymized Context
              </Button>
            </div>
            <Textarea
              readOnly
              value={anonymizedResult}
              className="bg-slate-950 font-mono text-[10px] text-slate-200 h-36 resize-none border-slate-800"
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
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs"
          >
            Restore Original Terms
          </Button>
        </div>

        <Textarea
          placeholder="Paste raw LLM response here to reverse substitution rules..."
          value={llmResponseInput}
          onChange={(e) => setLlmResponseInput(e.target.value)}
          className="bg-muted/30 font-mono text-[10px] h-20 resize-none"
        />

        {deanonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-indigo-400 font-bold uppercase">
                🔓 De-anonymized Output
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(deanonymizedResult, "De-anonymized output copied to clipboard!")}
                className="h-6 text-[10px] gap-1"
              >
                <Copy size={10} /> Copy Restored Output
              </Button>
            </div>
            <Textarea
              readOnly
              value={deanonymizedResult}
              className="bg-slate-950 font-mono text-[10px] text-slate-200 h-32 resize-none border-slate-800"
            />
          </div>
        )}
      </div>
    </div>
  );
}
